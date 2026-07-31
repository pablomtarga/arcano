import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

/* ------------------------------------------------------------------
   window.storage não existe fora do Claude.ai. Este shim reproduz a
   mesma assinatura (get/set/delete/list) usando localStorage do
   navegador, para que o Diário funcione no site publicado.
   Atenção: isso guarda os dados só naquele navegador/aparelho — não
   sincroniza entre celular e computador, por exemplo.
   ------------------------------------------------------------------ */
if (!window.storage) {
  const PFX = "arcanum:";
  window.storage = {
    async get(key) {
      const raw = localStorage.getItem(PFX + key);
      if (raw === null) throw new Error("not found");
      return { key, value: raw, shared: false };
    },
    async set(key, value) {
      localStorage.setItem(PFX + key, value);
      return { key, value, shared: false };
    },
    async delete(key) {
      const had = localStorage.getItem(PFX + key) !== null;
      localStorage.removeItem(PFX + key);
      return { key, deleted: had, shared: false };
    },
    async list(prefix = "") {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PFX + prefix)) keys.push(k.slice(PFX.length));
      }
      return { keys, prefix, shared: false };
    },
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
