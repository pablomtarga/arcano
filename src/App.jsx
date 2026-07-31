import React, { useState, useEffect, useMemo, useRef } from "react";

/* ============================================================
   ARCANUM — Instrumento de leitura de Tarô (RWS)
   Bilíngue PT-BR / EN. Campos codificados "pt|en".
   ============================================================ */

const L = (s, lang) => {
  if (!s) return "";
  const p = String(s).split("|");
  return lang === "en" ? (p[1] || p[0]) : p[0];
};
const LA = (arr, lang) => (arr || []).map((s) => L(s, lang));

// arc: "M"=Maior, w=Paus/Wands, c=Copas/Cups, s=Espadas/Swords, p=Ouros/Pentacles
// line: linha de Pollack (0 = O Louco; 1,2,3 = as três linhas de sete)
// portal: carta-portal (Pollack)

const MAJORS = [
  { id:"M0", n:0, arc:"M", line:0, name:"O Louco|The Fool", el:"Ar|Air", as:"Urano|Uranus",
    col:["amarelo|yellow","branco|white","vermelho|red"],
    sym:["beira do penhasco|cliff edge","cão branco|white dog","rosa branca|white rose","trouxa no bastão|bundle on a staff","sol alto|high sun"],
    up:["começo|beginning","salto de fé|leap of faith","potencial puro|pure potential","inocência|innocence","liberdade|freedom"],
    rev:["salto adiado|postponed leap","imprudência|recklessness","medo do vazio|fear of the void"],
    fn:"Abre e encerra o ciclo: energia sem forma, anterior e posterior a toda a jornada.|Opens and closes the cycle: formless energy, prior and posterior to the whole journey.",
    al:"O penhasco existe. A carta não promete rede — promete movimento.|The cliff is real. The card promises no net — it promises movement." },
  { id:"M1", n:1, arc:"M", line:1, name:"O Mago|The Magician", el:"Ar|Air", as:"Mercúrio|Mercury",
    col:["vermelho|red","branco|white","amarelo|yellow"],
    sym:["lemniscata|lemniscate","quatro naipes na mesa|four suits on the table","braço acima, braço abaixo|one arm up, one arm down","lírios e rosas|lilies and roses"],
    up:["vontade|will","manifestação|manifestation","recurso disponível|available resource","foco|focus","habilidade|skill"],
    rev:["talento não canalizado|uncanalized talent","manipulação|manipulation","dispersão|scattering"],
    fn:"Primeiro polo da dualidade: a consciência ativa que dirige a energia para fora.|First pole of duality: active consciousness directing energy outward.",
    al:"Ter os quatro naipes na mesa não é o mesmo que usá-los.|Having the four suits on the table is not the same as using them." },
  { id:"M2", n:2, arc:"M", line:1, name:"A Sacerdotisa|The High Priestess", el:"Água|Water", as:"Lua|Moon",
    col:["azul|blue","branco|white","preto|black"],
    sym:["véu de romãs|veil of pomegranates","pilares B e J|pillars B and J","lua crescente aos pés|crescent moon at her feet","rolo TORA|TORA scroll"],
    up:["saber latente|latent knowing","intuição|intuition","silêncio|silence","o que ainda não se formulou|what has not yet been formulated"],
    rev:["intuição abafada|muffled intuition","segredo que pesa|secret that weighs","desconexão do interior|inner disconnection"],
    fn:"Segundo polo: consciência passiva e receptiva. Guarda o que o Mago ainda não sabe nomear.|Second pole: passive, receptive consciousness. Keeps what the Magician cannot yet name.",
    al:"A resposta existe e ainda não está pronta para ser dita.|The answer exists and is not yet ready to be spoken." },
  { id:"M3", n:3, arc:"M", line:1, name:"A Imperatriz|The Empress", el:"Terra|Earth", as:"Vênus|Venus",
    col:["verde|green","dourado|gold","vermelho|red"],
    sym:["campo de trigo|wheat field","coroa de doze estrelas|crown of twelve stars","escudo de Vênus|Venus shield","cachoeira|waterfall","almofadas|cushions"],
    up:["abundância|abundance","fertilidade|fertility","sensualidade|sensuality","criação|creation","cuidado|nurture"],
    rev:["criatividade estagnada|stalled creativity","excesso de cuidado com o outro|over-nurturing others","desconexão do corpo|disconnection from the body"],
    fn:"A matriz que dá forma material ao que a Sacerdotisa guarda em potência.|The matrix that gives material form to what the High Priestess holds in potential.",
    al:"Abundância exige colheita. O trigo maduro apodrece se ninguém corta.|Abundance requires harvest. Ripe wheat rots if no one cuts it." },
  { id:"M4", n:4, arc:"M", line:1, name:"O Imperador|The Emperor", el:"Fogo|Fire", as:"Áries|Aries",
    col:["vermelho|red","laranja|orange","cinza|grey"],
    sym:["trono de pedra|stone throne","cabeças de carneiro|ram heads","ankh e globo|ankh and orb","montanhas áridas|barren mountains","armadura|armour"],
    up:["estrutura|structure","autoridade|authority","limite|boundary","ordem|order","disciplina|discipline"],
    rev:["rigidez|rigidity","autoridade contestada|contested authority","estrutura que aprisiona|structure that imprisons"],
    fn:"Impõe forma e lei ao mundo exterior; a estrutura sem a qual a Imperatriz se dissolve.|Imposes form and law on the outer world; the structure without which the Empress dissolves.",
    al:"As montanhas atrás dele não têm vegetação. Ordem tem custo.|The mountains behind him carry no vegetation. Order has a cost." },
  { id:"M5", n:5, arc:"M", line:1, name:"O Hierofante|The Hierophant", el:"Terra|Earth", as:"Touro|Taurus",
    col:["vermelho|red","cinza|grey","branco|white"],
    sym:["tríplice coroa|triple crown","dois acólitos|two acolytes","chaves cruzadas|crossed keys","pilares cinzentos|grey pillars","gesto de bênção|blessing gesture"],
    up:["tradição|tradition","ensino|teaching","instituição|institution","iniciação formal|formal initiation","valores herdados|inherited values"],
    rev:["dogma questionado|dogma questioned","busca de caminho próprio|search for one's own path","ruptura com a instituição|break with the institution"],
    fn:"A ponte entre o indivíduo e o coletivo: o conhecimento transmitido, não descoberto.|The bridge between individual and collective: knowledge transmitted, not discovered.",
    al:"A doutrina que protege é a mesma que limita.|The doctrine that protects is the one that limits." },
  { id:"M6", n:6, arc:"M", line:1, name:"Os Amantes|The Lovers", el:"Ar|Air", as:"Gêmeos|Gemini",
    col:["azul|blue","amarelo|yellow","verde|green"],
    sym:["anjo Rafael|angel Raphael","árvore de chamas|tree of flames","árvore com serpente|tree with serpent","montanha ao centro|mountain at centre","nudez|nakedness"],
    up:["escolha|choice","união|union","valores em jogo|values at stake","atração|attraction","alinhamento|alignment"],
    rev:["escolha evitada|avoided choice","desalinhamento de valores|misaligned values","vínculo em desequilíbrio|imbalanced bond"],
    fn:"O primeiro ato genuíno de decisão consciente: escolher é abrir mão.|The first genuine act of conscious decision: to choose is to relinquish.",
    al:"As figuras olham para o anjo, não uma para a outra. A escolha é acima do desejo.|The figures look at the angel, not at each other. The choice sits above desire." },
  { id:"M7", n:7, arc:"M", line:1, name:"O Carro|The Chariot", el:"Água|Water", as:"Câncer|Cancer",
    col:["azul|blue","cinza|grey","amarelo|yellow"],
    sym:["duas esfinges preta e branca|black and white sphinxes","dossel de estrelas|canopy of stars","ausência de rédeas|absence of reins","cidade atrás|city behind","escudo alado|winged shield"],
    up:["vitória pela vontade|victory by will","direção|direction","controle de forças opostas|control of opposing forces","partida|departure"],
    rev:["forças em disputa|forces in dispute","avanço sem direção|advance without direction","vontade travada|stalled will"],
    fn:"Encerra a Linha 1: o ego maduro, capaz de dirigir o mundo exterior. Ainda não olhou para dentro.|Closes Line 1: the mature ego, able to steer the outer world. It has not yet looked inward.",
    al:"Não há rédeas. O controle é psíquico e pode ceder a qualquer momento.|There are no reins. Control is psychic and can give way at any moment." },
  { id:"M8", n:8, arc:"M", line:2, name:"A Força|Strength", el:"Fogo|Fire", as:"Leão|Leo",
    col:["branco|white","amarelo|yellow","laranja|orange"],
    sym:["lemniscata|lemniscate","leão dócil|docile lion","guirlanda de flores|garland of flowers","mãos na mandíbula|hands on the jaw","veste branca|white robe"],
    up:["coragem serena|quiet courage","domínio do instinto|mastery of instinct","paciência|patience","persuasão suave|gentle persuasion"],
    rev:["força bruta|brute force","instinto reprimido|repressed instinct","autoconfiança abalada|shaken self-trust"],
    fn:"Abre a Linha 2: a mesma potência do Carro, agora voltada para dentro, sem violência.|Opens Line 2: the Chariot's same power, now turned inward, without violence.",
    al:"O leão não foi morto nem domado — foi convencido. Isso é reversível.|The lion was neither killed nor tamed — it was persuaded. That is reversible." },
  { id:"M9", n:9, arc:"M", line:2, name:"O Eremita|The Hermit", el:"Terra|Earth", as:"Virgem|Virgo",
    col:["cinza|grey","amarelo|yellow","branco|white"],
    sym:["lanterna com estrela de seis pontas|lantern with six-pointed star","cajado|staff","cume nevado|snowy peak","capuz|hood","solidão|solitude"],
    up:["retiro|retreat","busca interior|inner search","discernimento|discernment","orientação|guidance","solidão escolhida|chosen solitude"],
    rev:["isolamento|isolation","recusa em olhar para dentro|refusal to look within","conselho ignorado|advice ignored"],
    fn:"O ego se afasta do mundo para encontrar a luz que já carregava.|The ego withdraws from the world to find the light it already carried.",
    al:"Ele ilumina o próprio próximo passo, não o caminho inteiro.|He lights his own next step, not the whole road." },
  { id:"M10", n:10, arc:"M", line:2, name:"A Roda da Fortuna|Wheel of Fortune", el:"Fogo|Fire", as:"Júpiter|Jupiter",
    col:["amarelo|yellow","azul|blue","laranja|orange"],
    sym:["TARO/ROTA|TARO/ROTA","esfinge, Anúbis, serpente|sphinx, Anubis, serpent","quatro criaturas aladas com livros|four winged creatures with books","letras hebraicas|Hebrew letters"],
    up:["ciclo|cycle","virada|turning point","destino em movimento|destiny in motion","sincronicidade|synchronicity","sorte|fortune"],
    rev:["resistência ao ciclo|resistance to the cycle","atraso|delay","repetição do padrão|pattern repetition"],
    fn:"Centro da Linha 2: mostra que o padrão pessoal está inserido num movimento maior.|Centre of Line 2: shows the personal pattern set inside a larger movement.",
    al:"A roda gira quer você esteja pronto ou não.|The wheel turns whether you are ready or not." },
  { id:"M11", n:11, arc:"M", line:2, name:"A Justiça|Justice", el:"Ar|Air", as:"Libra|Libra",
    col:["vermelho|red","amarelo|yellow","roxo|purple"],
    sym:["espada erguida|raised sword","balança|scales","véu roxo|purple veil","coroa quadrada|square crown","pé aparecendo|foot emerging"],
    up:["equilíbrio|balance","causa e consequência|cause and consequence","verdade|truth","decisão justa|fair decision","responsabilidade|accountability"],
    rev:["desequilíbrio|imbalance","recusa da responsabilidade|refusal of accountability","julgamento parcial|partial judgement"],
    fn:"A avaliação honesta do que foi feito — condição para seguir na Linha 2.|The honest reckoning of what has been done — the condition for continuing along Line 2.",
    al:"A espada aponta para cima, não para o outro. O julgamento é interno.|The sword points up, not at another. The judgement is internal." },
  { id:"M12", n:12, arc:"M", line:2, name:"O Enforcado|The Hanged Man", el:"Água|Water", as:"Netuno|Neptune",
    col:["azul|blue","vermelho|red","amarelo|yellow"],
    sym:["árvore em T (Tau)|T-shaped tree (Tau)","auréola|halo","perna em quatro|leg forming a four","serenidade no rosto|serene face","suspensão voluntária|voluntary suspension"],
    up:["suspensão|suspension","inversão de perspectiva|reversal of perspective","entrega|surrender","pausa fértil|fertile pause","sacrifício|sacrifice"],
    rev:["pausa que virou paralisia|pause turned paralysis","resistência à entrega|resistance to surrender","martírio inútil|useless martyrdom"],
    fn:"A rendição consciente que precede a transformação. Nada avança até o ponto de vista mudar.|The conscious surrender preceding transformation. Nothing moves until the viewpoint changes.",
    al:"A corda está no tornozelo, não no pescoço. Você pode descer — e escolhe não descer.|The rope is at the ankle, not the neck. You can come down — and choose not to." },
  { id:"M13", n:13, arc:"M", line:2, name:"A Morte|Death", el:"Água|Water", as:"Escorpião|Scorpio",
    col:["preto|black","branco|white","vermelho|red"],
    sym:["armadura negra|black armour","rosa branca de cinco pétalas|five-petalled white rose","rio ao fundo|river in the background","sol entre torres|sun between towers","bispo, mulher e criança|bishop, woman and child"],
    up:["fim necessário|necessary ending","transformação|transformation","corte|cut","liberação|release","passagem|passage"],
    rev:["fim adiado|postponed ending","apego ao que morreu|clinging to what has died","transformação bloqueada|blocked transformation"],
    fn:"Não é morte física: é a dissolução do ego construído na Linha 1.|Not physical death: the dissolution of the ego built in Line 1.",
    al:"O sol nasce entre as torres. Mas a criança é a única que olha direto para o cavaleiro.|The sun rises between the towers. Yet the child is the only one looking straight at the rider." },
  { id:"M14", n:14, arc:"M", line:2, name:"A Temperança|Temperance", el:"Fogo|Fire", as:"Sagitário|Sagittarius",
    col:["branco|white","azul|blue","amarelo|yellow"],
    sym:["um pé na água, um em terra|one foot in water, one on land","dois cálices|two cups","triângulo no peito|triangle on the chest","íris|irises","caminho para a coroa|path to the crown"],
    up:["síntese|synthesis","moderação|moderation","cura lenta|slow healing","fluxo|flow","alquimia|alchemy"],
    rev:["desequilíbrio|imbalance","excesso|excess","mistura mal feita|badly made blend"],
    fn:"Fecha a Linha 2: integra os opostos encontrados no descenso interior.|Closes Line 2: integrates the opposites met in the inner descent.",
    al:"A água passa entre os cálices num ângulo impossível. A cura não obedece à física do ego.|The water passes between cups at an impossible angle. Healing does not obey the ego's physics." },
  { id:"M15", n:15, arc:"M", line:3, name:"O Diabo|The Devil", el:"Terra|Earth", as:"Capricórnio|Capricorn",
    col:["preto|black","vermelho|red","carne|flesh"],
    sym:["correntes frouxas|loose chains","tocha invertida|inverted torch","pedestal semicúbico|half-cube pedestal","chifres e caudas nos humanos|horns and tails on the humans","pentagrama invertido|inverted pentagram"],
    up:["apego|attachment","padrão compulsivo|compulsive pattern","materialismo|materialism","sombra|shadow","prisão consentida|consented prison"],
    rev:["consciência da corrente|awareness of the chain","início da libertação|beginning of release","confronto com a sombra|confronting the shadow"],
    fn:"Abre a Linha 3: o encontro com a força arquetípica que o ego não controla.|Opens Line 3: the encounter with archetypal force the ego cannot control.",
    al:"As correntes cabem sobre as cabeças. Ninguém as tirou.|The chains fit over the heads. No one has removed them." },
  { id:"M16", n:16, arc:"M", line:3, name:"A Torre|The Tower", el:"Fogo|Fire", as:"Marte|Mars",
    col:["cinza|grey","vermelho|red","amarelo|yellow"],
    sym:["raio|lightning bolt","coroa expelida|crown blasted off","duas figuras caindo|two falling figures","chamas em forma de yod|yod-shaped flames","rocha nua|bare rock"],
    up:["ruptura|rupture","revelação súbita|sudden revelation","colapso da falsa estrutura|collapse of the false structure","choque|shock"],
    rev:["colapso evitado|averted collapse","ruína contida|contained ruin","medo do desmoronamento|fear of collapse"],
    fn:"Destrói a estrutura do Imperador quando ela deixou de servir à verdade.|Destroys the Emperor's structure once it has ceased to serve truth.",
    al:"A coroa cai primeiro. O que rui é o que você chamava de identidade.|The crown falls first. What collapses is what you called identity." },
  { id:"M17", n:17, arc:"M", line:3, name:"A Estrela|The Star", el:"Ar|Air", as:"Aquário|Aquarius",
    col:["amarelo|yellow","azul|blue","verde|green"],
    sym:["oito estrelas|eight stars","dois jarros|two jugs","um pé na água, um em terra|one foot in water, one on land","íbis na árvore|ibis in the tree","nudez sem vergonha|shameless nakedness"],
    up:["esperança|hope","renovação|renewal","serenidade|serenity","inspiração|inspiration","fé recuperada|restored faith"],
    rev:["fé abalada|shaken faith","desânimo|discouragement","esperança adiada|deferred hope"],
    fn:"A calma que segue a Torre: sem defesas, sem roupa, sem mentira.|The calm following the Tower: no defences, no clothing, no lie.",
    al:"Ela derrama água de volta no lago. Nada aqui é acumulação.|She pours water back into the pool. Nothing here is accumulation." },
  { id:"M18", n:18, arc:"M", line:3, name:"A Lua|The Moon", el:"Água|Water", as:"Peixes|Pisces",
    col:["azul|blue","amarelo|yellow","cinza|grey"],
    sym:["cão e lobo|dog and wolf","lagostim saindo da água|crayfish emerging from water","duas torres|two towers","caminho ao longe|distant path","gotas de orvalho (yods)|dew drops (yods)"],
    up:["ilusão|illusion","inconsciente|the unconscious","medo difuso|diffuse fear","sonho|dream","navegação sem clareza|navigation without clarity"],
    rev:["ilusão se dissipando|illusion dissipating","medo nomeado|fear named","confusão que cede|confusion giving way"],
    fn:"A travessia do território arquetípico mais antigo, anterior à linguagem.|The crossing of the oldest archetypal territory, prior to language.",
    al:"O caminho existe e some entre as torres. Não peça mapa aqui.|The path exists and vanishes between the towers. Do not ask for a map here." },
  { id:"M19", n:19, arc:"M", line:3, name:"O Sol|The Sun", el:"Fogo|Fire", as:"Sol|Sun",
    col:["amarelo|yellow","laranja|orange","vermelho|red"],
    sym:["criança em cavalo branco|child on a white horse","girassóis|sunflowers","estandarte vermelho|red banner","muro|wall","raios retos e ondulados|straight and wavy rays"],
    up:["clareza|clarity","vitalidade|vitality","alegria|joy","sucesso visível|visible success","verdade exposta|exposed truth"],
    rev:["alegria contida|contained joy","clareza parcial|partial clarity","brilho adiado|delayed shine"],
    fn:"A consciência que retorna do mundo da Lua sem perder a inocência.|Consciousness returning from the Moon's world without losing innocence.",
    al:"A criança está do lado de fora do muro. O jardim ficou para trás.|The child is outside the wall. The garden is behind." },
  { id:"M20", n:20, arc:"M", line:3, name:"O Julgamento|Judgement", el:"Fogo|Fire", as:"Plutão|Pluto",
    col:["cinza|grey","branco|white","vermelho|red"],
    sym:["anjo Gabriel|angel Gabriel","trombeta com estandarte|trumpet with banner","figuras erguendo-se dos caixões|figures rising from coffins","montanhas ao fundo|mountains behind","braços abertos|open arms"],
    up:["chamado|calling","avaliação|reckoning","despertar|awakening","renascimento|rebirth","perdão|absolution"],
    rev:["chamado ignorado|calling ignored","autocrítica severa|harsh self-judgement","despertar adiado|postponed awakening"],
    fn:"O chamado que reorganiza a vida inteira em torno de um propósito reconhecido.|The call that reorganises an entire life around a recognised purpose.",
    al:"As figuras não pedem para se levantar. Elas ouvem e se levantam.|The figures do not ask to rise. They hear, and rise." },
  { id:"M21", n:21, arc:"M", line:3, name:"O Mundo|The World", el:"Terra|Earth", as:"Saturno|Saturn",
    col:["verde|green","roxo|purple","azul|blue"],
    sym:["guirlanda oval|oval wreath","quatro criaturas nos cantos|four creatures at the corners","duas varinhas|two wands","echarpe roxa|purple scarf","pernas cruzadas como o Enforcado|legs crossed like the Hanged Man"],
    up:["completude|completion","integração|integration","realização|fulfilment","fechamento de ciclo|cycle closing","pertencimento|belonging"],
    rev:["ciclo quase fechado|cycle nearly closed","conclusão adiada|deferred conclusion","falta um último passo|one last step missing"],
    fn:"Fecha a Linha 3 e o Padrão dos Quatro: a unidade que o Louco carregava como potência.|Closes Line 3 and the Pattern of Four: the unity the Fool carried as potential.",
    al:"A guirlanda é oval, não circular. Mesmo o fim tem uma abertura.|The wreath is oval, not circular. Even the ending has an opening." },
];

const WANDS = [
  { id:"w1", n:1, arc:"w", name:"Ás de Paus|Ace of Wands", as:"Raiz do Fogo|Root of Fire",
    col:["verde|green","cinza|grey","amarelo|yellow"],
    sym:["mão saindo da nuvem|hand from a cloud","bastão brotando folhas|wand sprouting leaves","castelo ao longe|distant castle","yods caindo|falling yods"],
    up:["impulso novo|new impulse","faísca|spark","oportunidade de ação|opportunity for action","desejo|desire"],
    rev:["impulso contido|contained impulse","início adiado|delayed start","energia sem canal|energy without a channel"],
    fn:"A semente pura do elemento Fogo: potencial de movimento antes de qualquer forma.|The pure seed of Fire: potential for movement before any form.",
    al:"O bastão é oferecido, não entregue. Alguém precisa segurá-lo.|The wand is offered, not handed over. Someone must grasp it." },
  { id:"w2", n:2, arc:"w", name:"Dois de Paus|Two of Wands", as:"Marte em Áries|Mars in Aries",
    col:["laranja|orange","cinza|grey","vermelho|red"],
    sym:["globo na mão|globe in hand","um bastão preso à muralha|one wand fixed to the wall","rosas e lírios cruzados|crossed roses and lilies","vista do parapeito|view from the parapet"],
    up:["planejamento|planning","horizonte|horizon","decisão de expandir|decision to expand","poder pessoal|personal power"],
    rev:["medo do desconhecido|fear of the unknown","plano engavetado|shelved plan","conforto que prende|comfort that holds you"],
    fn:"O momento anterior à partida: o mundo já cabe na mão, mas o pé ainda não saiu.|The moment before departure: the world already fits in the hand, but the foot has not moved.",
    al:"Um bastão está preso à parede. Parte de você já decidiu ficar.|One wand is fixed to the wall. Part of you has already decided to stay." },
  { id:"w3", n:3, arc:"w", portal:true, name:"Três de Paus|Three of Wands", as:"Sol em Áries|Sun in Aries",
    col:["amarelo|yellow","laranja|orange","vermelho|red"],
    sym:["figura de costas|figure seen from behind","navios no mar|ships at sea","três bastões plantados|three planted wands","penhasco alto|high cliff"],
    up:["expansão|expansion","espera ativa|active waiting","visão de longo alcance|long-range vision","empreendimento em curso|venture underway"],
    rev:["retorno demorado|delayed return","planos revistos|revised plans","horizonte estreitado|narrowed horizon"],
    fn:"CARTA-PORTAL: a figura de costas convida quem lê a olhar para o mesmo mar. Abre experiência arquetípica além do sentido literal.|PORTAL CARD: the figure's back invites the reader to look at the same sea. Opens archetypal experience beyond literal meaning.",
    al:"Os navios já partiram. O que você vê não está mais sob seu controle.|The ships have sailed. What you see is no longer under your control." },
  { id:"w4", n:4, arc:"w", name:"Quatro de Paus|Four of Wands", as:"Vênus em Áries|Venus in Aries",
    col:["amarelo|yellow","verde|green","azul|blue"],
    sym:["dossel de flores|canopy of flowers","duas figuras com buquês|two figures with bouquets","castelo|castle","ponte e fosso|bridge and moat"],
    up:["celebração|celebration","chegada|arrival","lar|home","estabilidade conquistada|earned stability","marco|milestone"],
    rev:["celebração adiada|postponed celebration","instabilidade doméstica|domestic instability","transição sem marco|transition without a milestone"],
    fn:"O primeiro repouso estável do Fogo: fundação erguida, não fim de jornada.|Fire's first stable rest: a foundation raised, not a journey's end.",
    al:"O dossel tem quatro pilares e nenhuma parede. É abrigo, não fortaleza.|The canopy has four pillars and no walls. It is shelter, not fortress." },
  { id:"w5", n:5, arc:"w", name:"Cinco de Paus|Five of Wands", as:"Saturno em Leão|Saturn in Leo",
    col:["verde|green","amarelo|yellow","vermelho|red"],
    sym:["cinco jovens|five youths","bastões sem alvo|wands with no target","roupas de cores diferentes|clothes of different colours","terreno irregular|uneven ground"],
    up:["conflito|conflict","competição|competition","ruído de vozes|noise of voices","teste|testing"],
    rev:["conflito interno|internal conflict","evitação do embate|avoidance of confrontation","trégua|truce"],
    fn:"A fricção necessária quando várias vontades ocupam o mesmo espaço.|The necessary friction when several wills occupy the same space.",
    al:"Ninguém está ferido. É ensaio, e ainda assim consome sua energia.|No one is injured. It is rehearsal, and it still drains you." },
  { id:"w6", n:6, arc:"w", name:"Seis de Paus|Six of Wands", as:"Júpiter em Leão|Jupiter in Leo",
    col:["vermelho|red","verde|green","branco|white"],
    sym:["coroa de louros|laurel wreath","cavalo branco encoberto|draped white horse","multidão ao redor|surrounding crowd","bastão com guirlanda|wand with a garland"],
    up:["reconhecimento|recognition","vitória pública|public victory","confiança|confidence","boa notícia|good news"],
    rev:["reconhecimento negado|withheld recognition","vitória sem público|victory without an audience","confiança abalada|shaken confidence"],
    fn:"O retorno triunfal: o Fogo validado pelo olhar coletivo.|The triumphal return: Fire validated by the collective gaze.",
    al:"A multidão sustenta o triunfo. Se ela dispersa, o que resta?|The crowd sustains the triumph. If it disperses, what remains?" },
  { id:"w7", n:7, arc:"w", name:"Sete de Paus|Seven of Wands", as:"Marte em Leão|Mars in Leo",
    col:["verde|green","amarelo|yellow","azul|blue"],
    sym:["terreno elevado|high ground","seis bastões vindos de baixo|six wands from below","calçados diferentes|mismatched shoes","postura defensiva|defensive stance"],
    up:["defesa de posição|defence of position","perseverança|perseverance","coragem sob pressão|courage under pressure","limite afirmado|boundary asserted"],
    rev:["exaustão da defesa|defence exhaustion","posição cedida|position surrendered","luta desnecessária|unnecessary fight"],
    fn:"Manter o que foi conquistado no Seis exige mais energia do que conquistar.|Holding what the Six won costs more energy than the winning did.",
    al:"Os sapatos não combinam. Você entrou nessa briga sem se preparar.|The shoes do not match. You entered this fight unprepared." },
  { id:"w8", n:8, arc:"w", name:"Oito de Paus|Eight of Wands", as:"Mercúrio em Sagitário|Mercury in Sagittarius",
    col:["amarelo|yellow","verde|green","azul|blue"],
    sym:["oito bastões em voo|eight wands in flight","nenhuma figura humana|no human figure","rio e colina|river and hill","céu limpo|clear sky"],
    up:["velocidade|speed","mensagem a caminho|message in transit","acontecimentos rápidos|rapid events","alinhamento|alignment"],
    rev:["atraso|delay","mensagem retida|withheld message","ritmo desacelerado|slowed pace"],
    fn:"Movimento puro sem agente: a única carta do baralho sem figura nem cenário ocupado.|Pure movement without an agent: the only card with neither figure nor occupied scene.",
    al:"Os bastões ainda estão no ar. Nada aterrissou.|The wands are still in the air. Nothing has landed." },
  { id:"w9", n:9, arc:"w", name:"Nove de Paus|Nine of Wands", as:"Lua em Sagitário|Moon in Sagittarius",
    col:["amarelo|yellow","cinza|grey","laranja|orange"],
    sym:["cabeça enfaixada|bandaged head","oito bastões em fila atrás|eight wands lined up behind","olhar de esguelha|sideways glance","apoio no bastão|leaning on a wand"],
    up:["resiliência|resilience","vigilância|vigilance","penúltimo esforço|penultimate effort","cicatriz|scar"],
    rev:["defesa paranoica|paranoid defence","exaustão|exhaustion","muro desnecessário|unnecessary wall"],
    fn:"A memória das batalhas anteriores tornada postura corporal.|The memory of past battles turned into bodily posture.",
    al:"A cerca atrás dele já está de pé. Ele defende algo que já está seguro.|The fence behind him already stands. He is defending something already safe." },
  { id:"w10", n:10, arc:"w", name:"Dez de Paus|Ten of Wands", as:"Saturno em Sagitário|Saturn in Sagittarius",
    col:["amarelo|yellow","verde|green","marrom|brown"],
    sym:["dez bastões em braçada|ten wands in an armful","rosto oculto pela carga|face hidden by the load","aldeia à frente|village ahead","tronco curvado|bent trunk"],
    up:["sobrecarga|overload","responsabilidade acumulada|accumulated responsibility","último trecho|final stretch","peso do sucesso|weight of success"],
    rev:["carga sendo largada|load being set down","delegação|delegation","recusa do peso|refusal of the burden"],
    fn:"O Fogo levado ao extremo: a força que criou agora esmaga quem criou.|Fire at its extreme: the force that created now crushes its creator.",
    al:"Os bastões tapam a visão. A aldeia está perto e ele não a vê.|The wands block his sight. The village is near and he cannot see it." },
  { id:"wP", n:11, arc:"w", name:"Valete de Paus|Page of Wands", as:"Terra do Fogo|Earth of Fire",
    col:["laranja|orange","amarelo|yellow","vermelho|red"],
    sym:["salamandras na túnica|salamanders on the tunic","pena vermelha|red feather","deserto e pirâmides|desert and pyramids","olhar para o topo do bastão|gaze at the wand's tip"],
    up:["entusiasmo iniciante|beginner's enthusiasm","notícia inspiradora|inspiring news","curiosidade|curiosity","exploração|exploration"],
    rev:["entusiasmo sem direção|enthusiasm without direction","notícia frustrada|frustrated news","impaciência|impatience"],
    fn:"O elemento Terra dentro do Fogo: a ideia ainda inexperiente que quer virar prática.|Earth within Fire: the still-inexperienced idea seeking practice.",
    al:"As salamandras da túnica ainda estão com a cauda aberta — incompletas.|The salamanders on the tunic still have open tails — incomplete." },
  { id:"wN", n:12, arc:"w", name:"Cavaleiro de Paus|Knight of Wands", as:"Ar do Fogo|Air of Fire",
    col:["amarelo|yellow","laranja|orange","vermelho|red"],
    sym:["cavalo empinado|rearing horse","armadura com salamandras|armour with salamanders","pirâmides|pyramids","pena flutuando|floating plume"],
    up:["ação impetuosa|impetuous action","paixão|passion","partida súbita|sudden departure","carisma|charisma"],
    rev:["impulsividade|impulsiveness","projeto abandonado|abandoned project","pressa que custa caro|haste with a high price"],
    fn:"O Ar dentro do Fogo: a ação que se acende rápido e nem sempre sustenta.|Air within Fire: action that ignites fast and does not always sustain.",
    al:"O cavalo empina — ele não está avançando ainda.|The horse rears — he is not advancing yet." },
  { id:"wQ", n:13, arc:"w", name:"Rainha de Paus|Queen of Wands", as:"Água do Fogo|Water of Fire",
    col:["amarelo|yellow","laranja|orange","preto|black"],
    sym:["girassol|sunflower","gato preto aos pés|black cat at her feet","leões no trono|lions on the throne","postura frontal e aberta|open frontal posture"],
    up:["calor pessoal|personal warmth","autoconfiança|self-assurance","magnetismo|magnetism","liderança acolhedora|welcoming leadership"],
    rev:["autoconfiança abalada|shaken self-assurance","ciúme|jealousy","calor retirado|warmth withdrawn"],
    fn:"A Água dentro do Fogo: a paixão que aprendeu a se sustentar sem se consumir.|Water within Fire: passion that has learned to sustain itself without burning out.",
    al:"O gato preto olha para fora da carta. Ela vê o que você ainda não vê.|The black cat looks out of the card. She sees what you do not yet see." },
  { id:"wK", n:14, arc:"w", name:"Rei de Paus|King of Wands", as:"Fogo do Fogo|Fire of Fire",
    col:["laranja|orange","amarelo|yellow","verde|green"],
    sym:["leões e salamandras no trono|lions and salamanders on the throne","lagarto pequeno ao lado|small lizard beside him","postura de perfil|profile posture","coroa de chamas|crown of flames"],
    up:["visão empreendedora|entrepreneurial vision","autoridade natural|natural authority","ousadia madura|mature boldness","inspiração de outros|inspiring others"],
    rev:["autoritarismo|authoritarianism","visão imposta|imposed vision","impaciência com o processo|impatience with process"],
    fn:"O Fogo do Fogo: a vontade em estado mais puro e mais governável.|Fire of Fire: will in its purest and most governable state.",
    al:"Ele está de perfil, prestes a se levantar. Nenhum rei de Paus fica sentado por muito tempo.|He is in profile, about to rise. No King of Wands stays seated long." },
];

const CUPS = [
  { id:"c1", n:1, arc:"c", name:"Ás de Copas|Ace of Cups", as:"Raiz da Água|Root of Water",
    col:["azul|blue","branco|white","verde|green"],
    sym:["pomba com hóstia|dove with a wafer","cinco jorros de água|five streams of water","lótus no lago|lotuses on the pool","letra W ou M invertida|inverted W or M"],
    up:["abertura emocional|emotional opening","amor nascente|nascent love","graça|grace","transbordamento|overflow"],
    rev:["afeto contido|contained affection","coração fechado|closed heart","fonte bloqueada|blocked source"],
    fn:"A semente pura da Água: sentimento antes de ter objeto.|The pure seed of Water: feeling before it has an object.",
    al:"A taça já transborda. Não cabe mais — cabe distribuir.|The cup already overflows. There is no more room — only sharing." },
  { id:"c2", n:2, arc:"c", name:"Dois de Copas|Two of Cups", as:"Vênus em Câncer|Venus in Cancer",
    col:["azul|blue","vermelho|red","amarelo|yellow"],
    sym:["caduceu com cabeça de leão|caduceus with a lion's head","duas serpentes|two serpents","guirlanda na cabeça dela|garland on her head","troca de olhares|exchange of gazes"],
    up:["união|union","reciprocidade|reciprocity","atração mútua|mutual attraction","pacto|pact"],
    rev:["desequilíbrio na troca|imbalanced exchange","ruptura|rupture","vínculo por confirmar|bond awaiting confirmation"],
    fn:"O primeiro encontro real entre dois: dualidade emocional consciente.|The first real meeting between two: conscious emotional duality.",
    al:"O leão alado acima deles é a paixão. Está acima, não sob controle.|The winged lion above them is passion. It is above, not under control." },
  { id:"c3", n:3, arc:"c", name:"Três de Copas|Three of Cups", as:"Mercúrio em Câncer|Mercury in Cancer",
    col:["vermelho|red","branco|white","amarelo|yellow"],
    sym:["três mulheres dançando|three women dancing","taças erguidas|raised cups","abóbora e frutas|pumpkin and fruit","roda de mãos|circle of hands"],
    up:["celebração compartilhada|shared celebration","amizade|friendship","comunidade|community","colheita afetiva|emotional harvest"],
    rev:["excesso social|social excess","círculo desfeito|broken circle","celebração vazia|hollow celebration"],
    fn:"O sentimento que se expande do par para o grupo.|Feeling expanding from the pair into the group.",
    al:"É colheita. Toda colheita marca o fim de uma estação.|It is harvest. Every harvest marks a season's end." },
  { id:"c4", n:4, arc:"c", name:"Quatro de Copas|Four of Cups", as:"Lua em Câncer|Moon in Cancer",
    col:["verde|green","azul|blue","vermelho|red"],
    sym:["figura sob a árvore|figure under a tree","braços cruzados|crossed arms","três taças no chão|three cups on the ground","quarta taça oferecida pela nuvem|fourth cup offered from a cloud"],
    up:["apatia|apathy","insatisfação|dissatisfaction","introspecção|introspection","oferta não vista|unseen offer"],
    rev:["saindo do torpor|emerging from numbness","aceitação da oferta|accepting the offer","reengajamento|re-engagement"],
    fn:"A Água estagnada: o excesso de contemplação que se torna recusa.|Stagnant Water: contemplation in excess turning into refusal.",
    al:"A quarta taça está ali há tempo. A recusa é ativa, não passiva.|The fourth cup has been there a while. The refusal is active, not passive." },
  { id:"c5", n:5, arc:"c", name:"Cinco de Copas|Five of Cups", as:"Marte em Escorpião|Mars in Scorpio",
    col:["preto|black","cinza|grey","vermelho|red"],
    sym:["manto negro|black cloak","três taças derramadas|three spilled cups","duas taças de pé atrás|two upright cups behind","ponte e castelo|bridge and castle","rio|river"],
    up:["luto|grief","perda|loss","arrependimento|regret","foco no que se foi|focus on what is gone"],
    rev:["aceitação|acceptance","virada do olhar|turning of the gaze","luto atravessado|grief moved through"],
    fn:"A dor que estreita a visão até que só o perdido seja visível.|Pain that narrows vision until only what is lost remains visible.",
    al:"Duas taças continuam de pé, e a ponte leva a algum lugar. Nada disso está no campo de visão dele.|Two cups still stand, and the bridge leads somewhere. None of it is in his field of view." },
  { id:"c6", n:6, arc:"c", name:"Seis de Copas|Six of Cups", as:"Sol em Escorpião|Sun in Scorpio",
    col:["amarelo|yellow","verde|green","branco|white"],
    sym:["duas crianças|two children","taças com flores brancas|cups with white flowers","aldeia antiga|old village","figura se afastando ao fundo|figure walking away in the background"],
    up:["memória|memory","nostalgia|nostalgia","inocência|innocence","reencontro|reunion","doação|giving"],
    rev:["preso ao passado|stuck in the past","idealização da memória|idealised memory","retorno impossível|impossible return"],
    fn:"O tempo emocional voltado para trás: a Água guardada na lembrança.|Emotional time turned backwards: Water stored in memory.",
    al:"Alguém sai de cena ao fundo. A nostalgia sempre custa um presente.|Someone leaves the scene in the background. Nostalgia always costs a present." },
  { id:"c7", n:7, arc:"c", name:"Sete de Copas|Seven of Cups", as:"Vênus em Escorpião|Venus in Scorpio",
    col:["cinza|grey","azul|blue","amarelo|yellow"],
    sym:["silhueta de costas|silhouette from behind","rosto, figura velada, serpente|face, veiled figure, serpent","castelo, joias, coroa de louros|castle, jewels, laurel wreath","dragão|dragon","nuvens|clouds"],
    up:["opções demais|too many options","fantasia|fantasy","projeção|projection","escolha adiada|deferred choice"],
    rev:["clareza emergindo|clarity emerging","opção escolhida|option chosen","ilusão desfeita|illusion dispelled"],
    fn:"A Água sem contorno: o desejo que se multiplica em imagens sem se decidir.|Water without contour: desire multiplying into images without deciding.",
    al:"Só uma taça contém algo real. A carta não diz qual.|Only one cup holds something real. The card does not say which." },
  { id:"c8", n:8, arc:"c", portal:true, name:"Oito de Copas|Eight of Cups", as:"Saturno em Peixes|Saturn in Pisces",
    col:["azul|blue","vermelho|red","cinza|grey"],
    sym:["figura de costas com cajado|figure from behind with a staff","oito taças com um vão|eight cups with a gap","lua em eclipse|eclipsing moon","montanhas e água|mountains and water"],
    up:["partida|departure","abandono consciente|conscious abandonment","busca de sentido|search for meaning","virar as costas|turning away"],
    rev:["retorno|return","partida adiada|postponed departure","hesitação em sair|hesitation to leave"],
    fn:"CARTA-PORTAL: a saída deliberada do que funcionava mas deixou de bastar.|PORTAL CARD: the deliberate exit from what worked but stopped being enough.",
    al:"As taças não estão quebradas. Ele deixa algo intacto para trás.|The cups are not broken. He leaves something intact behind." },
  { id:"c9", n:9, arc:"c", name:"Nove de Copas|Nine of Cups", as:"Júpiter em Peixes|Jupiter in Pisces",
    col:["azul|blue","amarelo|yellow","vermelho|red"],
    sym:["nove taças em arco|nine cups in an arc","mesa coberta|draped table","braços cruzados|crossed arms","chapéu vermelho|red hat"],
    up:["satisfação|satisfaction","desejo atendido|wish granted","prazer|pleasure","conforto|comfort"],
    rev:["satisfação superficial|shallow satisfaction","desejo cumprido sem sentido|wish fulfilled without meaning","excesso|excess"],
    fn:"O contentamento pessoal da Água — completo em si e ainda solitário.|Water's personal contentment — complete in itself and still solitary.",
    al:"Ele está sozinho diante de nove taças. É a única cadeira à mesa.|He sits alone before nine cups. It is the only chair at the table." },
  { id:"c10", n:10, arc:"c", name:"Dez de Copas|Ten of Cups", as:"Marte em Peixes|Mars in Pisces",
    col:["azul|blue","verde|green","amarelo|yellow"],
    sym:["arco-íris de taças|rainbow of cups","casal de braços abertos|couple with open arms","duas crianças dançando|two dancing children","casa e rio|house and river"],
    up:["plenitude afetiva|emotional fullness","harmonia familiar|family harmony","paz duradoura|lasting peace","pertencimento|belonging"],
    rev:["harmonia aparente|apparent harmony","ideal distante|distant ideal","desconexão dentro do vínculo|disconnection within the bond"],
    fn:"O ápice social da Água: o sentimento que se tornou estrutura de vida.|Water's social peak: feeling that has become a life structure.",
    al:"O arco-íris está no céu, não no chão. É promessa, não posse.|The rainbow is in the sky, not on the ground. It is promise, not possession." },
  { id:"cP", n:11, arc:"c", name:"Valete de Copas|Page of Cups", as:"Terra da Água|Earth of Water",
    col:["azul|blue","rosa|pink","amarelo|yellow"],
    sym:["peixe saindo da taça|fish emerging from the cup","túnica com flores de lótus|tunic with lotus flowers","mar ondulado atrás|wavy sea behind","boina azul|blue beret"],
    up:["mensagem afetiva|emotional message","sensibilidade|sensitivity","imaginação|imagination","proposta sincera|sincere offer"],
    rev:["sensibilidade ferida|wounded sensitivity","mensagem não enviada|message unsent","imaturidade emocional|emotional immaturity"],
    fn:"A Terra dentro da Água: o sentimento novo que procura forma concreta.|Earth within Water: new feeling looking for concrete form.",
    al:"O peixe fala e ele não parece surpreso. O inconsciente já está falando com você.|The fish speaks and he seems unsurprised. The unconscious is already speaking to you." },
  { id:"cN", n:12, arc:"c", name:"Cavaleiro de Copas|Knight of Cups", as:"Ar da Água|Air of Water",
    col:["cinza|grey","azul|blue","vermelho|red"],
    sym:["elmo e botas com asas|winged helmet and boots","cavalo em passo lento|slow-stepping horse","rio à frente|river ahead","peixe na sobreveste|fish on the surcoat"],
    up:["proposta romântica|romantic proposal","idealismo|idealism","convite|invitation","charme|charm"],
    rev:["promessa vazia|empty promise","idealismo desiludido|disillusioned idealism","avanço lento demais|advance too slow"],
    fn:"O Ar dentro da Água: o sentimento que virou mensagem e se põe em movimento.|Air within Water: feeling turned message and set in motion.",
    al:"O cavalo caminha, não galopa. Não espere pressa desta oferta.|The horse walks, it does not gallop. Expect no haste from this offer." },
  { id:"cQ", n:13, arc:"c", name:"Rainha de Copas|Queen of Cups", as:"Água da Água|Water of Water",
    col:["azul|blue","branco|white","cinza|grey"],
    sym:["taça fechada e ornamentada|ornate covered cup","trono com sereias|throne with mermaids","pedras aos pés|stones at her feet","olhar fixo na taça|gaze fixed on the cup"],
    up:["empatia profunda|deep empathy","intuição emocional|emotional intuition","acolhimento|holding space","serenidade|serenity"],
    rev:["absorção do sentimento alheio|absorbing others' feelings","limite emocional frágil|fragile emotional boundary","retraimento|withdrawal"],
    fn:"A Água da Água: a capacidade de sentir sem se dissolver no que se sente.|Water of Water: the ability to feel without dissolving into the feeling.",
    al:"A única taça fechada do baralho. Ela sabe algo que não mostra.|The only closed cup in the deck. She knows something she does not show." },
  { id:"cK", n:14, arc:"c", name:"Rei de Copas|King of Cups", as:"Fogo da Água|Fire of Water",
    col:["azul|blue","amarelo|yellow","vermelho|red"],
    sym:["trono sobre mar agitado|throne on a turbulent sea","navio ao fundo|ship in the background","peixe saltando|leaping fish","amuleto de peixe|fish amulet","pés sem tocar a água|feet not touching the water"],
    up:["maturidade emocional|emotional maturity","conselho compassivo|compassionate counsel","controle sereno|serene control","diplomacia|diplomacy"],
    rev:["emoção reprimida|repressed emotion","frieza calculada|calculated coldness","manipulação afetiva|emotional manipulation"],
    fn:"O Fogo da Água: a vontade aplicada ao sentimento — governar sem endurecer.|Fire of Water: will applied to feeling — to govern without hardening.",
    al:"O trono flutua num mar agitado. A calma dele é trabalho constante, não natureza.|The throne floats on a rough sea. His calm is constant work, not nature." },
];

const SWORDS = [
  { id:"s1", n:1, arc:"s", name:"Ás de Espadas|Ace of Swords", as:"Raiz do Ar|Root of Air",
    col:["cinza|grey","branco|white","amarelo|yellow"],
    sym:["mão saindo da nuvem|hand from a cloud","coroa com oliveira e palma|crown with olive and palm","montanhas recortadas|jagged mountains","seis yods|six yods"],
    up:["clareza cortante|cutting clarity","verdade|truth","decisão|decision","ideia definidora|defining idea"],
    rev:["clareza confusa|clouded clarity","verdade usada como arma|truth used as a weapon","decisão travada|stalled decision"],
    fn:"A semente pura do Ar: o pensamento que separa uma coisa da outra.|The pure seed of Air: the thought that separates one thing from another.",
    al:"A lâmina corta nos dois sentidos. Clareza também machuca.|The blade cuts both ways. Clarity wounds too." },
  { id:"s2", n:2, arc:"s", name:"Dois de Espadas|Two of Swords", as:"Lua em Libra|Moon in Libra",
    col:["cinza|grey","branco|white","azul|blue"],
    sym:["venda nos olhos|blindfold","espadas cruzadas no peito|swords crossed at the chest","mar com rochas|sea with rocks","lua crescente|crescent moon","banco de pedra|stone bench"],
    up:["impasse|impasse","decisão evitada|avoided decision","trégua tensa|tense truce","informação bloqueada|blocked information"],
    rev:["venda caindo|blindfold slipping","impasse rompido|impasse broken","verdade admitida|truth admitted"],
    fn:"O Ar em equilíbrio forçado: pensar duas coisas ao mesmo tempo é não decidir.|Air in forced balance: holding two things at once is choosing neither.",
    al:"A venda foi colocada por ela mesma. O mar atrás continua se movendo.|The blindfold is self-applied. The sea behind keeps moving." },
  { id:"s3", n:3, arc:"s", name:"Três de Espadas|Three of Swords", as:"Saturno em Libra|Saturn in Libra",
    col:["cinza|grey","vermelho|red","azul|blue"],
    sym:["coração atravessado|pierced heart","três espadas|three swords","chuva|rain","nuvens carregadas|heavy clouds","ausência de figura humana|no human figure"],
    up:["dor nomeada|named pain","separação|separation","verdade que fere|wounding truth","luto agudo|acute grief"],
    rev:["dor sendo processada|pain being processed","cicatrização|healing over","recusa em sentir|refusal to feel"],
    fn:"O ponto em que o intelecto atravessa o afeto — e o afeto sente.|The point where intellect pierces feeling — and feeling registers it.",
    al:"Não há ninguém na carta. Esta dor não tem culpado a apontar.|There is no one in the card. This pain has no one to blame." },
  { id:"s4", n:4, arc:"s", name:"Quatro de Espadas|Four of Swords", as:"Júpiter em Libra|Jupiter in Libra",
    col:["cinza|grey","amarelo|yellow","vermelho|red"],
    sym:["efígie sobre o túmulo|effigy on a tomb","três espadas na parede|three swords on the wall","uma espada sob o corpo|one sword beneath the body","vitral|stained glass window","mãos em prece|hands in prayer"],
    up:["repouso|rest","convalescença|convalescence","retiro necessário|necessary retreat","suspensão|suspension"],
    rev:["retomada|resuming","repouso interrompido|interrupted rest","recusa em parar|refusal to stop"],
    fn:"O Ar em silêncio: a mente que precisa parar para não se despedaçar.|Air in silence: the mind that must stop to avoid shattering.",
    al:"A figura não está morta — está deitada. Repouso não é desistência.|The figure is not dead — it is lying down. Rest is not surrender." },
  { id:"s5", n:5, arc:"s", name:"Cinco de Espadas|Five of Swords", as:"Vênus em Aquário|Venus in Aquarius",
    col:["cinza|grey","verde|green","vermelho|red"],
    sym:["figura recolhendo espadas|figure gathering swords","sorriso de canto|smirk","duas figuras se afastando|two figures walking away","nuvens irregulares|ragged clouds","mar agitado|choppy sea"],
    up:["vitória vazia|hollow victory","conflito com custo|costly conflict","humilhação|humiliation","autointeresse|self-interest"],
    rev:["reconciliação|reconciliation","recuo do embate|withdrawal from the fight","custo reconhecido|cost acknowledged"],
    fn:"O Ar usado para vencer em vez de compreender.|Air used to win rather than to understand.",
    al:"Ele ganhou e ficou sozinho. Pergunte se este é o preço que você aceita.|He won and stands alone. Ask whether this is the price you accept." },
  { id:"s6", n:6, arc:"s", portal:true, name:"Seis de Espadas|Six of Swords", as:"Mercúrio em Aquário|Mercury in Aquarius",
    col:["cinza|grey","azul|blue","verde|green"],
    sym:["barqueiro com vara|ferryman with a pole","mulher encapuzada e criança|hooded woman and child","seis espadas fincadas no barco|six swords planted in the boat","água agitada de um lado, calma do outro|rough water on one side, calm on the other"],
    up:["travessia|passage","transição|transition","afastamento necessário|necessary distancing","cura em movimento|healing in motion"],
    rev:["travessia adiada|postponed crossing","bagagem que não se larga|baggage not put down","retorno ao que se deixou|return to what was left"],
    fn:"CARTA-PORTAL: a passagem literal de um estado a outro. Abre experiência arquetípica de transição.|PORTAL CARD: the literal passage from one state to another. Opens the archetypal experience of transition.",
    al:"As espadas viajam junto. Você leva a dor para o outro lado.|The swords travel along. You carry the pain to the other side." },
  { id:"s7", n:7, arc:"s", name:"Sete de Espadas|Seven of Swords", as:"Lua em Aquário|Moon in Aquarius",
    col:["amarelo|yellow","laranja|orange","vermelho|red"],
    sym:["figura na ponta dos pés|figure on tiptoe","cinco espadas nos braços|five swords in his arms","duas espadas deixadas|two swords left behind","acampamento ao fundo|camp in the background","olhar para trás|backward glance"],
    up:["estratégia solitária|solitary strategy","furtividade|stealth","meia-verdade|half-truth","atalho|shortcut"],
    rev:["estratégia exposta|strategy exposed","confissão|confession","devolução|returning what was taken"],
    fn:"O Ar operando por desvio: a inteligência que evita o confronto direto.|Air operating by detour: intelligence avoiding direct confrontation.",
    al:"Ele deixou duas espadas para trás. O plano já está incompleto.|He left two swords behind. The plan is already incomplete." },
  { id:"s8", n:8, arc:"s", name:"Oito de Espadas|Eight of Swords", as:"Júpiter em Gêmeos|Jupiter in Gemini",
    col:["cinza|grey","vermelho|red","amarelo|yellow"],
    sym:["figura amarrada e vendada|bound, blindfolded figure","oito espadas em semicírculo|eight swords in a half-circle","castelo na colina|castle on the hill","lama sob os pés|mud underfoot","pés livres|free feet"],
    up:["aprisionamento mental|mental imprisonment","vitimização|victimhood","restrição percebida|perceived restriction","paralisia|paralysis"],
    rev:["laços afrouxando|bonds loosening","saída percebida|exit noticed","autorresponsabilidade|self-responsibility"],
    fn:"A prisão construída pelo próprio pensamento — a mais difícil de ver.|The prison built by thought itself — the hardest kind to see.",
    al:"As espadas não formam círculo fechado. Há saída atrás dela.|The swords do not form a closed circle. There is a way out behind her." },
  { id:"s9", n:9, arc:"s", name:"Nove de Espadas|Nine of Swords", as:"Marte em Gêmeos|Mars in Gemini",
    col:["preto|black","branco|white","vermelho|red"],
    sym:["figura sentada na cama|figure sitting up in bed","rosto nas mãos|face in hands","nove espadas na parede|nine swords on the wall","colcha com rosas e signos|quilt with roses and zodiac signs","entalhe de duelo na cama|duel carving on the bed"],
    up:["angústia|anguish","insônia|insomnia","culpa|guilt","medo noturno|night fear","ruminação|rumination"],
    rev:["o medo dito em voz alta|fear spoken aloud","alívio ao amanhecer|relief at dawn","pesadelo se dissipando|nightmare dissipating"],
    fn:"O Ar voltado contra si mesmo na ausência de luz e de testemunha.|Air turned against itself in the absence of light and witness.",
    al:"As espadas estão na parede, não no corpo. O sofrimento é real e a ferida não.|The swords are on the wall, not in the body. The suffering is real and the wound is not." },
  { id:"s10", n:10, arc:"s", name:"Dez de Espadas|Ten of Swords", as:"Sol em Gêmeos|Sun in Gemini",
    col:["preto|black","amarelo|yellow","vermelho|red"],
    sym:["figura caída com dez espadas|fallen figure with ten swords","céu negro|black sky","água imóvel|still water","alvorada no horizonte|dawn on the horizon","mão em bênção|hand in benediction"],
    up:["fim absoluto|absolute ending","fundo do poço|rock bottom","traição|betrayal","colapso do ciclo mental|collapse of the mental cycle"],
    rev:["recuperação lenta|slow recovery","o pior já passou|the worst has passed","resistência ao fim|resistance to the ending"],
    fn:"O Ar levado ao extremo: o pensamento que se esgota completamente.|Air at its extreme: thought exhausting itself entirely.",
    al:"O céu está negro e o horizonte, dourado. Ambas as coisas são verdadeiras.|The sky is black and the horizon golden. Both are true." },
  { id:"sP", n:11, arc:"s", name:"Valete de Espadas|Page of Swords", as:"Terra do Ar|Earth of Air",
    col:["verde|green","cinza|grey","vermelho|red"],
    sym:["espada erguida com as duas mãos|sword raised in both hands","céu ventoso|windy sky","dez pássaros|ten birds","terreno acidentado|uneven ground","olhar para trás|looking backward"],
    up:["curiosidade aguda|sharp curiosity","vigilância|watchfulness","notícia|news","aprendizado mental|mental learning"],
    rev:["mexerico|gossip","curiosidade invasiva|invasive curiosity","informação mal usada|misused information"],
    fn:"A Terra dentro do Ar: a ideia jovem que quer testar seu próprio gume.|Earth within Air: the young idea wanting to test its own edge.",
    al:"Ele olha para trás enquanto avança. A vigilância aqui é medo disfarçado.|He looks back while moving forward. The watchfulness here is fear in disguise." },
  { id:"sN", n:12, arc:"s", name:"Cavaleiro de Espadas|Knight of Swords", as:"Ar do Ar|Air of Air",
    col:["cinza|grey","vermelho|red","branco|white"],
    sym:["cavalo em galope|galloping horse","espada apontada à frente|sword pointed forward","árvores curvadas pelo vento|wind-bent trees","pássaros dispersos|scattered birds","capa esvoaçante|streaming cloak"],
    up:["investida|charge","argumento direto|direct argument","velocidade mental|mental speed","determinação|determination"],
    rev:["agressividade verbal|verbal aggression","pressa sem estratégia|haste without strategy","investida que se esgota|charge that burns out"],
    fn:"O Ar do Ar: o intelecto em estado puro de ataque, sem freio corporal.|Air of Air: intellect in pure attacking state, with no bodily brake.",
    al:"Ele não olha para onde vai. Só para onde a espada aponta.|He does not look where he is going. Only where the sword points." },
  { id:"sQ", n:13, arc:"s", name:"Rainha de Espadas|Queen of Swords", as:"Água do Ar|Water of Air",
    col:["cinza|grey","azul|blue","branco|white"],
    sym:["espada erguida na vertical|sword held upright","mão esquerda estendida|left hand extended","borboletas e querubim no trono|butterflies and cherub on the throne","nuvens abaixo dela|clouds below her","perfil severo|severe profile"],
    up:["lucidez|lucidity","limite claro|clear boundary","honestidade|honesty","experiência destilada|distilled experience"],
    rev:["frieza|coldness","crítica excessiva|excessive criticism","isolamento pela lucidez|isolation through clarity"],
    fn:"A Água dentro do Ar: a inteligência informada pela perda — clara sem ser cruel.|Water within Air: intelligence informed by loss — clear without cruelty.",
    al:"A mão estendida convida. A espada permanece erguida. Ambas ao mesmo tempo.|The extended hand invites. The sword stays raised. Both at once." },
  { id:"sK", n:14, arc:"s", name:"Rei de Espadas|King of Swords", as:"Fogo do Ar|Fire of Air",
    col:["azul|blue","roxo|purple","cinza|grey"],
    sym:["borboletas e silfos no trono|butterflies and sylphs on the throne","espada levemente inclinada|slightly tilted sword","dois pássaros|two birds","olhar frontal|frontal gaze","nuvens estáticas|static clouds"],
    up:["julgamento imparcial|impartial judgement","autoridade intelectual|intellectual authority","ética|ethics","conselho estruturado|structured counsel"],
    rev:["racionalização|rationalisation","autoridade fria|cold authority","poder do argumento sobre o vínculo|argument prevailing over bond"],
    fn:"O Fogo do Ar: a vontade aplicada ao pensamento — decidir e sustentar a decisão.|Fire of Air: will applied to thought — to decide and stand by the decision.",
    al:"A espada pende levemente. Nem mesmo ele está totalmente imparcial.|The sword tilts slightly. Not even he is entirely impartial." },
];

const PENTS = [
  { id:"p1", n:1, arc:"p", name:"Ás de Ouros|Ace of Pentacles", as:"Raiz da Terra|Root of Earth",
    col:["verde|green","branco|white","dourado|gold"],
    sym:["mão saindo da nuvem|hand from a cloud","jardim com lírios|garden with lilies","arco de sebe|hedge archway","montanha ao longe|distant mountain","caminho|path"],
    up:["oportunidade material|material opportunity","novo recurso|new resource","semente concreta|concrete seed","saúde|health"],
    rev:["oportunidade não aproveitada|opportunity untaken","recurso mal aplicado|misapplied resource","ganho adiado|delayed gain"],
    fn:"A semente pura da Terra: a possibilidade que ainda exige plantio.|The pure seed of Earth: possibility that still requires planting.",
    al:"O arco leva às montanhas. A oferta é um começo de caminho, não o destino.|The arch leads to the mountains. The offer is the start of a road, not the destination." },
  { id:"p2", n:2, arc:"p", name:"Dois de Ouros|Two of Pentacles", as:"Júpiter em Capricórnio|Jupiter in Capricorn",
    col:["laranja|orange","verde|green","azul|blue"],
    sym:["lemniscata verde|green lemniscate","dois ouros em malabarismo|two juggled pentacles","navios em ondas altas|ships on high waves","chapéu alto|tall hat","postura em dança|dancing stance"],
    up:["equilíbrio dinâmico|dynamic balance","adaptação|adaptation","prioridades em jogo|competing priorities","flexibilidade|flexibility"],
    rev:["sobrecarga|overload","desequilíbrio|imbalance","uma bola caindo|one ball dropping"],
    fn:"A Terra em movimento: manter dois pesos exige dança, não força.|Earth in motion: holding two weights takes dance, not force.",
    al:"Os navios atrás enfrentam ondas altas. O equilíbrio é sobre mar revolto.|The ships behind face high waves. The balance is over rough sea." },
  { id:"p3", n:3, arc:"p", name:"Três de Ouros|Three of Pentacles", as:"Marte em Capricórnio|Mars in Capricorn",
    col:["cinza|grey","preto|black","amarelo|yellow"],
    sym:["escultor no banco|sculptor on a bench","monge e arquiteto com planta|monk and architect with plans","arco de catedral|cathedral arch","três ouros no arco|three pentacles in the arch"],
    up:["colaboração|collaboration","competência reconhecida|recognised competence","obra em construção|work under construction","aprendizado aplicado|applied learning"],
    rev:["colaboração truncada|broken collaboration","competência ignorada|competence overlooked","trabalho em desalinhamento|misaligned work"],
    fn:"A Terra socializada: o ofício individual encontrando a estrutura coletiva.|Socialised Earth: individual craft meeting collective structure.",
    al:"O artesão está de pé sobre o banco, acima dos que trazem o plano.|The craftsman stands on the bench, above those holding the plan." },
  { id:"p4", n:4, arc:"p", name:"Quatro de Ouros|Four of Pentacles", as:"Sol em Capricórnio|Sun in Capricorn",
    col:["preto|black","vermelho|red","cinza|grey"],
    sym:["ouro abraçado ao peito|pentacle clutched to the chest","um ouro sobre a coroa|one pentacle on the crown","dois sob os pés|two under the feet","cidade ao fundo|city behind","banco isolado|isolated bench"],
    up:["retenção|holding on","segurança material|material security","controle|control","poupança|saving"],
    rev:["afrouxamento|loosening","generosidade|generosity","medo de perder exposto|fear of loss exposed"],
    fn:"A Terra imobilizada: a estabilidade que virou rigidez.|Immobilised Earth: stability turned rigid.",
    al:"Com quatro ouros ocupados, ele não tem uma mão livre.|With four pentacles occupied, he has no free hand." },
  { id:"p5", n:5, arc:"p", name:"Cinco de Ouros|Five of Pentacles", as:"Mercúrio em Touro|Mercury in Taurus",
    col:["branco|white","cinza|grey","amarelo|yellow"],
    sym:["dois mendigos na neve|two beggars in the snow","vitral iluminado|lit stained glass window","muletas|crutches","bandagem|bandage","sino no pescoço|bell at the neck"],
    up:["privação|deprivation","exclusão|exclusion","dificuldade material|material hardship","fé abalada|shaken faith"],
    rev:["recuperação|recovery","ajuda aceita|help accepted","fim do inverno|end of winter"],
    fn:"A Terra em falta: a experiência de estar do lado de fora.|Earth in scarcity: the experience of being outside.",
    al:"O vitral está aceso e eles passam direto. O abrigo existe e não é procurado.|The window is lit and they walk past. Shelter exists and is not sought." },
  { id:"p6", n:6, arc:"p", portal:true, name:"Seis de Ouros|Six of Pentacles", as:"Lua em Touro|Moon in Taurus",
    col:["vermelho|red","cinza|grey","amarelo|yellow"],
    sym:["balança na mão esquerda|scales in the left hand","moedas caindo|falling coins","dois mendigos ajoelhados|two kneeling beggars","túnica vermelha|red robe"],
    up:["generosidade|generosity","troca desigual|unequal exchange","recebimento|receiving","equilíbrio de dar e receber|balance of giving and receiving"],
    rev:["doação com condição|giving with strings","dívida|debt","poder disfarçado de caridade|power disguised as charity"],
    fn:"CARTA-PORTAL: expõe a arquitetura do poder dentro de todo ato de dar.|PORTAL CARD: exposes the architecture of power inside every act of giving.",
    al:"Ele segura a balança. Quem mede decide quanto cabe a cada um.|He holds the scales. Whoever measures decides each person's share." },
  { id:"p7", n:7, arc:"p", name:"Sete de Ouros|Seven of Pentacles", as:"Saturno em Touro|Saturn in Taurus",
    col:["verde|green","laranja|orange","azul|blue"],
    sym:["figura apoiada na enxada|figure leaning on a hoe","sete ouros no arbusto|seven pentacles on the bush","um ouro no chão|one pentacle on the ground","olhar contemplativo|contemplative gaze"],
    up:["avaliação|assessment","paciência|patience","investimento em curso|investment in progress","dúvida sobre o retorno|doubt about the return"],
    rev:["impaciência|impatience","colheita precipitada|premature harvest","esforço reavaliado|effort reassessed"],
    fn:"A Terra no tempo: o intervalo entre o plantio e a colheita, onde nasce a dúvida.|Earth in time: the interval between planting and harvest, where doubt is born.",
    al:"Ele parou de trabalhar para olhar. A pausa é a decisão real desta carta.|He has stopped working to look. The pause is this card's real decision." },
  { id:"p8", n:8, arc:"p", name:"Oito de Ouros|Eight of Pentacles", as:"Sol em Virgem|Sun in Virgo",
    col:["amarelo|yellow","azul|blue","cinza|grey"],
    sym:["artesão no banco|craftsman at the bench","seis ouros pendurados|six pentacles hung up","um na mão, um no chão|one in hand, one on the ground","cidade ao longe|town in the distance","avental|apron"],
    up:["dedicação|dedication","aprimoramento|refinement","repetição produtiva|productive repetition","ofício|craft"],
    rev:["repetição sem sentido|meaningless repetition","perfeccionismo|perfectionism","aprendizado interrompido|interrupted apprenticeship"],
    fn:"A Terra disciplinada: o domínio construído por acúmulo de horas.|Disciplined Earth: mastery built by accumulated hours.",
    al:"A cidade está longe e ele está de costas para ela.|The town is far and his back is to it." },
  { id:"p9", n:9, arc:"p", portal:true, name:"Nove de Ouros|Nine of Pentacles", as:"Vênus em Virgem|Venus in Virgo",
    col:["amarelo|yellow","verde|green","vermelho|red"],
    sym:["falcão encapuzado na mão|hooded falcon on the hand","parreiras carregadas|laden grapevines","caracol no chão|snail on the ground","mansão ao fundo|manor in the background","jardim murado|walled garden"],
    up:["autossuficiência|self-sufficiency","conquista pessoal|personal achievement","refinamento|refinement","desfrute merecido|earned enjoyment"],
    rev:["independência custosa|costly independence","solidão dourada|gilded solitude","dependência disfarçada|disguised dependence"],
    fn:"CARTA-PORTAL: a autonomia material como estado arquetípico — e seu preço.|PORTAL CARD: material autonomy as an archetypal state — and its price.",
    al:"O falcão está encapuzado. Ela domesticou algo selvagem em si para chegar aqui.|The falcon is hooded. She has tamed something wild in herself to arrive here." },
  { id:"p10", n:10, arc:"p", portal:true, name:"Dez de Ouros|Ten of Pentacles", as:"Mercúrio em Virgem|Mercury in Virgo",
    col:["amarelo|yellow","branco|white","vermelho|red"],
    sym:["ancião com dois cães|old man with two dogs","casal e criança|couple and child","arco com brasão|arch with a coat of arms","dez ouros em Árvore da Vida|ten pentacles in a Tree of Life pattern","balança no brasão|scales on the crest"],
    up:["legado|legacy","riqueza estabelecida|established wealth","família|family","permanência|permanence","raízes|roots"],
    rev:["legado em disputa|contested legacy","estrutura familiar tensionada|strained family structure","segurança questionada|questioned security"],
    fn:"CARTA-PORTAL: o padrão dos dez ouros desenha a Árvore da Vida — a matéria revelando o mapa espiritual inteiro.|PORTAL CARD: the ten pentacles trace the Tree of Life — matter revealing the entire spiritual map.",
    al:"O ancião está fora do arco, à margem da cena que ele construiu.|The old man sits outside the arch, at the edge of the scene he built." },
  { id:"pP", n:11, arc:"p", name:"Valete de Ouros|Page of Pentacles", as:"Terra da Terra|Earth of Earth",
    col:["verde|green","marrom|brown","amarelo|yellow"],
    sym:["ouro erguido e contemplado|pentacle raised and contemplated","campo arado|ploughed field","bosque ao fundo|grove in the background","postura absorta|absorbed stance"],
    up:["estudo|study","novo ofício|new craft","proposta prática|practical offer","foco paciente|patient focus"],
    rev:["procrastinação|procrastination","estudo sem aplicação|study without application","proposta que não se concretiza|offer that does not materialise"],
    fn:"A Terra da Terra: o começo mais concreto possível — aprender fazendo.|Earth of Earth: the most concrete beginning possible — learning by doing.",
    al:"O campo já está arado e ele não está trabalhando nele.|The field is already ploughed and he is not working it." },
  { id:"pN", n:12, arc:"p", name:"Cavaleiro de Ouros|Knight of Pentacles", as:"Ar da Terra|Air of Earth",
    col:["preto|black","verde|green","vermelho|red"],
    sym:["cavalo negro parado|stationary black horse","ouro estendido na palma|pentacle held out on the palm","campo arado|ploughed field","armadura completa|full armour","ramo verde no elmo|green sprig on the helm"],
    up:["método|method","confiabilidade|reliability","progresso lento e certo|slow, sure progress","compromisso cumprido|commitment kept"],
    rev:["estagnação|stagnation","excesso de cautela|excessive caution","rotina que virou inércia|routine turned inertia"],
    fn:"O Ar dentro da Terra: o único cavaleiro parado — o movimento é intenção, não velocidade.|Air within Earth: the only stationary knight — movement here is intention, not speed.",
    al:"O cavalo está imóvel. Confiabilidade e inércia usam a mesma armadura.|The horse is still. Reliability and inertia wear the same armour." },
  { id:"pQ", n:13, arc:"p", name:"Rainha de Ouros|Queen of Pentacles", as:"Água da Terra|Water of Earth",
    col:["verde|green","vermelho|red","amarelo|yellow"],
    sym:["coelho no canto inferior|rabbit in the lower corner","caramanchão florido|flowering arbour","cabras e frutas no trono|goats and fruit on the throne","olhar sobre o ouro no colo|gaze on the pentacle in her lap"],
    up:["cuidado prático|practical care","nutrição|nourishment","abundância gerida|managed abundance","presença corporal|bodily presence"],
    rev:["cuidado que se esquece de si|care that forgets itself","dependência material|material dependence","abundância retida|withheld abundance"],
    fn:"A Água dentro da Terra: o afeto que se expressa como provisão concreta.|Water within Earth: affection expressed as concrete provision.",
    al:"O coelho é fertilidade e também fuga. Ela pode estar se escondendo no cuidado.|The rabbit is fertility and also flight. She may be hiding inside the caretaking." },
  { id:"pK", n:14, arc:"p", name:"Rei de Ouros|King of Pentacles", as:"Fogo da Terra|Fire of Earth",
    col:["preto|black","verde|green","dourado|gold"],
    sym:["manto de parreiras|grapevine robe","cabeças de touro no trono|bull heads on the throne","castelo atrás|castle behind","armadura sob o manto|armour beneath the robe","pé sobre cabeça de javali|foot on a boar's head"],
    up:["prosperidade consolidada|consolidated prosperity","provisão|provision","domínio material|material mastery","generosidade estável|steady generosity"],
    rev:["apego ao patrimônio|attachment to holdings","controle pelo dinheiro|control through money","estagnação confortável|comfortable stagnation"],
    fn:"O Fogo da Terra: a vontade que constrói e mantém o mundo material.|Fire of Earth: the will that builds and maintains the material world.",
    al:"Há armadura sob o manto de uvas. Ele ainda se prepara para uma guerra que já venceu.|There is armour under the grape robe. He still readies for a war he already won." },
];

const CARDS = [...MAJORS, ...WANDS, ...CUPS, ...SWORDS, ...PENTS].map((c) => ({
  ...c,
  el: c.arc === "M" ? c.el : { w:"Fogo|Fire", c:"Água|Water", s:"Ar|Air", p:"Terra|Earth" }[c.arc],
  suit: c.arc === "M" ? "Arcanos Maiores|Major Arcana"
      : { w:"Paus|Wands", c:"Copas|Cups", s:"Espadas|Swords", p:"Ouros|Pentacles" }[c.arc],
}));

const EL_KEY = (c) => L(c.el, "en"); // Fire | Water | Air | Earth

/* ---------- TIRAGENS ----------
   Cada posição carrega: rótulo, a pergunta que ela faz e por que ocupa aquele lugar.
   c/r = coluna/linha na grade de renderização. rot = carta atravessada.        */

const SPREADS = [
  {
    id:"one", cols:1, rows:1,
    name:"Carta Única|Single Card",
    use:"Foco diário, pergunta fechada, ou clarificação de outra carta.|Daily focus, a closed question, or clarifying another card.",
    why:"Sem posição, a carta responde com sua totalidade. É a tiragem mais difícil de ler bem justamente porque nada restringe o campo — o significado precisa vir inteiro da carta e da pergunta.|With no position, the card answers with its totality. It is the hardest spread to read well precisely because nothing narrows the field — meaning must come entirely from the card and the question.",
    pos:[{c:1,r:1,label:"A Carta|The Card",q:"O que preciso ver agora?|What do I need to see right now?",why:"Posição neutra: não modifica a carta, apenas a expõe.|A neutral position: it does not modify the card, only exposes it."}]
  },
  {
    id:"three", cols:3, rows:1,
    name:"Três Cartas|Three Cards",
    use:"Movimento, causalidade, ou decomposição de uma situação em três forças.|Movement, causality, or breaking a situation into three forces.",
    why:"Três é o número mínimo para haver narrativa: começo, meio e fim; ou tese, antítese e síntese. A leitura da esquerda para a direita cria um vetor de tempo, e a carta do meio recebe dignidade elemental dos dois lados — é a única com dois vizinhos.|Three is the minimum for narrative: beginning, middle, end; or thesis, antithesis, synthesis. Reading left to right creates a time vector, and the middle card receives elemental dignity from both sides — the only one with two neighbours.",
    variants:[
      {n:"Passado · Presente · Futuro|Past · Present · Future", d:"Vetor temporal. Use quando a pergunta é sobre trajetória.|Temporal vector. Use when the question is about trajectory."},
      {n:"Situação · Ação · Resultado|Situation · Action · Outcome", d:"Vetor causal. Use quando a pergunta é sobre o que fazer.|Causal vector. Use when the question is about what to do."},
      {n:"O que ajuda · O que atrapalha · O que não vejo|Helps · Hinders · Unseen", d:"Vetor diagnóstico. Use quando a pergunta é sobre um bloqueio.|Diagnostic vector. Use when the question is about a blockage."},
      {n:"Corpo · Mente · Espírito|Body · Mind · Spirit", d:"Vetor vertical. Use para leituras de estado interno.|Vertical vector. Use for readings of inner state."}
    ],
    pos:[
      {c:1,r:1,label:"Primeira|First",q:"O que está atrás ou abaixo disso?|What lies behind or beneath this?",why:"A origem. Recebe dignidade só da direita — sua influência é unidirecional.|The origin. It receives dignity only from the right — its influence is one-directional."},
      {c:2,r:1,label:"Segunda|Second",q:"Onde está o núcleo?|Where is the core?",why:"O eixo. Única carta modificada pelos dois lados; se as vizinhas forem elementos contrários entre si, elas se anulam e esta carta lê-se sozinha (regra de Mathers).|The axis. The only card modified from both sides; if the flanking cards are contrary to each other they cancel out and this card reads alone (Mathers' rule)."},
      {c:3,r:1,label:"Terceira|Third",q:"Para onde isso tende?|Where does this tend?",why:"O destino provável. Recebe dignidade só da esquerda.|The likely outcome. It receives dignity only from the left."}
    ]
  },
  {
    id:"celtic", cols:4, rows:4,
    name:"Cruz Celta|Celtic Cross",
    use:"Situação complexa, com muitas forças em jogo e um horizonte a médio prazo.|A complex situation with many forces at play and a mid-range horizon.",
    why:"Publicada por A. E. Waite em 'The Pictorial Key to the Tarot' (1910), sob o nome 'An Ancient Celtic Method of Divination' — nome de marketing, não linhagem histórica: o método vem do meio da Golden Dawn vitoriana, não da Irlanda pré-cristã. Reconhecer isso importa: a Cruz Celta é um sistema desenhado, e portanto discutível. As posições 3/4 e 5/6 variam entre escolas. A geometria tem duas metades: a Cruz (1–6) é o que está acontecendo, o Bastão (7–10) é o que age sobre isso a partir de fora e para onde vai.|Published by A. E. Waite in 'The Pictorial Key to the Tarot' (1910) as 'An Ancient Celtic Method of Divination' — a marketing name, not a historical lineage: the method comes from the Victorian Golden Dawn milieu, not pre-Christian Ireland. Recognising this matters: the Celtic Cross is a designed system, and therefore arguable. Positions 3/4 and 5/6 vary between schools. The geometry has two halves: the Cross (1–6) is what is happening, the Staff (7–10) is what acts on it from outside and where it is going.",
    pos:[
      {c:2,r:2,label:"Centro|Heart of the Matter",q:"Qual é a situação em si?|What is the situation itself?",why:"Ocupa o cruzamento dos eixos porque tudo mais é medido em relação a ela.|It occupies the crossing of the axes because everything else is measured against it."},
      {c:2,r:2,rot:true,label:"Cruzamento|The Crossing",q:"O que atravessa isso — obstáculo ou apoio?|What crosses this — obstacle or support?",why:"Deitada sobre a primeira: a única posição do baralho que não se lê como boa ou má, só como força transversal. Uma carta favorável aqui ainda atravessa.|Laid across the first: the only position that reads as neither good nor bad, only as a transverse force. A favourable card here still cuts across."},
      {c:2,r:3,label:"Base|The Foundation",q:"Qual é a raiz inconsciente disso?|What is the unconscious root of this?",why:"Abaixo, porque sustenta a situação sem ser vista. É o solo.|Below, because it holds the situation up without being seen. It is the ground."},
      {c:1,r:2,label:"Passado Recente|Recent Past",q:"O que acabou de sair de cena?|What has just left the scene?",why:"À esquerda, seguindo a direção da leitura: o que já passou pelo centro.|To the left, following reading direction: what has already passed through the centre."},
      {c:2,r:1,label:"Possível Resultado|Possible Outcome",q:"O que está consciente, no alto da mente?|What is conscious, at the top of the mind?",why:"Acima: o objetivo declarado, a meta que se enxerga. Waite deixou esta posição ambígua e há escolas que a trocam com a 3.|Above: the stated goal, the aim in view. Waite left this position ambiguous and some schools swap it with position 3."},
      {c:3,r:2,label:"Futuro Próximo|Near Future",q:"O que entra em cena a seguir?|What enters the scene next?",why:"À direita: o que vai atravessar o centro em seguida. Prazo curto, não conclusão.|To the right: what will cross the centre next. Short term, not conclusion."},
      {c:4,r:4,label:"Eu|The Self",q:"Como estou me posicionando nisso?|How am I positioning myself in this?",why:"Base do Bastão: tudo que sobe a partir daqui parte da sua própria postura.|Base of the Staff: everything rising from here starts with your own stance."},
      {c:4,r:3,label:"Ambiente|Environment",q:"O que as pessoas e as circunstâncias em volta estão fazendo?|What are the people and circumstances around doing?",why:"Logo acima do Eu, porque o ambiente responde à sua postura antes de responder a qualquer outra coisa.|Just above the Self, because the environment responds to your stance before it responds to anything else."},
      {c:4,r:2,label:"Esperanças & Medos|Hopes & Fears",q:"O que desejo e temo — muitas vezes a mesma coisa?|What do I hope for and fear — often the same thing?",why:"A posição mais subestimada da tiragem. Waite juntou esperança e medo num só lugar deliberadamente: no mesmo assunto, elas costumam ser a mesma imagem vista de dois ângulos.|The most underrated position in the spread. Waite deliberately put hope and fear in one place: on the same subject they are usually the same image seen from two angles.",key:true},
      {c:4,r:1,label:"Resultado|Outcome",q:"Para onde tudo isso converge?|Where does all of this converge?",why:"Topo: resultado provável se nada mudar, não sentença. Lê-se sempre contra a posição 9.|Top: the likely result if nothing changes, not a verdict. Always read it against position 9."}
    ]
  },
  {
    id:"horseshoe", cols:7, rows:1,
    name:"Ferradura|Horseshoe",
    use:"Panorama de uma questão prática, entre a leveza de três cartas e o peso da Cruz Celta.|An overview of a practical question, between the lightness of three cards and the weight of the Celtic Cross.",
    why:"Sete cartas em arco. Cada carta tem exatamente dois vizinhos (salvo as pontas), o que faz desta a melhor tiragem para praticar dignidades elementais em cadeia: o arco inteiro pode ser lido como uma sequência de tríades sobrepostas.|Seven cards in an arc. Each card has exactly two neighbours (except the ends), making this the best spread for practising elemental dignities in a chain: the whole arc can be read as a series of overlapping triads.",
    pos:[
      {c:1,r:1,label:"Passado|Past",q:"De onde isso vem?|Where does this come from?",why:"Ponta esquerda: só influencia, não é influenciada.|Left end: it influences only, it is not influenced."},
      {c:2,r:1,label:"Presente|Present",q:"Onde está agora?|Where is it now?",why:"Primeira carta com dois vizinhos — já entra em dignidade.|The first card with two neighbours — dignity begins here."},
      {c:3,r:1,label:"Influências Ocultas|Hidden Influences",q:"O que age sem ser visto?|What acts unseen?",why:"Posicionada antes do conselho porque o conselho depende dela.|Placed before the advice because the advice depends on it."},
      {c:4,r:1,label:"Obstáculo|Obstacle",q:"O que impede?|What stands in the way?",why:"Centro exato do arco: o ponto de maior tensão da tiragem.|The exact centre of the arc: the spread's point of greatest tension."},
      {c:5,r:1,label:"Ambiente|Environment",q:"O que os outros trazem?|What do others bring?",why:"Depois do obstáculo, porque o meio social reage ao problema, não o precede.|After the obstacle, because the social field reacts to the problem rather than preceding it."},
      {c:6,r:1,label:"Conselho|Advice",q:"Qual é a ação indicada?|What action is indicated?",why:"Penúltima: só faz sentido depois de mapeado tudo o que age.|Penultimate: it only makes sense once everything acting has been mapped."},
      {c:7,r:1,label:"Resultado|Outcome",q:"O que resulta se o conselho for seguido?|What results if the advice is followed?",why:"Ponta direita: condicionada à anterior, não independente dela.|Right end: conditioned by the previous card, not independent of it."}
    ]
  },
  {
    id:"paths", cols:5, rows:3,
    name:"Duas Estradas|Two Roads",
    use:"Decisão entre dois caminhos concretos e nomeáveis.|A decision between two concrete, nameable paths.",
    why:"A geometria é o argumento: uma raiz comum se abre em dois ramos paralelos, lidos em espelho. Compare posição por posição (2 contra 5, 3 contra 6, 4 contra 7) em vez de ler cada ramo inteiro — o contraste posicional é onde a resposta aparece. A carta 1 impede a armadilha mais comum desta tiragem: decidir sem saber o que está realmente em jogo.|The geometry is the argument: a shared root opens into two parallel branches, read in mirror. Compare position against position (2 vs 5, 3 vs 6, 4 vs 7) rather than reading each branch whole — the answer appears in the positional contrast. Card 1 blocks this spread's commonest trap: deciding without knowing what is actually at stake.",
    pos:[
      {c:1,r:2,label:"A Questão|The Question",q:"O que está verdadeiramente em jogo?|What is truly at stake?",why:"Raiz comum aos dois ramos: se esta carta contradiz a pergunta feita, a pergunta estava errada.|Root common to both branches: if this card contradicts the question asked, the question was wrong."},
      {c:2,r:1,label:"Estrada A · Se eu seguir|Road A · If I take it",q:"O que essa escolha exige?|What does this choice require?",why:"Primeiro degrau do ramo superior.|First step of the upper branch."},
      {c:3,r:1,label:"Estrada A · O que ganho|Road A · What I gain",q:"O que se abre?|What opens up?",why:"Ganho lido antes da perda, para não decidir por medo.|Gain read before loss, so the decision is not made out of fear."},
      {c:4,r:1,label:"Estrada A · O que perco|Road A · What I lose",q:"Qual o custo real?|What is the real cost?",why:"Toda escolha fecha portas; nomeá-las evita o arrependimento cego.|Every choice closes doors; naming them prevents blind regret."},
      {c:2,r:3,label:"Estrada B · Se eu seguir|Road B · If I take it",q:"O que essa escolha exige?|What does this choice require?",why:"Espelho de 2. Compare os elementos: naipes iguais indicam que as duas estradas são a mesma disfarçada.|Mirror of 2. Compare the elements: matching suits mean the two roads are the same road in disguise."},
      {c:3,r:3,label:"Estrada B · O que ganho|Road B · What I gain",q:"O que se abre?|What opens up?",why:"Espelho de 3.|Mirror of 3."},
      {c:4,r:3,label:"Estrada B · O que perco|Road B · What I lose",q:"Qual o custo real?|What is the real cost?",why:"Espelho de 4.|Mirror of 4."},
      {c:5,r:2,label:"O que nenhuma estrada resolve|What neither road solves",q:"O que continua independente da escolha?|What persists regardless of the choice?",why:"Fecha a tiragem no eixo central: quase sempre a carta mais útil, porque desinfla a decisão.|Closes the spread on the central axis: almost always the most useful card, because it deflates the decision."}
    ]
  },
  {
    id:"relation", cols:3, rows:3,
    name:"O Vínculo|The Bond",
    use:"Relação de qualquer natureza — afetiva, familiar, profissional.|A relationship of any kind — romantic, family, professional.",
    why:"Duas colunas verticais espelhadas com uma coluna central compartilhada. Cada pessoa ocupa sua própria vertical, o que impede a leitura mais comum e mais falsa em tiragens de relacionamento: atribuir a uma pessoa uma carta que descreve o campo entre as duas. Leia primeiro as colunas separadas, depois a central.|Two mirrored vertical columns with a shared central column. Each person occupies their own vertical, which blocks the commonest and falsest move in relationship readings: assigning to one person a card that describes the field between them. Read the separate columns first, then the centre.",
    pos:[
      {c:1,r:1,label:"Você · o que sente|You · what you feel",q:"Qual é o seu estado real?|What is your actual state?",why:"Alto da sua coluna: o que é consciente para você.|Top of your column: what is conscious for you."},
      {c:1,r:2,label:"Você · o que traz|You · what you bring",q:"O que você põe na relação?|What do you put into the relationship?",why:"Meio: ação, não sentimento.|Middle: action, not feeling."},
      {c:1,r:3,label:"Você · o que esconde|You · what you withhold",q:"O que não está dito do seu lado?|What is unspoken on your side?",why:"Base: o inconsciente da sua coluna, sustentando as outras duas.|Base: your column's unconscious, holding up the other two."},
      {c:3,r:1,label:"O outro · o que sente|The other · what they feel",q:"Qual é o estado real do outro?|What is their actual state?",why:"Espelho. Trate como hipótese de leitura, nunca como fato sobre outra pessoa.|Mirror. Treat as a reading hypothesis, never as fact about another person."},
      {c:3,r:2,label:"O outro · o que traz|The other · what they bring",q:"O que a outra pessoa põe?|What do they put in?",why:"Espelho da posição 2.|Mirror of position 2."},
      {c:3,r:3,label:"O outro · o que esconde|The other · what they withhold",q:"O que não está dito do lado dele?|What is unspoken on their side?",why:"Espelho da posição 3.|Mirror of position 3."},
      {c:2,r:1,label:"O que existe entre|What exists between",q:"Qual é a natureza do campo?|What is the nature of the field?",why:"Coluna central: pertence a ninguém e aos dois.|Central column: it belongs to neither and to both."},
      {c:2,r:2,label:"O ponto de atrito|The friction point",q:"Onde isso trava?|Where does it jam?",why:"Centro exato: cruzamento das duas verticais.|Exact centre: the crossing of both verticals."},
      {c:2,r:3,label:"O que o vínculo pede|What the bond asks",q:"O que a relação pede para seguir?|What does the relationship require to continue?",why:"Base do eixo comum: fundação da relação, não desejo de nenhum dos dois.|Base of the shared axis: the relationship's foundation, not either person's wish."}
    ]
  },
  {
    id:"tree", cols:3, rows:8,
    name:"Árvore da Vida|Tree of Life",
    use:"Retrato completo de um momento de vida, em profundidade cabalística.|A complete portrait of a life moment, in Kabbalistic depth.",
    why:"Dez posições sobre as Sephiroth, mais Daath (o abismo) como carta opcional. A geometria não é decorativa: as três colunas são Rigor (esquerda), Misericórdia (direita) e Equilíbrio (centro), e a leitura desce de Kether a Malkuth — do abstrato ao concreto. Uma sobrecarga de cartas numa das colunas laterais é, por si só, o diagnóstico. Pollack descreve uma versão com o baralho inteiro distribuído em dez montes; esta é a redução de uma carta por Sephirah, viável para leitura fotográfica.|Ten positions on the Sephiroth, plus Daath (the abyss) as an optional card. The geometry is not decorative: the three columns are Severity (left), Mercy (right) and Balance (centre), and the reading descends from Kether to Malkuth — abstract to concrete. An overload of cards in one side column is itself the diagnosis. Pollack describes a version using the whole deck dealt into ten piles; this is the one-card-per-Sephirah reduction, viable for photographic reading.",
    pos:[
      {c:2,r:1,label:"1 · Kether · Propósito|1 · Kether · Purpose",q:"Qual é a fonte disso?|What is the source of this?",why:"Topo do pilar central: a intenção antes de qualquer forma.|Top of the central pillar: intention before any form."},
      {c:3,r:2,label:"2 · Chokmah · Impulso|2 · Chokmah · Impulse",q:"Que força criativa está agindo?|What creative force is at work?",why:"Alto do pilar da Misericórdia: expansão pura.|Top of the Mercy pillar: pure expansion."},
      {c:1,r:2,label:"3 · Binah · Forma|3 · Binah · Form",q:"Que estrutura está sendo dada?|What structure is being given?",why:"Alto do pilar do Rigor: o limite que torna o impulso real.|Top of the Severity pillar: the limit that makes impulse real."},
      {c:2,r:3,label:"Daath · O Abismo|Daath · The Abyss",q:"O que foi negado ou esquecido?|What has been denied or forgotten?",why:"Sephirah não-Sephirah. Opcional; quando incluída, costuma ser a carta mais dura da tiragem.|The non-Sephirah. Optional; when included it is usually the harshest card of the spread.",opt:true},
      {c:3,r:4,label:"4 · Chesed · Expansão|4 · Chesed · Expansion",q:"Onde há crescimento?|Where is there growth?",why:"Misericórdia manifesta.|Mercy made manifest."},
      {c:1,r:4,label:"5 · Geburah · Corte|5 · Geburah · Severance",q:"O que precisa ser cortado?|What needs to be cut?",why:"Rigor manifesto: o par que impede Chesed de virar excesso.|Severity made manifest: the pair that keeps Chesed from becoming excess."},
      {c:2,r:5,label:"6 · Tiphareth · Coração|6 · Tiphareth · Heart",q:"Qual é o centro consciente?|What is the conscious centre?",why:"Meio exato da Árvore: recebe de todas as Sephiroth acima. Se a leitura tiver um eixo, está aqui.|Exact middle of the Tree: it receives from every Sephirah above. If the reading has an axis, it is here.",key:true},
      {c:3,r:6,label:"7 · Netzach · Desejo|7 · Netzach · Desire",q:"O que atrai?|What attracts?",why:"Emoção e apetite, no pilar da expansão.|Emotion and appetite, on the expansive pillar."},
      {c:1,r:6,label:"8 · Hod · Razão|8 · Hod · Reason",q:"O que a mente diz?|What does the mind say?",why:"Intelecto, no pilar da forma. Leia sempre contra 7.|Intellect, on the pillar of form. Always read it against 7."},
      {c:2,r:7,label:"9 · Yesod · Fundamento|9 · Yesod · Foundation",q:"O que o inconsciente sustenta?|What does the unconscious hold up?",why:"Última estação antes do mundo material.|The last station before the material world."},
      {c:2,r:8,label:"10 · Malkuth · Manifestação|10 · Malkuth · Manifestation",q:"Como isso aparece na vida concreta?|How does this show up in concrete life?",why:"Base: o resultado tangível de tudo acima.|Base: the tangible result of everything above."}
    ]
  },
  {
    id:"cycle", cols:0, rows:0, open:true,
    name:"Ciclo de Trabalho|Work Cycle",
    use:"Leitura aberta, longa, sem posições fixas — para um processo em andamento.|An open, long reading with no fixed positions — for a process underway.",
    why:"Descrita por Pollack: nove ou mais cartas dispostas em linhas, sem posições atribuídas. O sentido não vem de onde a carta caiu, mas de como o conjunto se organiza — quais naipes dominam, quais faltam, onde os Arcanos Maiores se agrupam, quais cartas-portal aparecem. É a tiragem que mais exige do leitor e a que menos permite automatismo, porque não há posição para se apoiar. Use quando a pergunta não couber numa forma.|Described by Pollack: nine or more cards laid in rows, with no assigned positions. Meaning comes not from where a card fell but from how the whole organises — which suits dominate, which are missing, where the Majors cluster, which portal cards appear. It is the spread that demands most of the reader and permits least automatism, because there is no position to lean on. Use it when the question will not fit a shape.",
    pos:[]
  }
];

/* ---------- CAMADA METODOLÓGICA ---------- */

const DIGNITY = {
  Fire:{ same:"Fire", enemy:"Water", friend:["Air","Earth"] },
  Water:{ same:"Water", enemy:"Fire", friend:["Air","Earth"] },
  Air:{ same:"Air", enemy:"Earth", friend:["Fire","Water"] },
  Earth:{ same:"Earth", enemy:"Air", friend:["Fire","Water"] },
};
const dignityOf = (a, b) => {
  if (!a || !b) return null;
  if (a === b) return "same";
  if (DIGNITY[a].enemy === b) return "enemy";
  return "friend";
};

const METHOD = [
  { id:"dign", t:"Dignidades Elementais|Elemental Dignities",
    b:"Descrita por MacGregor Mathers no 'Book T' da Golden Dawn. Cartas vizinhas modificam a força umas das outras — não o sentido, a intensidade. Mesmo elemento: reforço forte, para o bem ou para o mal. Fogo/Água e Ar/Terra: inimigos, enfraquecem-se muito. Todo o resto (Fogo/Ar, Fogo/Terra, Água/Ar, Água/Terra): amigável.\n\nTENSÃO A NOMEAR: o Golden Dawn original tinha apenas TRÊS categorias — reforça muito, enfraquece muito, amigável. Boa parte do material popular contemporâneo acrescentou uma quarta categoria, 'neutro', aplicada a Fogo/Terra e Ar/Água. Mary K. Greer e Anthony Louis, que trabalharam sobre o texto de Mathers, sustentam que 'amigável' nunca significou 'neutro'. O app usa o esquema original de três categorias e assinala quando a leitura tocaria essa divergência.\n\nREGRAS DE TRÍADE (Mathers, verificadas em duas fontes independentes): se as duas cartas laterais forem contrárias à central, dominam-na e ela fica muito fraca. Se as laterais forem contrárias ENTRE SI, anulam-se e a carta central lê-se como se estivesse sozinha. Se apenas uma lateral for contrária, a outra funciona como ponte e a central permanece razoavelmente forte.|Described by MacGregor Mathers in the Golden Dawn's 'Book T'. Neighbouring cards modify each other's strength — not the meaning, the intensity. Same element: strong reinforcement, for good or ill. Fire/Water and Air/Earth: enemies, greatly weakening. Everything else (Fire/Air, Fire/Earth, Water/Air, Water/Earth): friendly.\n\nTENSION TO NAME: the original Golden Dawn had only THREE categories — greatly strengthening, greatly weakening, friendly. Much popular contemporary material added a fourth, 'neutral', applied to Fire/Earth and Air/Water. Mary K. Greer and Anthony Louis, working from Mathers' text, hold that 'friendly' never meant 'neutral'. This app uses the original three-category scheme and flags where a reading would touch that divergence.\n\nTRIAD RULES (Mathers, verified in two independent sources): if both flanking cards are contrary to the centre, they dominate it and it becomes very weak. If the flanking cards are contrary TO EACH OTHER, they cancel and the centre card reads as though alone. If only one flank is contrary, the other acts as a bridge and the centre stays reasonably strong." },
  { id:"absence", t:"Ausência de Naipe|Suit Absence",
    b:"A ausência de um naipe numa tiragem é um dado tão interpretável quanto qualquer carta presente. Sem Espadas: a questão não está sendo pensada, só sentida ou agida. Sem Copas: o afeto foi excluído do cálculo. Sem Paus: falta impulso, não falta clareza. Sem Ouros: a questão não tem ancoragem material — pode ser bonita e irrealizável. Excesso de Arcanos Maiores indica que a situação escapou ao controle pessoal; excesso de Menores, que ela é mais mundana do que a pergunta sugeria.|The absence of a suit in a spread is as interpretable as any card present. No Swords: the question is not being thought, only felt or acted. No Cups: feeling has been excluded from the calculation. No Wands: impulse is missing, not clarity. No Pentacles: the question has no material anchor — it may be beautiful and unrealisable. An excess of Majors indicates the situation has slipped beyond personal control; an excess of Minors, that it is more mundane than the question implied." },
  { id:"portal", t:"Cartas-Portal|Portal Cards",
    b:"Conceito de Pollack: certas cartas abrem experiência arquetípica além do seu sentido literal, geralmente por conterem uma figura de costas, um limiar, ou um padrão que replica a estrutura do próprio Tarô. Neste baralho: Três de Paus, Oito de Copas, Seis de Espadas, Seis de Ouros, Nove de Ouros, Dez de Ouros. Quando uma delas cai, a leitura muda de registro — deixa de descrever a situação e passa a descrever a posição do consulente diante dela.|Pollack's concept: certain cards open archetypal experience beyond their literal sense, usually by containing a figure seen from behind, a threshold, or a pattern replicating the structure of the Tarot itself. In this deck: Three of Wands, Eight of Cups, Six of Swords, Six of Pentacles, Nine of Pentacles, Ten of Pentacles. When one falls, the reading changes register — it stops describing the situation and begins describing the querent's position before it." },
  { id:"jumper", t:"Cartas Saltadoras|Jumper Cards",
    b:"Cartas que saem espontaneamente do baralho durante o embaralhamento têm peso interpretativo amplificado. A emergência não solicitada intensifica a mensagem — a carta não foi escolhida por posição nem por contagem, apareceu. Detalhes físicos importam e são tratados como extensão simbólica: o arco da queda, a posição final, se colidiu com outra carta. Registre a saltadora no campo de contexto para que ela entre na leitura com esse peso.|Cards that fall spontaneously from the deck during shuffling carry amplified interpretive weight. Unsolicited emergence intensifies the message — the card was chosen by neither position nor count; it appeared. Physical details matter and are treated as symbolic extension: the arc of the fall, the final position, whether it struck another card. Record the jumper in the context field so it enters the reading with that weight." },
  { id:"lines", t:"As Três Linhas de Pollack|Pollack's Three Lines",
    b:"O Louco (0) fica sozinho, fora e antes. Os 21 Maiores restantes formam três linhas de sete.\nLINHA 1 (1–7, Mago a Carro): o mundo exterior, a maturação do ego, o que se aprende para funcionar socialmente.\nLINHA 2 (8–14, Força a Temperança): a busca interior, o descenso ao subconsciente, o encontro com o que o ego construiu e não sabe sustentar.\nLINHA 3 (15–21, Diabo a Mundo): o superconsciente, a união arquetípica, forças maiores que a biografia pessoal.\nPADRÃO DOS QUATRO: Louco–Mago–Sacerdotisa–Mundo = potencialidade, dualidade, unidade. Quando Maiores dominam uma tiragem, localizar em que linha se agrupam diz em que fase do arco o consulente está.|The Fool (0) stands alone, outside and before. The remaining 21 Majors form three lines of seven.\nLINE 1 (1–7, Magician to Chariot): the outer world, the ego's maturation, what is learned in order to function socially.\nLINE 2 (8–14, Strength to Temperance): the inward search, the descent into the subconscious, meeting what the ego built and cannot sustain.\nLINE 3 (15–21, Devil to World): the superconscious, archetypal union, forces larger than personal biography.\nPATTERN OF FOUR: Fool–Magician–High Priestess–World = potentiality, duality, unity. When Majors dominate a spread, locating which line they cluster in tells you which phase of the arc the querent is in." },
  { id:"rev", t:"Reversões|Reversals",
    b:"Em Pollack, uma carta invertida não é o oposto da carta direita: é a mesma energia bloqueada, adiada, voltada para dentro, ou recanalizada. O Sol invertido não é escuridão — é luz que não está sendo deixada entrar.\n\nPROTOCOLO: uma carta só é lida como invertida mediante confirmação explícita. Se a mão inteira foi embaralhada invertida, a inversão de uma carta individual deixa de ser metodologicamente significativa e o app levanta essa questão em vez de decidir por você.|In Pollack, a reversed card is not the opposite of the upright: it is the same energy blocked, delayed, turned inward, or rechannelled. The Sun reversed is not darkness — it is light not being let in.\n\nPROTOCOL: a card is read as reversed only on explicit confirmation. If the whole hand was shuffled reversed, an individual card's inversion ceases to be methodologically meaningful and the app raises that question rather than deciding for you." },
  { id:"combo", t:"Combinações|Combinations",
    b:"Ler combinações é ler conversa, não somar significados. Quatro operações:\n1. REFORÇO — mesmo naipe ou mesmo número: o tema é sublinhado. Números repetidos são um dos sinais mais fortes do baralho (três Cincos = crise em três frentes).\n2. CONTRADIÇÃO — cartas que se opõem: o consulente está dividido, e o conflito é a mensagem, não um erro da tiragem.\n3. SEQUÊNCIA — cartas que contam uma ordem: A leva a B leva a C.\n4. QUALIFICAÇÃO — uma carta modifica o tom da outra sem mudar seu sentido. Oito de Ouros + Força = prática paciente; Oito de Ouros + Diabo = trabalho tornado compulsão. A primeira carta não mudou.\nRepetições visuais (a mesma cor, o mesmo gesto, a mesma criatura em várias cartas) são leitura legítima e frequentemente mais precisa do que a soma dos significados.|Reading combinations is reading conversation, not adding meanings. Four operations:\n1. REINFORCEMENT — same suit or same number: the theme is underlined. Repeated numbers are one of the deck's strongest signals (three Fives = crisis on three fronts).\n2. CONTRADICTION — cards that oppose: the querent is divided, and the conflict is the message, not a fault in the spread.\n3. SEQUENCE — cards telling an order: A leads to B leads to C.\n4. QUALIFICATION — one card modifies another's tone without changing its sense. Eight of Pentacles + Strength = patient practice; Eight of Pentacles + Devil = work become compulsion. The first card has not changed.\nVisual repetitions (the same colour, gesture, or creature across cards) are legitimate reading and often more precise than the sum of meanings." },
  { id:"phil", t:"Filosofia Divinatória|Divinatory Philosophy",
    b:"As cartas não determinam destino. Elas refletem condicionamento somado a resultado provável: o que tende a acontecer se nada mudar. O livre-arbítrio existe e raramente é exercido — é por isso que as previsões funcionam com a frequência que funcionam, e não porque o futuro esteja escrito.\n\nNenhuma carta é boa ou má em si. O contexto determina o significado: a Torre numa pergunta sobre uma estrutura que já não serve é alívio; numa pergunta sobre uma casa recém-comprada, é outra coisa. A posição, a pergunta e as vizinhas fazem o sentido — a carta sozinha só oferece o material.|The cards do not determine fate. They reflect conditioning plus likely outcome: what tends to happen if nothing changes. Free will exists and is rarely exercised — which is why predictions work as often as they do, not because the future is written.\n\nNo card is good or bad in itself. Context determines meaning: the Tower in a question about a structure that no longer serves is relief; in a question about a newly bought house, it is something else. Position, question and neighbours make the sense — the card alone only supplies the material." },
];

/* ---------- utilidades ---------- */
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").trim();
const matchCard = (raw) => {
  const q = norm(raw);
  if (!q) return null;
  let hit = CARDS.find((c) => norm(L(c.name, "en")) === q || norm(L(c.name, "pt")) === q);
  if (hit) return hit;
  hit = CARDS.find((c) => norm(L(c.name, "en")).includes(q) || norm(L(c.name, "pt")).includes(q) || q.includes(norm(L(c.name, "en"))));
  return hit || null;
};
const SUIT_COLOR = { M: "var(--major)", w: "var(--fire)", c: "var(--water)", s: "var(--air)", p: "var(--earth)" };
const T = {
  read: "Leitura|Reading", spreads: "Tiragens|Spreads", cards: "Cartas|Cards",
  method: "Método|Method", journal: "Diário|Journal",
};

/* ---------- diagnóstico determinístico (sem IA) ---------- */
function diagnose(slots, lang) {
  const filled = slots.filter((s) => s.card);
  const cards = filled.map((s) => s.card);
  const counts = { M: 0, w: 0, c: 0, s: 0, p: 0 };
  cards.forEach((c) => counts[c.arc]++);
  const absent = ["w", "c", "s", "p"].filter((k) => counts[k] === 0);
  const portals = cards.filter((c) => c.portal);
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
  return { counts, absent, portals, repeats, lines, chain, triads, total: cards.length,
           majorRatio: cards.length ? counts.M / cards.length : 0 };
}

/* ---------- construção do prompt de leitura ----------
   O formato obrigatório (Dean + Pollack por carta, depois posicional, depois síntese)
   não cabe numa única resposta. A leitura é encadeada em etapas; cada etapa recebe
   o mesmo contexto-base e produz apenas a sua parte.                              */

function baseCtx({ slots, spread, question, context, allReversed, lang, dx }) {
  const isPT = lang === "pt";
  const list = slots.filter((s) => s.card).map((s, i) => {
    const c = s.card;
    return `${i + 1}. [${s.label ? L(s.label, lang) : (isPT ? "sem posição" : "no position")}] ${L(c.name, lang)} — ${L(c.suit, lang)} / ${L(c.el, lang)} / ${L(c.as, lang)}${s.rev ? (isPT ? " — INVERTIDA (confirmada)" : " — REVERSED (confirmed)") : ""}${c.portal ? (isPT ? " — CARTA-PORTAL" : " — PORTAL CARD") : ""}${c.arc === "M" ? ` — ${isPT ? "Linha" : "Line"} ${c.line} ${isPT ? "de Pollack" : "of Pollack"}` : ""}`;
  }).join("\n");

  const posInfo = (spread.pos || []).map((p, i) => `${i + 1}. ${L(p.label, lang)} — ${L(p.q, lang)} | ${isPT ? "razão da posição" : "position rationale"}: ${L(p.why, lang)}`).join("\n");

  const diag = [
    `${isPT ? "Distribuição" : "Distribution"}: ${isPT ? "Maiores" : "Majors"} ${dx.counts.M}, ${isPT ? "Paus" : "Wands"} ${dx.counts.w}, ${isPT ? "Copas" : "Cups"} ${dx.counts.c}, ${isPT ? "Espadas" : "Swords"} ${dx.counts.s}, ${isPT ? "Ouros" : "Pentacles"} ${dx.counts.p}`,
    dx.absent.length
      ? `${isPT ? "NAIPES AUSENTES (dado interpretável)" : "ABSENT SUITS (interpretable data)"}: ${dx.absent.map((k) => L({ w: "Paus|Wands", c: "Copas|Cups", s: "Espadas|Swords", p: "Ouros|Pentacles" }[k], lang)).join(", ")}`
      : `${isPT ? "Todos os naipes presentes" : "All suits present"}`,
    dx.portals.length ? `${isPT ? "Cartas-portal" : "Portal cards"}: ${dx.portals.map((c) => L(c.name, lang)).join(", ")}` : "",
    dx.repeats.length ? `${isPT ? "Números repetidos" : "Repeated numbers"}: ${dx.repeats.map(([n, v]) => `${n} × ${v}`).join(", ")}` : "",
    `${isPT ? "Maiores por linha de Pollack" : "Majors by Pollack line"}: L0 ${dx.lines[0]}, L1 ${dx.lines[1]}, L2 ${dx.lines[2]}, L3 ${dx.lines[3]}`,
    dx.chain.length ? `${isPT ? "Cadeia de dignidades elementais (Golden Dawn, três categorias: ≡ reforço forte, ~ amigável, ✕ contrários)" : "Elemental dignity chain (Golden Dawn, three categories: ≡ strong reinforcement, ~ friendly, ✕ contrary)"}: ${dx.chain.map((k) => `${L(k.a.card.name, lang)} ${{ same: "≡", friend: "~", enemy: "✕" }[k.d]} ${L(k.b.card.name, lang)}`).join(" | ")}` : "",
    dx.triads.length ? `${isPT ? "Tríades de Mathers" : "Mathers triads"}: ${dx.triads.map((t) => `${L(t.centre.card.name, lang)} → ${L({ dominated: "dominada pelas duas vizinhas, muito enfraquecida|dominated by both neighbours, greatly weakened", isolated: "vizinhas contrárias entre si, anulam-se: leia esta carta como se estivesse sozinha|neighbours contrary to each other, they cancel: read this card as if alone", bridged: "uma vizinha contrária, a outra faz ponte: permanece razoavelmente forte|one contrary neighbour, the other bridges: stays reasonably strong" }[t.verdict], lang)}`).join(" ; ")}` : "",
  ].filter(Boolean).join("\n");

  const rulesPT = `Você é um leitor de Tarô profissional trabalhando dentro de um sistema de referência fixo. Baralho: Rider-Waite-Smith.

VOZES DE REFERÊNCIA
- Liz Dean, "The Ultimate Guide to Tarot" — voz primária.
- Rachel Pollack, "Seventy-Eight Degrees of Wisdom" — voz primária.
- Robert M. Place, "The Alchemical Tarot" — NÃO DISPONÍVEL nesta sessão. Não improvise citações de Place. Se o enquadramento alquímico aparecer em nível estrutural, avise que Place mapeia Água=intuição e Fogo=sentimento, divergindo de Pollack — jamais suavize essa divergência.

REGRAS FIRMES
- Trate esta leitura como inteiramente nova. Nenhuma referência cruzada a sessões anteriores.
- Permaneça estritamente dentro dos frameworks dos autores citados. Nunca insira opinião editorial própria disfarçada de interpretação de Tarô. Se algo não vem de Dean, de Pollack ou da estrutura do baralho, não diga.
- Nunca fabrique detalhes sobre como a carta foi sacada. Use apenas o que está no contexto declarado.
- Inversões: leia como invertida SOMENTE a carta marcada como tal. Em Pollack, inversão é energia bloqueada, adiada ou recanalizada — nunca o oposto simples.
- A ausência de um naipe é dado interpretável, tanto quanto as cartas presentes.
- Nenhuma carta é boa ou má em si. As cartas refletem condicionamento somado a resultado provável, não destino fixo.
- Prosa literária com densidade simbólica, subcabeçalhos claros, adequada para leitura em celular. Português brasileiro em toda a saída.`;

  const rulesEN = `You are a professional Tarot reader working inside a fixed reference system. Deck: Rider-Waite-Smith.

REFERENCE VOICES
- Liz Dean, "The Ultimate Guide to Tarot" — primary voice.
- Rachel Pollack, "Seventy-Eight Degrees of Wisdom" — primary voice.
- Robert M. Place, "The Alchemical Tarot" — NOT AVAILABLE this session. Do not improvise Place citations. If the alchemical framing appears structurally, note that Place maps Water=intuition and Fire=feeling, diverging from Pollack — never smooth that divergence over.

FIRM RULES
- Treat this reading as entirely new. No cross-reference to previous sessions.
- Stay strictly within the cited authors' frameworks. Never insert your own editorial opinion disguised as Tarot interpretation. If something comes from neither Dean, nor Pollack, nor the deck's structure, do not say it.
- Never fabricate details about how a card was drawn. Use only the stated context.
- Reversals: read as reversed ONLY the card marked as such. In Pollack, reversal is blocked, delayed or rechannelled energy — never a simple opposite.
- The absence of a suit is interpretable data, as much as the cards present.
- No card is good or bad in itself. The cards reflect conditioning plus likely outcome, not fixed fate.
- Literary prose with symbolic density, clear subheadings, suited to reading on a phone.`;

  return `${isPT ? rulesPT : rulesEN}

────────────
${isPT ? "TIRAGEM" : "SPREAD"}: ${L(spread.name, lang)}
${isPT ? "Razão da geometria" : "Rationale of the geometry"}: ${L(spread.why, lang)}
${posInfo ? `\n${isPT ? "POSIÇÕES" : "POSITIONS"}:\n${posInfo}` : `\n${isPT ? "Tiragem aberta, sem posições fixas: o sentido vem da organização do conjunto, não do lugar de cada carta." : "Open spread, no fixed positions: meaning comes from how the whole organises, not from where each card sits."}`}

${isPT ? "PERGUNTA" : "QUESTION"}: ${question || (isPT ? "(não formulada — leia como campo aberto)" : "(not stated — read as an open field)")}

${isPT ? "CARTAS NA ORDEM DAS POSIÇÕES" : "CARDS IN POSITION ORDER"}:
${list}

${isPT ? "DIAGNÓSTICO ESTRUTURAL (calculado, não interpretado — use-o)" : "STRUCTURAL DIAGNOSIS (computed, not interpreted — use it)"}:
${diag}
${allReversed ? (isPT ? "\nAVISO PROTOCOLAR: a mão inteira foi embaralhada invertida. Levante explicitamente a questão de se a inversão de uma carta individual continua metodologicamente válida neste contexto, antes de interpretar qualquer inversão." : "\nPROTOCOL NOTE: the entire hand was shuffled reversed. Explicitly raise whether an individual card's inversion remains methodologically valid here before interpreting any reversal.") : ""}
${context ? `\n${isPT ? "CONTEXTO DECLARADO (use apenas isto; não invente nada além)" : "STATED CONTEXT (use only this; invent nothing beyond it)"}: ${context}` : ""}`;
}

function stagePrompt(stage, { ctx, lang, batch, first, lastBatch }) {
  const isPT = lang === "pt";
  const names = (batch || []).map((s) => `${L(s.card.name, lang)}${s.rev ? (isPT ? " (invertida)" : " (reversed)") : ""}`).join(", ");
  const parts = {
    meanings: isPT
      ? `TAREFA — PARTE 1 DE 3: SIGNIFICADOS SIMBÓLICOS.
Escreva APENAS os significados simbólicos das seguintes cartas: ${names}.
Para cada uma: um subcabeçalho com o nome da carta e, abaixo, DUAS vozes claramente identificadas e separadas — primeiro "Dean", depois "Pollack". Não misture as duas vozes.
NÃO interprete a posição nem a pergunta ainda. NÃO escreva introdução, conclusão nem síntese.
${first ? 'Comece com o cabeçalho "## I. Significados simbólicos" e siga direto para a primeira carta.' : "Continue a lista sem repetir o cabeçalho da seção e sem preâmbulo."}`
      : `TASK — PART 1 OF 3: SYMBOLIC MEANINGS.
Write ONLY the symbolic meanings of the following cards: ${names}.
For each: a subheading with the card name and, below it, TWO clearly identified and separated voices — "Dean" first, then "Pollack". Do not blend the two voices.
Do NOT interpret position or question yet. Do NOT write an introduction, conclusion or synthesis.
${first ? 'Begin with the heading "## I. Symbolic meanings" and go straight into the first card.' : "Continue the list without repeating the section heading and without preamble."}`,
    positions: isPT
      ? `TAREFA — PARTE 2 DE 3: INTERPRETAÇÃO POSICIONAL.
A Parte 1 (significados de cada carta segundo Dean e Pollack) já foi escrita. NÃO a repita.
Comece com o cabeçalho "## II. Interpretação posicional". Agora aplique cada carta à sua posição e à pergunta específica, usando a razão de existir daquela posição como está descrita acima. Onde houver cartas-portal, dignidades elementais ou tríades de Mathers no diagnóstico, use-os aqui.
NÃO escreva a síntese final ainda.`
      : `TASK — PART 2 OF 3: POSITIONAL INTERPRETATION.
Part 1 (each card's meanings per Dean and Pollack) has already been written. Do NOT repeat it.
Begin with the heading "## II. Positional interpretation". Now apply each card to its position and to the specific question, using that position's stated reason for existing. Where the diagnosis shows portal cards, elemental dignities or Mathers triads, use them here.
Do NOT write the final synthesis yet.`,
    synthesis: isPT
      ? `TAREFA — PARTE 3 DE 3: SÍNTESE INTEGRADA.
As Partes 1 e 2 já foram escritas. NÃO as repita.
Comece com o cabeçalho "## III. Síntese integrada". Costure as duas vozes e o diagnóstico estrutural numa leitura única e coerente: o que a tiragem diz como um todo, o que a distribuição de naipes e as ausências revelam, e onde está o eixo real da questão.
Encerre com uma única linha, separada, informando que a camada alquímica de Robert M. Place não está carregada nesta sessão e que ela pode ser acrescentada se o PDF for fornecido.`
      : `TASK — PART 3 OF 3: INTEGRATED SYNTHESIS.
Parts 1 and 2 have already been written. Do NOT repeat them.
Begin with the heading "## III. Integrated synthesis". Stitch both voices and the structural diagnosis into a single coherent reading: what the spread says as a whole, what the suit distribution and absences reveal, and where the question's real axis lies.
Close with a single separate line stating that Robert M. Place's alchemical layer is not loaded this session and can be added if the PDF is supplied.`,
  };
  return `${ctx}\n\n────────────\n${parts[stage]}`;
}

/* ============================================================ */

export default function Arcanum() {
  const [lang, setLang] = useState("pt");
  const [tab, setTab] = useState("read");
  const [spreadId, setSpreadId] = useState("three");
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [allReversed, setAllReversed] = useState(false);
  const [slots, setSlots] = useState([]);
  const [openCount, setOpenCount] = useState(9);
  const [photo, setPhoto] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState("");
  const [reading, setReading] = useState("");
  const [running, setRunning] = useState(false);
  const [stageMsg, setStageMsg] = useState("");
  const [err, setErr] = useState("");
  const [cardQuery, setCardQuery] = useState("");
  const [cardFilter, setCardFilter] = useState("all");
  const [openCard, setOpenCard] = useState(null);
  const [journal, setJournal] = useState([]);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);
  const readingRef = useRef(null);

  const spread = SPREADS.find((s) => s.id === spreadId) || SPREADS[0];
  const isPT = lang === "pt";

  useEffect(() => {
    const el = document.createElement("link");
    el.rel = "stylesheet";
    el.href = "https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,600;1,6..72,400&family=Archivo:wght@400;500;600&display=swap";
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch (e) {} };
  }, []);

  useEffect(() => {
    const base = spread.open
      ? Array.from({ length: openCount }, (_, i) => ({ key: `o${i}`, label: null, c: (i % 3) + 1, r: Math.floor(i / 3) + 1, card: null, rev: false }))
      : spread.pos.map((p, i) => ({ key: `${spread.id}-${i}`, label: p.label, why: p.why, q: p.q, c: p.c, r: p.r, rot: p.rot, opt: p.opt, keyPos: p.key, card: null, rev: false }));
    setSlots(base);
    setReading(""); setSaved(false); setScanNote("");
  }, [spreadId, openCount]);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.list("read:");
        const keys = (r && r.keys) || [];
        const out = [];
        for (const k of keys.slice(-30)) {
          try { const v = await window.storage.get(k); if (v) out.push({ k, ...JSON.parse(v.value) }); } catch (e) {}
        }
        setJournal(out.sort((a, b) => (b.ts || 0) - (a.ts || 0)));
      } catch (e) {}
    })();
  }, []);

  const dx = useMemo(() => diagnose(slots, lang), [slots, lang]);
  const filledCount = slots.filter((s) => s.card).length;

  const setSlot = (i, patch) => setSlots((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  /* ----- leitura por foto ----- */
  const onPhoto = async (file) => {
    if (!file) return;
    setErr(""); setScanNote("");
    const b64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(",")[1]);
      r.onerror = () => rej(new Error("read"));
      r.readAsDataURL(file);
    });
    setPhoto(URL.createObjectURL(file));
    setScanning(true);
    try {
      const names = CARDS.map((c) => L(c.name, "en")).join(", ");
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: file.type === "image/png" ? "image/png" : "image/jpeg", data: b64 } },
            { type: "text", text: `This photo shows a Rider-Waite-Smith tarot spread. Identify every visible card, in reading order (left to right, top to bottom; for a Celtic Cross: centre, crossing card, then below, left, above, right, then the staff column bottom to top).

Valid card names (use these exact strings): ${names}

Return ONLY a JSON array, no prose, no markdown fences:
[{"name":"<exact card name>","reversed":<true|false>,"confidence":<0-100>}]

Rules: reversed means the image is upside down relative to the viewer. If a card is partly hidden or you are unsure, still include it with a low confidence. If you cannot identify a card at all, use "name":"?" for that slot so ordering is preserved.` }
          ] }]
        })
      });
      const data = await resp.json();
      const txt = (data.content || []).filter((x) => x.type === "text").map((x) => x.text).join("\n");
      const clean = txt.replace(/```json|```/g, "").trim();
      const arr = JSON.parse(clean.slice(clean.indexOf("["), clean.lastIndexOf("]") + 1));
      let low = 0, miss = 0;
      setSlots((prev) => prev.map((s, i) => {
        const d = arr[i];
        if (!d || d.name === "?") { if (d) miss++; return s; }
        const c = matchCard(d.name);
        if (!c) { miss++; return s; }
        if ((d.confidence ?? 100) < 75) low++;
        return { ...s, card: c, rev: !!d.reversed, conf: d.confidence };
      }));
      setScanNote(isPT
        ? `${arr.length} carta(s) detectada(s)${low ? `, ${low} com confiança baixa` : ""}${miss ? `, ${miss} não identificada(s)` : ""}. Confira e corrija abaixo antes de rodar — a leitura usa o que estiver confirmado, não o que a foto sugeriu.`
        : `${arr.length} card(s) detected${low ? `, ${low} at low confidence` : ""}${miss ? `, ${miss} unidentified` : ""}. Check and correct below before running — the reading uses what you confirm, not what the photo suggested.`);
    } catch (e) {
      setErr(isPT ? "A foto não pôde ser lida. Tente uma imagem mais nítida, com as cartas de frente e sem reflexo — ou preencha as posições manualmente." : "The photo could not be read. Try a sharper image with the cards face-on and no glare — or fill the positions manually.");
    }
    setScanning(false);
  };

  /* ----- rodar leitura (encadeada em etapas) ----- */
  const callAPI = async (prompt) => {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message || "api");
    return (data.content || []).filter((x) => x.type === "text").map((x) => x.text).join("\n").trim();
  };

  const run = async () => {
    const filled = slots.filter((s) => s.card);
    if (!filled.length) return;
    setRunning(true); setErr(""); setReading(""); setSaved(false);
    try {
      const ctx = baseCtx({ slots, spread, question, context, allReversed, lang, dx });
      const batches = [];
      for (let i = 0; i < filled.length; i += 3) batches.push(filled.slice(i, i + 3));
      let out = "";
      for (let i = 0; i < batches.length; i++) {
        setStageMsg(isPT ? `Significados simbólicos · ${i + 1}/${batches.length}` : `Symbolic meanings · ${i + 1}/${batches.length}`);
        const t = await callAPI(stagePrompt("meanings", { ctx, lang, batch: batches[i], first: i === 0 }));
        out += (out ? "\n\n" : "") + t;
        setReading(out);
      }
      setStageMsg(isPT ? "Interpretação posicional" : "Positional interpretation");
      out += "\n\n" + await callAPI(stagePrompt("positions", { ctx, lang }));
      setReading(out);
      setStageMsg(isPT ? "Síntese integrada" : "Integrated synthesis");
      out += "\n\n" + await callAPI(stagePrompt("synthesis", { ctx, lang }));
      setReading(out);
      setTimeout(() => readingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (e) {
      setErr(isPT ? "A leitura foi interrompida. O que já apareceu abaixo permanece válido — rode de novo para completar."
                  : "The reading was interrupted. What already appeared below remains valid — run again to complete it.");
    }
    setStageMsg(""); setRunning(false);
  };

  const saveReading = async () => {
    try {
      const rec = { ts: Date.now(), spread: L(spread.name, lang), question,
        cards: slots.filter((s) => s.card).map((s) => ({ n: L(s.card.name, lang), rev: s.rev, pos: s.label ? L(s.label, lang) : "" })),
        text: reading, lang };
      await window.storage.set(`read:${rec.ts}`, JSON.stringify(rec));
      setJournal((j) => [{ k: `read:${rec.ts}`, ...rec }, ...j]);
      setSaved(true);
    } catch (e) { setErr(isPT ? "Não foi possível salvar no diário." : "Could not save to the journal."); }
  };
  const delReading = async (k) => {
    try { await window.storage.delete(k); setJournal((j) => j.filter((x) => x.k !== k)); } catch (e) {}
  };

  const shownCards = useMemo(() => {
    const q = norm(cardQuery);
    return CARDS.filter((c) => (cardFilter === "all" || c.arc === cardFilter))
      .filter((c) => !q || norm(L(c.name, "pt")).includes(q) || norm(L(c.name, "en")).includes(q));
  }, [cardQuery, cardFilter]);

  const CSS = `
  .ar{--cloth:#12131f;--cloth2:#1b1d2e;--cloth3:#282b42;--line:#343854;
      --vellum:#efe7d6;--vellum2:#a49dba;--vellum3:#6f6a85;--gilt:#c9a227;
      --fire:#cb4a30;--water:#4485b0;--air:#a3adc4;--earth:#c78f31;--major:#b78bc4;
      background:var(--cloth);color:var(--vellum);min-height:100vh;
      font-family:'Newsreader',Georgia,serif;font-size:16px;line-height:1.6;
      -webkit-font-smoothing:antialiased;}
  .ar *{box-sizing:border-box;}
  .ar-wrap{max-width:1080px;margin:0 auto;padding:0 20px 90px;}
  .ar h1,.ar h2,.ar h3{font-family:'IM Fell English',Georgia,serif;font-weight:400;margin:0;letter-spacing:.01em;}
  .ar-ui{font-family:'Archivo',system-ui,sans-serif;}
  .ar-eyebrow{font-family:'Archivo',system-ui,sans-serif;font-size:10.5px;letter-spacing:.18em;
      text-transform:uppercase;color:var(--vellum3);}

  .ar-top{border-bottom:1px solid var(--line);padding:22px 0 0;margin-bottom:26px;}
  .ar-brandrow{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;}
  .ar-brand{font-family:'IM Fell English',serif;font-size:30px;letter-spacing:.16em;color:var(--vellum);}
  .ar-brand em{font-style:italic;color:var(--gilt);}
  .ar-sub{font-size:13px;color:var(--vellum3);font-family:'Archivo',sans-serif;max-width:340px;}
  .ar-langbtn{font-family:'Archivo',sans-serif;font-size:11px;letter-spacing:.1em;background:none;
      border:1px solid var(--line);color:var(--vellum2);padding:6px 12px;border-radius:2px;cursor:pointer;}
  .ar-langbtn:hover{border-color:var(--gilt);color:var(--vellum);}
  .ar-tabs{display:flex;gap:2px;margin-top:20px;overflow-x:auto;}
  .ar-tab{font-family:'Archivo',sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;
      background:none;border:none;border-bottom:2px solid transparent;color:var(--vellum3);
      padding:10px 14px;cursor:pointer;white-space:nowrap;}
  .ar-tab:hover{color:var(--vellum2);}
  .ar-tab[data-on="1"]{color:var(--gilt);border-bottom-color:var(--gilt);}

  .ar-panel{background:var(--cloth2);border:1px solid var(--line);border-radius:3px;padding:20px;margin-bottom:18px;}
  .ar-panel h3{font-size:19px;margin-bottom:8px;}
  .ar-note{font-size:14.5px;color:var(--vellum2);line-height:1.65;white-space:pre-line;}

  .ar-chips{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0 0;}
  .ar-chip{font-family:'Archivo',sans-serif;font-size:12px;background:var(--cloth);border:1px solid var(--line);
      color:var(--vellum2);padding:7px 12px;border-radius:2px;cursor:pointer;}
  .ar-chip:hover{border-color:var(--vellum3);color:var(--vellum);}
  .ar-chip[data-on="1"]{border-color:var(--gilt);color:var(--gilt);background:rgba(201,162,39,.07);}

  .ar-field{width:100%;background:var(--cloth);border:1px solid var(--line);color:var(--vellum);
      padding:11px 12px;border-radius:2px;font-family:'Newsreader',serif;font-size:15px;margin-top:8px;}
  .ar-field:focus{outline:none;border-color:var(--gilt);}
  .ar-field::placeholder{color:var(--vellum3);}
  select.ar-field{font-family:'Archivo',sans-serif;font-size:13px;padding:8px 10px;}

  .ar-btn{font-family:'Archivo',sans-serif;font-size:13px;letter-spacing:.06em;background:var(--gilt);
      border:1px solid var(--gilt);color:#16171f;padding:11px 22px;border-radius:2px;cursor:pointer;font-weight:600;}
  .ar-btn:hover{background:#dbb43a;}
  .ar-btn:disabled{opacity:.35;cursor:not-allowed;}
  .ar-btn2{background:none;color:var(--vellum2);border-color:var(--line);font-weight:400;}
  .ar-btn2:hover{background:var(--cloth3);color:var(--vellum);}

  .ar-board{display:grid;gap:8px;margin:16px 0 4px;justify-content:start;overflow-x:auto;padding-bottom:6px;}
  .ar-slot{border:1px dashed var(--line);border-radius:3px;min-height:96px;width:78px;padding:6px;
      display:flex;flex-direction:column;justify-content:space-between;background:var(--cloth);position:relative;}
  .ar-slot[data-f="1"]{border-style:solid;}
  .ar-slot[data-rot="1"]{transform:rotate(90deg);z-index:2;}
  .ar-slot-n{font-family:'Archivo',sans-serif;font-size:9px;color:var(--vellum3);letter-spacing:.1em;}
  .ar-slot-c{font-family:'Newsreader',serif;font-size:11.5px;line-height:1.25;color:var(--vellum);}
  .ar-slot-r{font-family:'Archivo',sans-serif;font-size:8.5px;color:var(--gilt);letter-spacing:.08em;}
  .ar-slot-bar{height:3px;border-radius:2px;margin-bottom:4px;}

  .ar-rows{margin-top:8px;}
  .ar-row{display:grid;grid-template-columns:minmax(120px,1.1fr) minmax(150px,1.4fr) auto;gap:10px;
      align-items:center;padding:9px 0;border-bottom:1px solid var(--line);}
  .ar-row:last-child{border-bottom:none;}
  .ar-rowlab{font-family:'Archivo',sans-serif;font-size:11.5px;color:var(--vellum2);letter-spacing:.03em;}
  .ar-rowq{font-size:12.5px;color:var(--vellum3);font-style:italic;display:block;margin-top:2px;}
  .ar-rev{font-family:'Archivo',sans-serif;font-size:10.5px;letter-spacing:.08em;background:none;
      border:1px solid var(--line);color:var(--vellum3);padding:6px 9px;border-radius:2px;cursor:pointer;white-space:nowrap;}
  .ar-rev[data-on="1"]{border-color:var(--gilt);color:var(--gilt);}

  /* --- assinatura: barômetro elemental --- */
  .ar-dx{border:1px solid var(--line);border-radius:3px;padding:18px;background:linear-gradient(180deg,rgba(201,162,39,.045),transparent 60%);margin-bottom:18px;}
  .ar-bar{display:flex;height:26px;border-radius:2px;overflow:hidden;margin:12px 0 10px;background:var(--cloth);}
  .ar-seg{display:flex;align-items:center;justify-content:center;font-family:'Archivo',sans-serif;
      font-size:11px;color:#12131f;font-weight:600;}
  .ar-seg[data-empty="1"]{border:1px dashed var(--vellum3);color:var(--vellum3);background:none;font-weight:400;
      font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;}
  .ar-dxgrid{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
  .ar-tag{font-family:'Archivo',sans-serif;font-size:11px;padding:5px 9px;border-radius:2px;
      border:1px solid var(--line);color:var(--vellum2);}
  .ar-tag[data-k="alert"]{border-color:var(--gilt);color:var(--gilt);}
  .ar-chain{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px;font-size:12px;color:var(--vellum2);}
  .ar-link{font-family:'Archivo',sans-serif;font-size:13px;padding:0 3px;}
  .ar-link[data-d="same"]{color:var(--gilt);}
  .ar-link[data-d="friend"]{color:var(--vellum3);}
  .ar-link[data-d="enemy"]{color:var(--fire);}

  .ar-reading{font-size:16.5px;line-height:1.78;white-space:pre-wrap;color:var(--vellum);}
  .ar-reading strong{color:var(--gilt);font-weight:600;}

  .ar-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:8px;margin-top:14px;}
  .ar-cardbtn{text-align:left;background:var(--cloth2);border:1px solid var(--line);border-left-width:3px;
      border-radius:2px;padding:11px 12px;cursor:pointer;color:var(--vellum);}
  .ar-cardbtn:hover{background:var(--cloth3);}
  .ar-cardbtn small{display:block;font-family:'Archivo',sans-serif;font-size:10px;color:var(--vellum3);
      letter-spacing:.07em;text-transform:uppercase;margin-top:3px;}

  .ar-sheet{position:fixed;inset:0;background:rgba(8,9,14,.72);z-index:60;display:flex;
      align-items:flex-end;justify-content:center;padding:0;}
  .ar-sheetin{background:var(--cloth2);border:1px solid var(--line);border-bottom:none;border-radius:6px 6px 0 0;
      width:100%;max-width:620px;max-height:86vh;overflow-y:auto;padding:22px;}
  .ar-def{margin-top:14px;}
  .ar-def dt{font-family:'Archivo',sans-serif;font-size:10px;letter-spacing:.16em;text-transform:uppercase;
      color:var(--vellum3);margin-top:12px;}
  .ar-def dd{margin:3px 0 0;font-size:14.5px;color:var(--vellum);}

  .ar-err{border:1px solid var(--fire);border-radius:2px;padding:11px 14px;font-size:14px;color:#f0b6a8;
      background:rgba(203,74,48,.09);margin-bottom:14px;}
  .ar-ok{color:var(--gilt);font-family:'Archivo',sans-serif;font-size:12px;}
  .ar-hr{border:none;border-top:1px solid var(--line);margin:20px 0;}
  .ar-drop{border:1px dashed var(--line);border-radius:3px;padding:18px;text-align:center;cursor:pointer;}
  .ar-drop:hover{border-color:var(--gilt);}
  .ar-thumb{max-height:150px;border-radius:2px;border:1px solid var(--line);margin-top:10px;}
  @media (max-width:640px){
    .ar-wrap{padding:0 14px 80px;} .ar-brand{font-size:24px;}
    .ar-row{grid-template-columns:1fr;gap:5px;} .ar-slot{width:64px;min-height:82px;}
  }
  .ar button:focus-visible,.ar select:focus-visible,.ar input:focus-visible,.ar textarea:focus-visible{
    outline:2px solid var(--gilt);outline-offset:2px;}
  @media (prefers-reduced-motion:reduce){.ar *{transition:none!important;animation:none!important;}}
  `;

  const Bar = () => {
    const order = [["M", "var(--major)"], ["w", "var(--fire)"], ["c", "var(--water)"], ["s", "var(--air)"], ["p", "var(--earth)"]];
    const lbl = { M: isPT ? "Maiores" : "Majors", w: isPT ? "Paus" : "Wands", c: isPT ? "Copas" : "Cups", s: isPT ? "Espadas" : "Swords", p: isPT ? "Ouros" : "Pentacles" };
    if (!dx.total) return null;
    return (
      <div className="ar-bar">
        {order.map(([k, col]) => {
          const v = dx.counts[k];
          if (!v) return k === "M" ? null : (
            <div key={k} className="ar-seg" data-empty="1" style={{ flex: 1 }}>{lbl[k]} · {isPT ? "ausente" : "absent"}</div>
          );
          return <div key={k} className="ar-seg" style={{ flex: v * 2, background: col }}>{lbl[k]} {v}</div>;
        })}
      </div>
    );
  };

  const Board = () => (
    <div className="ar-board" style={{ gridTemplateColumns: `repeat(${Math.max(...slots.map((s) => s.c), 1)}, 78px)` }}>
      {slots.map((s, i) => (
        <div key={s.key} className="ar-slot" data-f={s.card ? "1" : "0"} data-rot={s.rot ? "1" : "0"}
             style={{ gridColumn: s.c, gridRow: s.r, borderColor: s.card ? SUIT_COLOR[s.card.arc] : undefined }}>
          <div>
            {s.card && <div className="ar-slot-bar" style={{ background: SUIT_COLOR[s.card.arc] }} />}
            <div className="ar-slot-n">{String(i + 1).padStart(2, "0")}</div>
          </div>
          <div className="ar-slot-c">{s.card ? L(s.card.name, lang) : (s.label ? L(s.label, lang).split(" ")[0] : "—")}</div>
          {s.rev && <div className="ar-slot-r">{isPT ? "INVERT." : "REV."}</div>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="ar">
      <style>{CSS}</style>
      <div className="ar-wrap">
        <header className="ar-top">
          <div className="ar-brandrow">
            <div>
              <div className="ar-brand">ARCAN<em>V</em>M</div>
              <div className="ar-sub">{isPT ? "Instrumento de leitura · Rider-Waite-Smith · Dean · Pollack" : "Reading instrument · Rider-Waite-Smith · Dean · Pollack"}</div>
            </div>
            <button className="ar-langbtn" onClick={() => setLang(isPT ? "en" : "pt")}>
              {isPT ? "EN ↗" : "PT-BR ↗"}
            </button>
          </div>
          <nav className="ar-tabs">
            {["read", "spreads", "cards", "method", "journal"].map((k) => (
              <button key={k} className="ar-tab" data-on={tab === k ? "1" : "0"} onClick={() => setTab(k)}>{L(T[k], lang)}</button>
            ))}
          </nav>
        </header>

        {err && <div className="ar-err">{err}</div>}

        {/* ---------------- LEITURA ---------------- */}
        {tab === "read" && (
          <>
            <div className="ar-panel">
              <div className="ar-eyebrow">{isPT ? "Passo 1 · Escolha a forma" : "Step 1 · Choose the shape"}</div>
              <div className="ar-chips">
                {SPREADS.map((s) => (
                  <button key={s.id} className="ar-chip" data-on={spreadId === s.id ? "1" : "0"} onClick={() => setSpreadId(s.id)}>
                    {L(s.name, lang)}{s.pos.length ? ` · ${s.pos.length}` : ""}
                  </button>
                ))}
              </div>
              <hr className="ar-hr" />
              <h3>{L(spread.name, lang)}</h3>
              <p className="ar-note" style={{ marginBottom: 10 }}><strong style={{ color: "var(--vellum)" }}>{isPT ? "Quando usar." : "When to use."}</strong> {L(spread.use, lang)}</p>
              <p className="ar-note">{L(spread.why, lang)}</p>
              {spread.variants && (
                <div className="ar-dxgrid" style={{ marginTop: 12 }}>
                  {spread.variants.map((v, i) => <span key={i} className="ar-tag" title={L(v.d, lang)}>{L(v.n, lang)}</span>)}
                </div>
              )}
              {spread.open && (
                <div style={{ marginTop: 12 }}>
                  <span className="ar-eyebrow">{isPT ? "Quantas cartas" : "How many cards"}</span>
                  <div className="ar-chips">
                    {[9, 12, 15, 18].map((n) => (
                      <button key={n} className="ar-chip" data-on={openCount === n ? "1" : "0"} onClick={() => setOpenCount(n)}>{n}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="ar-panel">
              <div className="ar-eyebrow">{isPT ? "Passo 2 · A pergunta" : "Step 2 · The question"}</div>
              <input className="ar-field" value={question} onChange={(e) => setQuestion(e.target.value)}
                placeholder={isPT ? "O que você quer saber, na sua própria formulação" : "What you want to know, in your own words"} />
              <textarea className="ar-field" rows={2} value={context} onChange={(e) => setContext(e.target.value)}
                placeholder={isPT ? "Contexto do saque — cartas saltadoras, como uma carta caiu, quem é o consulente. Só o que aconteceu de fato." : "Draw context — jumper cards, how a card fell, who the querent is. Only what actually happened."} />
              <div className="ar-chips">
                <button className="ar-chip" data-on={allReversed ? "1" : "0"} onClick={() => setAllReversed(!allReversed)}>
                  {isPT ? "A mão inteira foi embaralhada invertida" : "The whole hand was shuffled reversed"}
                </button>
              </div>
              {allReversed && <p className="ar-note" style={{ marginTop: 8, fontSize: 13.5 }}>
                {isPT ? "A leitura vai levantar se a inversão de uma carta individual continua metodologicamente válida neste contexto, em vez de decidir por você."
                      : "The reading will raise whether an individual card's inversion remains methodologically valid here, rather than deciding for you."}
              </p>}
            </div>

            <div className="ar-panel">
              <div className="ar-eyebrow">{isPT ? "Passo 3 · As cartas" : "Step 3 · The cards"}</div>
              <div className="ar-drop" style={{ marginTop: 10 }} onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => onPhoto(e.target.files?.[0])} />
                <div className="ar-eyebrow" style={{ marginBottom: 4 }}>{isPT ? "Fotografe a tiragem" : "Photograph the spread"}</div>
                <div style={{ fontSize: 14, color: "var(--vellum2)" }}>
                  {scanning ? (isPT ? "Lendo a imagem…" : "Reading the image…") : (isPT ? "Toque para enviar uma foto — ou preencha à mão abaixo" : "Tap to upload a photo — or fill in by hand below")}
                </div>
                {photo && <img src={photo} alt="" className="ar-thumb" />}
              </div>
              {scanNote && <p className="ar-note" style={{ marginTop: 10, color: "var(--gilt)", fontSize: 13.5 }}>{scanNote}</p>}

              <Board />

              <div className="ar-rows">
                {slots.map((s, i) => (
                  <div key={s.key} className="ar-row">
                    <div>
                      <div className="ar-rowlab">
                        {String(i + 1).padStart(2, "0")} · {s.label ? L(s.label, lang) : (isPT ? "aberta" : "open")}
                        {s.opt && <span style={{ color: "var(--vellum3)" }}> ({isPT ? "opcional" : "optional"})</span>}
                      </div>
                      {s.q && <span className="ar-rowq">{L(s.q, lang)}</span>}
                    </div>
                    <select className="ar-field" style={{ marginTop: 0 }} value={s.card?.id || ""}
                      onChange={(e) => setSlot(i, { card: CARDS.find((c) => c.id === e.target.value) || null })}>
                      <option value="">{isPT ? "— vazia —" : "— empty —"}</option>
                      {["M", "w", "c", "s", "p"].map((a) => (
                        <optgroup key={a} label={L(CARDS.find((c) => c.arc === a).suit, lang)}>
                          {CARDS.filter((c) => c.arc === a).map((c) => <option key={c.id} value={c.id}>{L(c.name, lang)}</option>)}
                        </optgroup>
                      ))}
                    </select>
                    <button className="ar-rev" data-on={s.rev ? "1" : "0"} disabled={!s.card} onClick={() => setSlot(i, { rev: !s.rev })}>
                      {isPT ? "invertida" : "reversed"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {filledCount > 0 && (
              <div className="ar-dx">
                <div className="ar-eyebrow">{isPT ? "Barômetro elemental · calculado, não interpretado" : "Elemental barometer · computed, not interpreted"}</div>
                <Bar />
                <div className="ar-dxgrid">
                  <span className="ar-tag">{filledCount} {isPT ? "cartas" : "cards"}</span>
                  <span className="ar-tag" data-k={dx.majorRatio >= 0.5 ? "alert" : ""}>
                    {isPT ? "Maiores" : "Majors"} {Math.round(dx.majorRatio * 100)}%
                    {dx.majorRatio >= 0.5 && (isPT ? " · fora do controle pessoal" : " · beyond personal control")}
                  </span>
                  {dx.absent.map((k) => (
                    <span key={k} className="ar-tag" data-k="alert">
                      {isPT ? "sem " : "no "}{L({ w: "Paus|Wands", c: "Copas|Cups", s: "Espadas|Swords", p: "Ouros|Pentacles" }[k], lang)}
                    </span>
                  ))}
                  {dx.portals.map((c) => <span key={c.id} className="ar-tag" data-k="alert">{isPT ? "portal · " : "portal · "}{L(c.name, lang)}</span>)}
                  {dx.repeats.map(([n, v]) => <span key={n} className="ar-tag" data-k="alert">{v}× {isPT ? "número" : "number"} {n}</span>)}
                  {[1, 2, 3].filter((l) => dx.lines[l]).map((l) => (
                    <span key={l} className="ar-tag">{isPT ? "Linha" : "Line"} {l}: {dx.lines[l]}</span>
                  ))}
                </div>
                {dx.chain.length > 0 && (
                  <>
                    <div className="ar-eyebrow" style={{ marginTop: 14 }}>{isPT ? "Cadeia de dignidades" : "Dignity chain"}</div>
                    <div className="ar-chain">
                      {dx.chain.map((k, i) => (
                        <React.Fragment key={i}>
                          {i === 0 && <span>{L(k.a.card.name, lang)}</span>}
                          <span className="ar-link" data-d={k.d} title={k.d}>{{ same: "≡", friend: "~", enemy: "✕" }[k.d]}</span>
                          <span>{L(k.b.card.name, lang)}</span>
                        </React.Fragment>
                      ))}
                    </div>
                    <p className="ar-note" style={{ fontSize: 12.5, marginTop: 6 }}>
                      ≡ {isPT ? "mesmo elemento, reforço forte" : "same element, strong reinforcement"} · ~ {isPT ? "amigável" : "friendly"} · ✕ {isPT ? "contrários, enfraquecem-se" : "contrary, mutually weakening"}
                      {isPT ? " — esquema original da Golden Dawn, três categorias." : " — original Golden Dawn scheme, three categories."}
                    </p>
                  </>
                )}
                {dx.triads.length > 0 && (
                  <div className="ar-dxgrid" style={{ marginTop: 10 }}>
                    {dx.triads.map((t, i) => (
                      <span key={i} className="ar-tag" data-k="alert">
                        {L(t.centre.card.name, lang)} · {L({
                          dominated: "dominada pelas vizinhas|dominated by neighbours",
                          isolated: "vizinhas se anulam, lê-se sozinha|neighbours cancel, reads alone",
                          bridged: "sustentada por ponte|held by a bridge" }[t.verdict], lang)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button className="ar-btn" disabled={!filledCount || running} onClick={run}>
                {running ? (stageMsg || (isPT ? "Lendo…" : "Reading…")) : (isPT ? "Rodar a leitura" : "Run the reading")}
              </button>
              <button className="ar-btn ar-btn2" onClick={() => setSlots((s) => s.map((x) => ({ ...x, card: null, rev: false })))}>
                {isPT ? "Limpar cartas" : "Clear cards"}
              </button>
              {!filledCount && <span style={{ fontSize: 13, color: "var(--vellum3)" }}>{isPT ? "Preencha ao menos uma posição." : "Fill at least one position."}</span>}
            </div>

            {reading && (
              <div className="ar-panel" ref={readingRef} style={{ marginTop: 22 }}>
                <div className="ar-eyebrow">{L(spread.name, lang)} · {new Date().toLocaleDateString(isPT ? "pt-BR" : "en-GB")}</div>
                <div className="ar-reading" style={{ marginTop: 12 }}>{reading}</div>
                <hr className="ar-hr" />
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button className="ar-btn ar-btn2" onClick={saveReading} disabled={saved}>
                    {saved ? (isPT ? "Salva no diário" : "Saved to journal") : (isPT ? "Salvar no diário" : "Save to journal")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ---------------- TIRAGENS ---------------- */}
        {tab === "spreads" && SPREADS.map((s) => (
          <div className="ar-panel" key={s.id}>
            <h3>{L(s.name, lang)}</h3>
            <p className="ar-note" style={{ margin: "6px 0 10px" }}><strong style={{ color: "var(--vellum)" }}>{isPT ? "Quando usar." : "When to use."}</strong> {L(s.use, lang)}</p>
            <p className="ar-note">{L(s.why, lang)}</p>
            {s.pos.length > 0 && (
              <div className="ar-rows" style={{ marginTop: 14 }}>
                {s.pos.map((p, i) => (
                  <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                    <div className="ar-rowlab" style={{ color: p.key ? "var(--gilt)" : undefined }}>
                      {String(i + 1).padStart(2, "0")} · {L(p.label, lang)}
                    </div>
                    <div style={{ fontSize: 14.5, fontStyle: "italic", margin: "3px 0" }}>{L(p.q, lang)}</div>
                    <div style={{ fontSize: 13.5, color: "var(--vellum3)" }}>{L(p.why, lang)}</div>
                  </div>
                ))}
              </div>
            )}
            <button className="ar-btn ar-btn2" style={{ marginTop: 14 }} onClick={() => { setSpreadId(s.id); setTab("read"); }}>
              {isPT ? "Usar esta tiragem" : "Use this spread"}
            </button>
          </div>
        ))}

        {/* ---------------- CARTAS ---------------- */}
        {tab === "cards" && (
          <>
            <div className="ar-panel">
              <input className="ar-field" style={{ marginTop: 0 }} value={cardQuery} onChange={(e) => setCardQuery(e.target.value)}
                placeholder={isPT ? "Buscar carta…" : "Search a card…"} />
              <div className="ar-chips">
                {[["all", "Todas|All"], ["M", "Maiores|Majors"], ["w", "Paus|Wands"], ["c", "Copas|Cups"], ["s", "Espadas|Swords"], ["p", "Ouros|Pentacles"]].map(([k, n]) => (
                  <button key={k} className="ar-chip" data-on={cardFilter === k ? "1" : "0"} onClick={() => setCardFilter(k)}>{L(n, lang)}</button>
                ))}
              </div>
            </div>
            <div className="ar-grid">
              {shownCards.map((c) => (
                <button key={c.id} className="ar-cardbtn" style={{ borderLeftColor: SUIT_COLOR[c.arc] }} onClick={() => setOpenCard(c)}>
                  {L(c.name, lang)}
                  <small>{L(c.el, lang)} · {L(c.as, lang)}{c.portal ? " · portal" : ""}</small>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ---------------- MÉTODO ---------------- */}
        {tab === "method" && METHOD.map((m) => (
          <div className="ar-panel" key={m.id}>
            <h3>{L(m.t, lang)}</h3>
            <p className="ar-note" style={{ marginTop: 8 }}>{L(m.b, lang)}</p>
          </div>
        ))}

        {/* ---------------- DIÁRIO ---------------- */}
        {tab === "journal" && (
          journal.length === 0
            ? <div className="ar-panel"><p className="ar-note">{isPT ? "Nenhuma leitura salva ainda. Rode uma leitura e escolha Salvar no diário — as tiragens guardadas ficam disponíveis para comparar padrões ao longo do tempo." : "No readings saved yet. Run a reading and choose Save to journal — stored spreads stay available for comparing patterns over time."}</p></div>
            : journal.map((j) => (
              <div className="ar-panel" key={j.k}>
                <div className="ar-eyebrow">{new Date(j.ts).toLocaleString(isPT ? "pt-BR" : "en-GB")} · {j.spread}</div>
                {j.question && <div style={{ fontStyle: "italic", margin: "6px 0" }}>{j.question}</div>}
                <div className="ar-dxgrid">
                  {(j.cards || []).map((c, i) => <span key={i} className="ar-tag">{c.n}{c.rev ? " ↓" : ""}</span>)}
                </div>
                <details style={{ marginTop: 12 }}>
                  <summary style={{ cursor: "pointer", color: "var(--vellum2)", fontSize: 13.5 }}>{isPT ? "Ver leitura" : "View reading"}</summary>
                  <div className="ar-reading" style={{ marginTop: 10, fontSize: 15 }}>{j.text}</div>
                </details>
                <button className="ar-btn ar-btn2" style={{ marginTop: 12 }} onClick={() => delReading(j.k)}>{isPT ? "Excluir" : "Delete"}</button>
              </div>
            ))
        )}

        {/* ---------------- FICHA DA CARTA ---------------- */}
        {openCard && (
          <div className="ar-sheet" onClick={() => setOpenCard(null)}>
            <div className="ar-sheetin" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div className="ar-eyebrow">{L(openCard.suit, lang)}{openCard.arc === "M" ? ` · ${isPT ? "Linha" : "Line"} ${openCard.line}` : ""}</div>
                  <h2 style={{ fontSize: 26, marginTop: 4 }}>{L(openCard.name, lang)}</h2>
                </div>
                <button className="ar-btn ar-btn2" onClick={() => setOpenCard(null)}>{isPT ? "Fechar" : "Close"}</button>
              </div>
              <div className="ar-slot-bar" style={{ background: SUIT_COLOR[openCard.arc], marginTop: 12, height: 4 }} />
              <dl className="ar-def">
                <dt>{isPT ? "Elemento · Atribuição" : "Element · Attribution"}</dt>
                <dd>{L(openCard.el, lang)} · {L(openCard.as, lang)}</dd>
                <dt>{isPT ? "Cores dominantes" : "Dominant colours"}</dt>
                <dd>{LA(openCard.col, lang).join(" · ")}</dd>
                <dt>{isPT ? "Elementos do desenho" : "Elements of the image"}</dt>
                <dd>{LA(openCard.sym, lang).join(" · ")}</dd>
                <dt>{isPT ? "Direita" : "Upright"}</dt>
                <dd>{LA(openCard.up, lang).join(" · ")}</dd>
                <dt>{isPT ? "Invertida · energia bloqueada ou recanalizada" : "Reversed · blocked or rechannelled energy"}</dt>
                <dd>{LA(openCard.rev, lang).join(" · ")}</dd>
                <dt>{isPT ? "Função na estrutura" : "Function in the structure"}</dt>
                <dd>{L(openCard.fn, lang)}</dd>
                <dt>{isPT ? "O que ela alerta" : "What it warns"}</dt>
                <dd style={{ color: "var(--gilt)" }}>{L(openCard.al, lang)}</dd>
              </dl>
            </div>
          </div>
        )}

        <footer style={{ marginTop: 34, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
          <p className="ar-note" style={{ fontSize: 12.5 }}>
            {isPT
              ? "As cartas não determinam destino: refletem condicionamento somado a resultado provável. Nenhuma carta é boa ou má em si — o contexto faz o significado. A camada alquímica de Robert M. Place não está carregada nesta sessão; envie o PDF para acrescentá-la."
              : "The cards do not determine fate: they reflect conditioning plus likely outcome. No card is good or bad in itself — context makes the meaning. Robert M. Place's alchemical layer is not loaded this session; supply the PDF to add it."}
          </p>
        </footer>
      </div>
    </div>
  );
}
