import React, { useState, useEffect, useMemo, useRef } from "react";
import { L, LA, CARDS, norm } from "./data.jsx";
import { SPREADS, METHOD } from "./spreads.jsx";
import { diagnose, generateReading } from "./engine.jsx";

/* ============================================================
   ARCANVM — Instrumento de leitura de Tarô (RWS)
   Auto-leitura: o texto é gerado inteiramente neste arquivo,
   a partir dos dados das 78 cartas. Nenhuma chamada de rede,
   nenhuma chave de API, nenhum custo por leitura.
   ============================================================ */

const SUIT_COLOR = { M: "var(--major)", w: "var(--fire)", c: "var(--water)", s: "var(--air)", p: "var(--earth)" };
const T = {
  read: "Leitura|Reading", spreads: "Tiragens|Spreads", cards: "Cartas|Cards",
  method: "Método|Method", journal: "Diário|Journal",
};

/* ---------- renderização dos blocos de leitura ---------- */
function ReadingBlocks({ blocks }) {
  return (
    <div className="ar-reading">
      {blocks.map((b, i) => {
        if (b.type === "h1") return <h3 key={i} className="ar-rh1">{b.text}</h3>;
        if (b.type === "h2") return <h4 key={i} className="ar-rh2">{b.text}</h4>;
        if (b.type === "h3") return <div key={i} className="ar-rh3">{b.text}</div>;
        if (b.type === "q") return <div key={i} className="ar-rq">{b.text}</div>;
        if (b.type === "voice") return (
          <p key={i} className="ar-rp"><span className="ar-rvoice">{b.label}.</span> {b.text}</p>
        );
        if (b.type === "note") return <p key={i} className="ar-rnote">{b.text}</p>;
        return <p key={i} className="ar-rp">{b.text}</p>;
      })}
    </div>
  );
}

export default function Arcanum() {
  const [lang, setLang] = useState("pt");
  const [tab, setTab] = useState("read");
  const [spreadId, setSpreadId] = useState("three");
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [allReversed, setAllReversed] = useState(false);
  const [slots, setSlots] = useState([]);
  const [openCount, setOpenCount] = useState(9);
  const [reading, setReading] = useState([]);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState("");
  const [cardQuery, setCardQuery] = useState("");
  const [cardFilter, setCardFilter] = useState("all");
  const [openCard, setOpenCard] = useState(null);
  const [journal, setJournal] = useState([]);
  const [saved, setSaved] = useState(false);
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
    setReading([]); setSaved(false);
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

  const dx = useMemo(() => diagnose(slots), [slots]);
  const filledCount = slots.filter((s) => s.card).length;

  const setSlot = (i, patch) => setSlots((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  /* ----- rodar leitura — 100% local, sem rede ----- */
  const run = () => {
    if (!filledCount) return;
    setRunning(true); setErr(""); setSaved(false);
    // pequeno atraso apenas para dar sensação de "processando"; o cálculo em si é instantâneo
    setTimeout(() => {
      try {
        const blocks = generateReading({ slots, spread, question, context, allReversed, lang });
        setReading(blocks);
        setTimeout(() => readingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      } catch (e) {
        setErr(isPT ? "Não foi possível montar a leitura. Tente novamente." : "Could not assemble the reading. Try again.");
      }
      setRunning(false);
    }, 260);
  };

  const saveReading = async () => {
    try {
      const rec = { ts: Date.now(), spread: L(spread.name, lang), question,
        cards: slots.filter((s) => s.card).map((s) => ({ n: L(s.card.name, lang), rev: s.rev, pos: s.label ? L(s.label, lang) : "" })),
        blocks: reading, lang };
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
  .ar-sub{font-size:13px;color:var(--vellum3);font-family:'Archivo',sans-serif;max-width:360px;}
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

  .ar-reading{font-size:16.5px;line-height:1.78;color:var(--vellum);}
  .ar-rh1{font-family:'Archivo',sans-serif;font-size:11px;letter-spacing:.16em;text-transform:uppercase;
      color:var(--gilt);border-bottom:1px solid var(--line);padding-bottom:8px;margin:26px 0 14px;}
  .ar-rh1:first-child{margin-top:0;}
  .ar-rh2{font-family:'IM Fell English',serif;font-size:20px;color:var(--vellum);margin:18px 0 6px;}
  .ar-rh3{font-family:'Archivo',sans-serif;font-size:12px;letter-spacing:.05em;color:var(--vellum2);
      margin:18px 0 2px;text-transform:uppercase;}
  .ar-rq{font-size:14px;font-style:italic;color:var(--vellum3);margin-bottom:8px;}
  .ar-rp{margin:0 0 10px;}
  .ar-rvoice{font-family:'Archivo',sans-serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase;
      color:var(--gilt);}
  .ar-rnote{margin-top:16px;padding-top:12px;border-top:1px solid var(--line);font-size:13px;
      color:var(--vellum3);font-style:italic;}

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
  .ar-offline{display:inline-flex;align-items:center;gap:6px;font-family:'Archivo',sans-serif;font-size:11px;
      letter-spacing:.08em;text-transform:uppercase;color:var(--vellum3);}
  .ar-offline::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--gilt);display:inline-block;}
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <button className="ar-langbtn" onClick={() => setLang(isPT ? "en" : "pt")}>
                {isPT ? "EN ↗" : "PT-BR ↗"}
              </button>
              <span className="ar-offline">{isPT ? "100% local · sem rede" : "100% local · no network"}</span>
            </div>
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
              <p className="ar-note" style={{ marginTop: 8 }}>
                {isPT
                  ? "Selecione cada carta manualmente abaixo. Reconhecimento por foto exigiria visão computacional externa, o que contradiria o funcionamento 100% local deste instrumento — por isso não está incluído."
                  : "Select each card manually below. Photo recognition would require external computer vision, which would contradict this instrument's fully local operation — so it is not included."}
              </p>

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
                  {dx.portals.map((s) => <span key={s.card.id} className="ar-tag" data-k="alert">{isPT ? "portal · " : "portal · "}{L(s.card.name, lang)}</span>)}
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
                {running ? (isPT ? "Montando…" : "Assembling…") : (isPT ? "Rodar a leitura" : "Run the reading")}
              </button>
              <button className="ar-btn ar-btn2" onClick={() => setSlots((s) => s.map((x) => ({ ...x, card: null, rev: false })))}>
                {isPT ? "Limpar cartas" : "Clear cards"}
              </button>
              {!filledCount && <span style={{ fontSize: 13, color: "var(--vellum3)" }}>{isPT ? "Preencha ao menos uma posição." : "Fill at least one position."}</span>}
            </div>

            {reading.length > 0 && (
              <div className="ar-panel" ref={readingRef} style={{ marginTop: 22 }}>
                <div className="ar-eyebrow">{L(spread.name, lang)} · {new Date().toLocaleDateString(isPT ? "pt-BR" : "en-GB")}</div>
                <ReadingBlocks blocks={reading} />
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
                  <div style={{ marginTop: 10 }}><ReadingBlocks blocks={j.blocks || []} /></div>
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
              ? "As cartas não determinam destino: refletem condicionamento somado a resultado provável. Nenhuma carta é boa ou má em si — o contexto faz o significado. A camada alquímica de Robert M. Place não está integrada a este instrumento. Todo o texto acima é gerado localmente, sem envio de dados para nenhum servidor."
              : "The cards do not determine fate: they reflect conditioning plus likely outcome. No card is good or bad in itself — context makes the meaning. Robert M. Place's alchemical layer is not integrated into this instrument. All text above is generated locally, with no data sent to any server."}
          </p>
        </footer>
      </div>
    </div>
  );
}
