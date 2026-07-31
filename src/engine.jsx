import { L, LA, CARDS, EL_KEY, matchCard } from "./data.jsx";
import { SPREADS, dignityOf, METHOD } from "./spreads.jsx";

/* ============================================================
   MOTOR DE LEITURA — 100% local, sem chamadas de rede.
   Gera texto a partir dos dados estruturados das 78 cartas
   (pesquisados e checados) através de bancos de frases variados,
   escolhidos de forma determinística por carta — o mesmo par
   carta+posição sempre produz a mesma leitura, mas cartas
   diferentes não soam como um mesmo molde preenchido.
   ============================================================ */

/* seletor determinístico: mesma entrada → mesmo índice, sempre */
function pick(seed, salt, len) {
  if (!len) return 0;
  let h = (salt * 2654435761) >>> 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h ^ seed.charCodeAt(i), 16777619)) >>> 0;
  return h % len;
}
const of = (arr, seed, salt) => arr[pick(seed, salt, arr.length)];
const joinList = (arr, lang) => {
  const isPT = lang === "pt";
  if (arr.length <= 1) return arr[0] || "";
  return `${arr.slice(0, -1).join(", ")} ${isPT ? "e" : "and"} ${arr[arr.length - 1]}`;
};
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/* ---------- bancos de frases: DEAN (voz prática, guiada pela imagem) ---------- */
const DEAN = {
  open: {
    pt: [
      (n, s1, s2) => `${n} traz à cena ${s1} e ${s2} — a composição já indica o tom da carta antes de qualquer palavra-chave.`,
      (n, s1, s2) => `O primeiro elemento que chama atenção em ${n} é ${s1}; logo ao lado, ${s2} completa o quadro.`,
      (n, s1, s2) => `Em ${n}, a cena se organiza em torno de ${s1}, com ${s2} reforçando a leitura visual.`,
      (n, s1, s2) => `${n} se apresenta através de ${s1} e ${s2}, os dois detalhes que sustentam o significado da carta.`,
    ],
    en: [
      (n, s1, s2) => `${n} brings ${s1} and ${s2} into the scene — the composition sets the card's tone before any keyword does.`,
      (n, s1, s2) => `The first thing that stands out in ${n} is ${s1}; right beside it, ${s2} completes the picture.`,
      (n, s1, s2) => `In ${n}, the scene organises itself around ${s1}, with ${s2} reinforcing the visual reading.`,
      (n, s1, s2) => `${n} presents itself through ${s1} and ${s2}, the two details that carry the card's meaning.`,
    ],
  },
  keyUp: {
    pt: [
      (k) => `Direita, a carta fala de ${k}.`,
      (k) => `No sentido reto, os temas centrais são ${k}.`,
      (k) => `Em posição normal, ${k} resumem o essencial dela.`,
    ],
    en: [
      (k) => `Upright, the card speaks of ${k}.`,
      (k) => `In its normal position, the central themes are ${k}.`,
      (k) => `Right side up, ${k} sum up its essentials.`,
    ],
  },
  keyRev: {
    pt: [
      (k) => `Invertida, essa mesma energia aparece como ${k} — não o oposto do sentido reto, mas a mesma força bloqueada, adiada ou voltada para dentro.`,
      (k) => `De cabeça para baixo, a carta não se torna outra coisa: apenas represa o que faria naturalmente, mostrando-se como ${k}.`,
      (k) => `Nessa posição invertida, o que era fluxo vira contenção — ${k} descrevem melhor o que se sente aqui.`,
    ],
    en: [
      (k) => `Reversed, that same energy shows up as ${k} — not the opposite of the upright sense, but the same force blocked, delayed or turned inward.`,
      (k) => `Upside down, the card does not become something else: it dams what it would naturally do, appearing as ${k}.`,
      (k) => `In this reversed position, what was flow becomes containment — ${k} best describes what is felt here.`,
    ],
  },
  close: {
    pt: [
      (al) => `Na prática: ${al}`,
      (al) => `O ponto de atenção que Dean destacaria é este: ${al}`,
      (al) => `Vale reter, sobretudo, que ${al[0].toLowerCase()}${al.slice(1)}`,
    ],
    en: [
      (al) => `In practice: ${al}`,
      (al) => `The point Dean would flag is this: ${al}`,
      (al) => `Above all, it is worth keeping in mind that ${al[0].toLowerCase()}${al.slice(1)}`,
    ],
  },
};

function deanVoice(card, reversed, lang) {
  const isPT = lang === "pt";
  const name = L(card.name, lang);
  const sym = LA(card.sym, lang);
  const s1 = of(sym, card.id, 11), s2 = of(sym.filter((s) => s !== s1), card.id, 13) || sym[0];
  const kws = LA(reversed ? card.rev : card.up, lang);
  const kwStr = kws.length > 1 ? `${kws.slice(0, -1).join(", ")} ${isPT ? "e" : "and"} ${kws[kws.length - 1]}` : kws[0];
  const other = LA(reversed ? card.up : card.rev, lang);
  const otherStr = other.length > 1 ? `${other.slice(0, -1).join(", ")} ${isPT ? "e" : "and"} ${other[other.length - 1]}` : other[0];
  const al = L(card.al, lang);

  const p1 = of(DEAN.open[lang], card.id, 1)(name, s1, s2);
  const p2 = reversed
    ? of(DEAN.keyRev[lang], card.id, 3)(kwStr) + " " + (isPT ? `No sentido reto, essa mesma carta indicaria ${otherStr}.` : `Upright, this same card would indicate ${otherStr}.`)
    : of(DEAN.keyUp[lang], card.id, 3)(kwStr);
  const p3 = of(DEAN.close[lang], card.id, 5)(al);
  return `${p1} ${p2} ${p3}`;
}

/* ---------- bancos de frases: POLLACK (voz arquetípica, psicológica) ---------- */
const LINE_SENSE = {
  0: "fica fora da sequência numerada — antes e depois de toda a jornada, potencialidade pura que ainda não escolheu forma|stands outside the numbered sequence — before and after the whole journey, pure potentiality that has not yet chosen a form",
  1: "pertence à primeira linha do Louco: o arco do mundo exterior, onde o ego aprende a agir e a se fazer reconhecer|belongs to the Fool's first line: the arc of the outer world, where the ego learns to act and be recognised",
  2: "pertence à segunda linha: o descenso ao subconsciente, o encontro com o que o ego construiu e ainda não sabe sustentar|belongs to the second line: the descent into the subconscious, the meeting with what the ego built and does not yet know how to sustain",
  3: "pertence à terceira linha: o registro superconsciente, onde forças maiores que a biografia pessoal entram em cena|belongs to the third line: the superconscious register, where forces larger than personal biography enter the scene",
};
const NUM_SENSE = {
  1: "a semente pura do naipe, força ainda sem forma|the suit's pure seed, force still without form",
  2: "o primeiro desdobramento em dois — a dualidade que a Sacerdotisa guarda antes de qualquer ato|the first unfolding into two — the duality the High Priestess holds before any act",
  3: "a expansão da dualidade em direção ao mundo, o ponto em que o par se torna gesto|duality's expansion toward the world, the point where the pair becomes gesture",
  4: "a estrutura que estabiliza o que foi expandido — o momento em que o naipe aprende a ficar de pé sozinho|the structure that stabilises what has expanded — the moment the suit learns to stand on its own",
  5: "a crise necessária, o atrito que testa se a estrutura do Quatro era real|the necessary crisis, the friction testing whether the Four's structure was real",
  6: "o equilíbrio reencontrado depois da crise, sem apagar o que ela revelou|the balance found again after the crisis, without erasing what it revealed",
  7: "a avaliação — a pausa em que o naipe mede o que já foi feito antes de seguir|the assessment — the pause where the suit measures what has been done before going on",
  8: "o domínio que só vem da repetição consciente, quando a técnica já não pede esforço|the mastery that comes only from conscious repetition, once technique no longer asks for effort",
  9: "a culminação quase solitária, um degrau antes do fim do ciclo|the almost solitary culmination, one step before the cycle's end",
  10: "o extremo do naipe: ou a conclusão plena da força que ele carrega, ou seu esgotamento|the suit's extreme: either the full completion of the force it carries, or its exhaustion",
};
const COURT_SENSE = {
  11: "o valete: o elemento mais jovem e mais concreto da corte, ainda aprendendo a manejar a própria força|the page: the court's youngest and most concrete member, still learning to handle its own force",
  12: "o cavaleiro: a corte em movimento, força lançada para fora de si mesma|the knight: the court in motion, force cast outward from itself",
  13: "a rainha: a corte voltada para dentro, força que aprendeu a sustentar sem se dissolver|the queen: the court turned inward, force that has learned to sustain without dissolving",
  14: "o rei: a corte em domínio consciente, força que governa a si mesma e ao que está ao redor|the king: the court in conscious mastery, force that governs itself and what surrounds it",
};

const POLLACK = {
  openMajor: {
    pt: [(name, sense) => `Na leitura arquetípica de Pollack, ${name} ${sense}.`,
         (name, sense) => `${name}, no mapa de Pollack, ${sense}.`],
    en: [(name, sense) => `In Pollack's archetypal reading, ${name} ${sense}.`,
         (name, sense) => `${name}, on Pollack's map, ${sense}.`],
  },
  openMinor: {
    pt: [(name, suit, el, num) => `${name} organiza-se no naipe de ${suit} — elemento ${el} — como ${num}.`,
         (name, suit, el, num) => `Dentro do naipe de ${suit}, sob o elemento ${el}, ${name} representa ${num}.`],
    en: [(name, suit, el, num) => `${name} sits within the suit of ${suit} — element ${el} — as ${num}.`,
         (name, suit, el, num) => `Within the suit of ${suit}, under the element ${el}, ${name} stands for ${num}.`],
  },
  openCourt: {
    pt: [(name, suit, court, comb) => `${name} é ${court} do naipe de ${suit}: ${comb}.`],
    en: [(name, suit, court, comb) => `${name} is ${court} of the suit of ${suit}: ${comb}.`],
  },
  portal: {
    pt: [(name) => `Pollack chamaria ${name} de carta-portal: ela abre uma experiência arquetípica que ultrapassa seu sentido literal — a leitura aqui deixa de descrever apenas a situação e passa a descrever a posição do consulente diante dela.`,
         (name) => `${name} é uma das cartas-portal do baralho segundo Pollack — o limiar que ela representa não cabe inteiramente na lista de significados; ela convida a atravessar, não só a interpretar.`],
    en: [(name) => `Pollack would call ${name} a portal card: it opens an archetypal experience beyond its literal sense — the reading here stops merely describing the situation and starts describing the querent's position before it.`,
         (name) => `${name} is one of the deck's portal cards according to Pollack — the threshold it represents does not fit entirely inside a list of meanings; it invites crossing, not only interpreting.`],
  },
  revNote: {
    pt: [(fn) => `Invertida, essa função não desaparece — apenas fica represada, agindo por baixo em vez de à mostra: ${fn}`,
         (fn) => `De cabeça para baixo, a mesma estrutura continua ativa, só que recalcada — o padrão arquetípico segue presente sem ser confrontado: ${fn}`],
    en: [(fn) => `Reversed, this function does not disappear — it only backs up, acting from underneath rather than in the open: ${fn}`,
         (fn) => `Upside down, the same structure stays active, only repressed — the archetypal pattern remains present without being confronted: ${fn}`],
  },
  close: {
    pt: [(al) => `O detalhe que sustenta essa leitura: ${al[0].toLowerCase()}${al.slice(1)}`,
         (al) => `Vale notar: ${al[0].toLowerCase()}${al.slice(1)}`],
    en: [(al) => `The detail underpinning this reading: ${al[0].toLowerCase()}${al.slice(1)}`,
         (al) => `Worth noting: ${al[0].toLowerCase()}${al.slice(1)}`],
  },
};

function pollackVoice(card, reversed, lang) {
  const name = L(card.name, lang);
  const fn = L(card.fn, lang);
  let opening;
  if (card.arc === "M") {
    const sense = L(LINE_SENSE[card.line], lang);
    opening = of(POLLACK.openMajor[lang], card.id, 21)(name, sense);
  } else if (card.n >= 11) {
    const raw = L(COURT_SENSE[card.n], lang);
    const courtName = raw.split(":")[0].trim();
    const comb = raw.split(":")[1].trim();
    opening = of(POLLACK.openCourt[lang], card.id, 23)(name, L(card.suit, lang), courtName, comb);
  } else {
    const num = L(NUM_SENSE[card.n], lang);
    opening = of(POLLACK.openMinor[lang], card.id, 25)(name, L(card.suit, lang), L(card.el, lang), num);
  }
  const portalLine = card.portal ? " " + of(POLLACK.portal[lang], card.id, 27)(name) : "";
  const fnLine = reversed ? " " + of(POLLACK.revNote[lang], card.id, 29)(fn) : " " + fn;
  const closeLine = " " + of(POLLACK.close[lang], card.id, 31)(L(card.al, lang));
  return `${opening}${portalLine}${fnLine}${closeLine}`;
}

/* ---------- diagnóstico estrutural (mesma lógica já validada) ---------- */
function diagnose(slots) {
  const filled = slots.filter((s) => s.card);
  const cards = filled.map((s) => s.card);
  const counts = { M: 0, w: 0, c: 0, s: 0, p: 0 };
  cards.forEach((c) => counts[c.arc]++);
  const absent = ["w", "c", "s", "p"].filter((k) => counts[k] === 0);
  const portals = filled.filter((s) => s.card.portal);
  const numMap = {};
  cards.filter((c) => c.arc !== "M").forEach((c) => { numMap[c.n] = (numMap[c.n] || 0) + 1; });
  const repeats = Object.entries(numMap).filter(([, v]) => v > 1);
  const lines = { 0: 0, 1: 0, 2: 0, 3: 0 };
  cards.filter((c) => c.arc === "M").forEach((c) => { lines[c.line]++; });
  const chain = [];
  for (let i = 0; i < filled.length - 1; i++) {
    const a = filled[i], b = filled[i + 1];
    chain.push({ a, b, d: dignityOf(EL_KEY(a.card), EL_KEY(b.card)) });
  }
  const triads = [];
  for (let i = 1; i < filled.length - 1; i++) {
    const lD = dignityOf(EL_KEY(filled[i - 1].card), EL_KEY(filled[i].card));
    const rD = dignityOf(EL_KEY(filled[i + 1].card), EL_KEY(filled[i].card));
    const flanks = dignityOf(EL_KEY(filled[i - 1].card), EL_KEY(filled[i + 1].card));
    let verdict = null;
    if (lD === "enemy" && rD === "enemy") verdict = "dominated";
    else if (flanks === "enemy") verdict = "isolated";
    else if (lD === "enemy" || rD === "enemy") verdict = "bridged";
    if (verdict) triads.push({ centre: filled[i], verdict });
  }
  return { filled, counts, absent, portals, repeats, lines, chain, triads, total: cards.length,
           majorRatio: cards.length ? counts.M / cards.length : 0 };
}

/* ---------- narração de dignidades / tríades em prosa ---------- */
const DIGN_PROSE = {
  same: { pt: (a, b) => `${a} e ${b} compartilham o mesmo elemento — a energia entre elas se reforça, para o bem ou para o mal (esquema de Mathers, Book T).`,
          en: (a, b) => `${a} and ${b} share the same element — the energy between them is strongly reinforced, for good or ill (Mathers' scheme, Book T).` },
  friend: { pt: (a, b) => `${a} e ${b} são amigáveis entre si — sustentam-se sem disputa, sem que isso signifique neutralidade.`,
            en: (a, b) => `${a} and ${b} are friendly to each other — they support one another without contest, which is not the same as neutrality.` },
  enemy: { pt: (a, b) => `${a} e ${b} são elementos contrários — enfraquecem-se mutuamente.`,
           en: (a, b) => `${a} and ${b} are contrary elements — they weaken each other.` },
};
const TRIAD_PROSE = {
  dominated: { pt: (c) => `${c} está cercada por vizinhas contrárias dos dois lados: sai da tiragem muito enfraquecida.`,
               en: (c) => `${c} is flanked by contrary neighbours on both sides: it leaves the spread greatly weakened.` },
  isolated: { pt: (c) => `As duas vizinhas de ${c} são contrárias entre si e se anulam — leia ${c} como se estivesse sozinha.`,
              en: (c) => `${c}'s two neighbours are contrary to each other and cancel out — read ${c} as if it stood alone.` },
  bridged: { pt: (c) => `Uma vizinha de ${c} é contrária, mas a outra funciona como ponte — ${c} permanece razoavelmente forte.`,
             en: (c) => `One of ${c}'s neighbours is contrary, but the other bridges it — ${c} remains reasonably strong.` },
};

/* ---------- interpretação posicional ---------- */
const POS_LEAD = {
  pt: [(label, name) => `Em "${label}", cai ${name}.`, (label, name) => `${name} ocupa a posição "${label}".`],
  en: [(label, name) => `In "${label}", ${name} falls.`, (label, name) => `${name} occupies the "${label}" position.`],
};
const WHY_LEAD = {
  pt: ["A posição existe por um motivo preciso:", "O porquê desse lugar na tiragem:", "Essa posição não é arbitrária:"],
  en: ["The position exists for a precise reason:", "The reason for this place in the spread:", "This position is not arbitrary:"],
};
function positionalParagraph(slot, lang, dx) {
  const isPT = lang === "pt";
  const card = slot.card;
  const name = L(card.name, lang) + (slot.rev ? (isPT ? " (invertida)" : " (reversed)") : "");
  const label = slot.label ? L(slot.label, lang) : (isPT ? "carta livre" : "free card");
  const kws = LA(slot.rev ? card.rev : card.up, lang).slice(0, 2).join(isPT ? " e " : " and ");

  let out = of(POS_LEAD[lang], card.id + slot.key, 41)(label, name) + " ";
  if (slot.why) {
    out += `${of(WHY_LEAD[lang], card.id + slot.key, 43)} ${L(slot.why, lang)} `;
  }
  out += isPT
    ? `Respondendo diretamente à pergunta da posição: ${kws}.`
    : `Answering the position's question directly: ${kws}.`;

  const chainHere = dx.chain.filter((k) => k.a === slot || k.b === slot);
  chainHere.forEach((k) => {
    const other = k.a === slot ? k.b : k.a;
    out += " " + DIGN_PROSE[k.d][lang](L(card.name, lang), L(other.card.name, lang));
  });
  const triadHere = dx.triads.find((t) => t.centre === slot);
  if (triadHere) out += " " + TRIAD_PROSE[triadHere.verdict][lang](L(card.name, lang));
  return out;
}

/* ---------- síntese integrada ---------- */
const ABSENCE_PROSE = {
  w: "A ausência de Paus sugere que falta impulso para agir, não falta clareza sobre o que fazer.|The absence of Wands suggests that impulse to act is missing, not clarity about what to do.",
  c: "A ausência de Copas indica que o afeto foi excluído do cálculo desta questão.|The absence of Cups indicates that feeling has been excluded from this question's calculation.",
  s: "A ausência de Espadas mostra que a questão não está sendo pensada — só sentida ou agida.|The absence of Swords shows the question is not being thought through — only felt or acted upon.",
  p: "A ausência de Ouros revela que a questão não tem ancoragem material — pode ser bonita e irrealizável.|The absence of Pentacles reveals the question has no material anchor — it may be beautiful and unrealisable.",
};
const LINE_DOM = {
  1: "Predomínio da Linha 1 (Mago ao Carro): o momento pede atenção ao mundo exterior, à maturação do ego, ao que precisa ser aprendido para funcionar socialmente.|Line 1 dominance (Magician to Chariot): the moment calls for attention to the outer world, to the ego's maturation, to what must be learned to function socially.",
  2: "Predomínio da Linha 2 (Força à Temperança): o momento é de busca interior, de descenso ao subconsciente — o encontro com o que o ego construiu e ainda não sabe sustentar.|Line 2 dominance (Strength to Temperance): the moment calls for an inward search, a descent into the subconscious — meeting what the ego built and does not yet know how to sustain.",
  3: "Predomínio da Linha 3 (Diabo ao Mundo): forças superconscientes e arquetípicas estão em jogo, maiores do que a biografia cotidiana.|Line 3 dominance (Devil to World): superconscious and archetypal forces are at play, larger than everyday biography.",
};

function synthesisBlocks(ctx) {
  const { slots, spread, question, context, allReversed, lang, dx } = ctx;
  const isPT = lang === "pt";
  const P = [];

  // 1. distribuição
  const suitLbl = { M: isPT ? "Arcanos Maiores" : "Majors", w: isPT ? "Paus" : "Wands", c: isPT ? "Copas" : "Cups", s: isPT ? "Espadas" : "Swords", p: isPT ? "Ouros" : "Pentacles" };
  const dom = ["M", "w", "c", "s", "p"].reduce((a, b) => (dx.counts[b] > dx.counts[a] ? b : a), "M");
  let s1 = isPT
    ? `Ao todo, ${dx.total} carta${dx.total === 1 ? "" : "s"} compõe${dx.total === 1 ? "" : "m"} esta tiragem${dx.total > 1 ? `, com predominância de ${suitLbl[dom]}` : ""}.`
    : `In total, ${dx.total} card${dx.total === 1 ? "" : "s"} make${dx.total === 1 ? "s" : ""} up this spread${dx.total > 1 ? `, with a predominance of ${suitLbl[dom]}` : ""}.`;
  if (dx.majorRatio >= 0.5 && dx.total > 1) {
    s1 += " " + (isPT
      ? "Mais da metade das cartas são Arcanos Maiores — a situação escapa, em boa parte, ao controle pessoal; há forças arquetípicas maiores do que a escolha cotidiana em jogo."
      : "More than half the cards are Majors — the situation largely escapes personal control; archetypal forces larger than everyday choice are at play.");
  } else if (dx.counts.M === 0 && dx.total > 1) {
    s1 += " " + (isPT
      ? "Nenhum Arcano Maior apareceu: a questão é mundana no sentido exato do termo — sobre escolhas, ofício e circunstância, não sobre destino."
      : "No Major appeared: the question is mundane in the precise sense — about choices, craft and circumstance, not fate.");
  }
  P.push(s1);

  // 2. ausências, portais, repetições
  const bits = [];
  dx.absent.forEach((k) => bits.push(L(ABSENCE_PROSE[k], lang)));
  if (dx.portals.length) {
    const names = joinList(dx.portals.map((s) => L(s.card.name, lang)), lang);
    bits.push(isPT
      ? `${names} ${dx.portals.length > 1 ? "aparecem" : "aparece"} como carta-portal — a leitura, nesse ponto, deixa de só descrever a situação e passa a descrever a posição do consulente diante dela.`
      : `${names} ${dx.portals.length > 1 ? "appear" : "appears"} as a portal card — the reading, at that point, stops merely describing the situation and starts describing the querent's position before it.`);
  }
  dx.repeats.forEach(([n, v]) => {
    bits.push(isPT
      ? `O número ${n} se repete ${v} vezes — reforço claro: ${L(NUM_SENSE[n], lang)[0].toLowerCase()}${L(NUM_SENSE[n], lang).slice(1)} está sublinhado em mais de uma frente.`
      : `The number ${n} repeats ${v} times — a clear reinforcement: ${L(NUM_SENSE[n], lang)[0].toLowerCase()}${L(NUM_SENSE[n], lang).slice(1)} is underlined on more than one front.`);
  });
  if (bits.length) P.push(bits.join(" "));

  // 3. linhas de Pollack + cadeia de dignidades
  const bits2 = [];
  const domLine = [1, 2, 3].reduce((a, b) => (dx.lines[b] > dx.lines[a] ? b : a), 1);
  if (dx.lines[domLine] > 0 && dx.counts.M >= 2) bits2.push(L(LINE_DOM[domLine], lang));
  if (dx.chain.length >= 2) {
    const enemies = dx.chain.filter((k) => k.d === "enemy").length;
    const sames = dx.chain.filter((k) => k.d === "same").length;
    if (enemies > sames && enemies > 0) {
      bits2.push(isPT ? "A cadeia de dignidades entre as cartas mostra mais tensão do que reforço: elementos contrários se sucedem, o que sugere uma questão internamente dividida."
                      : "The dignity chain between the cards shows more tension than reinforcement: contrary elements follow one another, suggesting a question internally divided.");
    } else if (sames >= enemies && sames > 0) {
      bits2.push(isPT ? "A cadeia de dignidades mostra mais reforço do que tensão: os elementos se repetem entre cartas vizinhas, sublinhando o tema principal em vez de dividi-lo."
                      : "The dignity chain shows more reinforcement than tension: elements repeat between neighbouring cards, underlining the main theme rather than dividing it.");
    }
  }
  if (bits2.length) P.push(bits2.join(" "));

  // 4. carta saltadora, mencionada no contexto
  if (context) {
    const hit = matchCard(context);
    if (hit && dx.filled.some((s) => s.card.id === hit.id)) {
      P.push(isPT
        ? `O contexto informado menciona ${L(hit.name, lang)} como carta saltadora — sua emergência não solicitada amplifica o peso interpretativo dela nesta leitura, além do que a posição já indicaria sozinha.`
        : `The stated context mentions ${L(hit.name, lang)} as a jumper card — its unsolicited emergence amplifies its interpretive weight in this reading, beyond what the position alone would indicate.`);
    }
  }

  // 5. aviso protocolar de mão toda invertida
  if (allReversed) {
    P.push(isPT
      ? "Aviso protocolar: a mão inteira foi embaralhada invertida. Nesse contexto, a inversão de uma carta individual deixa de ser um dado metodologicamente independente — fica em aberto se ela ainda distingue algo, ou se é apenas o estado geral do baralho."
      : "Protocol note: the whole hand was shuffled reversed. In this context, an individual card's inversion stops being a methodologically independent signal — it remains open whether it still distinguishes anything, or is simply the deck's general state.");
  }

  // 6. fechamento filosófico
  P.push(isPT
    ? "As cartas não determinam destino: refletem condicionamento somado a resultado provável — o que tende a acontecer se nada mudar. Nenhuma carta é boa ou má em si; a posição, a pergunta e as vizinhas fazem o sentido."
    : "The cards do not determine fate: they reflect conditioning plus likely outcome — what tends to happen if nothing changes. No card is good or bad in itself; position, question and neighbours make the meaning.");

  return P;
}

/* ---------- montagem final: blocos estruturados, sem chamada de rede ---------- */
function generateReading({ slots, spread, question, context, allReversed, lang }) {
  const isPT = lang === "pt";
  const dx = diagnose(slots);
  const filled = dx.filled;
  const blocks = [];

  if (!filled.length) return blocks;

  blocks.push({ type: "h1", text: isPT ? "I. Significados simbólicos" : "I. Symbolic meanings" });
  filled.forEach((s) => {
    const name = L(s.card.name, lang) + (s.rev ? (isPT ? " · invertida" : " · reversed") : "");
    blocks.push({ type: "h2", text: name });
    blocks.push({ type: "voice", label: "Dean", text: deanVoice(s.card, s.rev, lang) });
    blocks.push({ type: "voice", label: "Pollack", text: pollackVoice(s.card, s.rev, lang) });
  });

  blocks.push({ type: "h1", text: isPT ? "II. Interpretação posicional" : "II. Positional interpretation" });
  filled.forEach((s, i) => {
    const label = s.label ? L(s.label, lang) : (isPT ? `Carta ${i + 1}` : `Card ${i + 1}`);
    blocks.push({ type: "h3", text: `${i + 1} · ${label}` });
    if (s.q) blocks.push({ type: "q", text: L(s.q, lang) });
    blocks.push({ type: "p", text: positionalParagraph(s, lang, dx) });
  });

  blocks.push({ type: "h1", text: isPT ? "III. Síntese integrada" : "III. Integrated synthesis" });
  synthesisBlocks({ slots, spread, question, context, allReversed, lang, dx }).forEach((p) => {
    blocks.push({ type: "p", text: p });
  });
  blocks.push({
    type: "note",
    text: isPT
      ? "A camada alquímica de Robert M. Place (The Alchemical Tarot) não está integrada a este motor — a leitura permanece fiel apenas a Dean e a Pollack."
      : "Robert M. Place's alchemical layer (The Alchemical Tarot) is not integrated into this engine — the reading stays faithful to Dean and Pollack alone.",
  });

  return blocks;
}

export { diagnose, generateReading, pick };
