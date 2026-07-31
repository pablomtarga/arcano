import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Caminhos relativos: funciona tanto na raiz de um domínio (Vercel, Netlify)
  // quanto num subendereço como usuario.github.io/nome-do-repositorio/ (GitHub Pages).
  base: "./",
});
