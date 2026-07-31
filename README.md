# ARCANVM

Instrumento de leitura de Tarô profissional, bilíngue (PT-BR / EN).
Baralho Rider-Waite-Smith. Vozes de referência: Liz Dean e Rachel Pollack.

## Como rodar localmente

```
npm install
npm run dev
```

Abre em `http://localhost:5173`

## ⚠️ Aviso importante

Este projeto foi originalmente criado como um Artifact dentro do Claude.ai,
que oferece duas funções especiais que **não existem** num site comum:

- `window.storage` — usado para salvar o diário de leituras
- Chamadas diretas para `api.anthropic.com` — usadas para gerar o texto da leitura

Fora do Claude.ai, essas duas partes **não vão funcionar sozinhas**. Para o
app funcionar de verdade num site publicado (Vercel, Netlify, etc.), é
necessário:

1. Substituir `window.storage` por outra forma de guardar dados (ex:
   `localStorage` do navegador, ou um banco de dados como Supabase/Firebase).
2. Criar uma rota de backend (ex: uma função serverless) que guarda sua
   chave de API da Anthropic com segurança e chama a API por trás — nunca
   direto do navegador, por segurança.

Sem esses ajustes, o app abre e mostra a interface normalmente, mas os
botões "Rodar leitura" e "Salvar no diário" não vão funcionar.

## Estrutura

```
index.html          → página HTML base
src/main.jsx         → ponto de entrada React
src/App.jsx           → o app inteiro (dados das 78 cartas, tiragens, interface)
package.json          → dependências
vite.config.js        → configuração do Vite
```
