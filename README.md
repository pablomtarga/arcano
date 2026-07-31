# ARCANVM

Instrumento de leitura de Tarô profissional, bilíngue (PT-BR / EN).
Baralho Rider-Waite-Smith. Vozes de referência: Liz Dean e Rachel Pollack.

**Auto-leitura: 100% local.** Todo o texto de cada leitura é gerado dentro
do próprio navegador, a partir de uma base de dados com as 78 cartas
(significados, símbolos, elementos, dignidades) já embutida no código.
Não há chamada de rede, não há chave de API, não há custo por leitura —
e por isso também não há necessidade de servidor: qualquer hospedagem
de site estático serve.

## Como rodar localmente

```
npm install
npm run dev
```

Abre em `http://localhost:5173`

## Como publicar (qualquer opção funciona, sem configuração)

Como não existe backend nem chave de API, publicar é o passo mais
simples possível:

```
npm run build
```

Isso gera uma pasta `dist/` com HTML, CSS e JS puros. Essa pasta pode ir
para:

- **Vercel** — vercel.com → Add New → Project → selecione o repositório
  → Deploy. Não precisa configurar nenhuma variável de ambiente.
- **Netlify** — mesma lógica: conectar o repositório e publicar.
- **GitHub Pages** — gratuito, direto do próprio repositório
  (Settings → Pages → aponte para a pasta `dist` após o build).
- Qualquer outro host de arquivos estáticos.

## O que mudou em relação a uma versão anterior deste projeto

Uma versão anterior chamava a API da Anthropic a cada leitura (exigindo
chave paga e um servidor intermediário). Esta versão troca isso por um
mecanismo de geração de texto baseado em regras e bancos de frases,
construído a partir dos mesmos dados verificados sobre as 78 cartas —
mesma estrutura de resposta (I. Significados simbólicos → II.
Interpretação posicional → III. Síntese integrada), mesma metodologia
(dignidades elementais de Mathers, linhas de Pollack, cartas-portal,
cartas saltadoras), sem depender de nenhum serviço externo.

**Contrapartida:** o reconhecimento de cartas por foto foi removido,
porque exigiria visão computacional externa — o que contradiria a
proposta de funcionamento 100% local. As cartas são selecionadas
manualmente nos menus da tela de leitura.

## Diário de leituras

Fica salvo no `localStorage` do navegador (via `src/main.jsx`) — ou
seja, local àquele navegador/aparelho específico, sem sincronizar entre
dispositivos.

## Estrutura

```
index.html        → página HTML base
src/main.jsx       → ponto de entrada React + guarda-dados local (localStorage)
src/data.jsx        → base de dados das 78 cartas (RWS), bilíngue
src/spreads.jsx      → as 8 tiragens, dignidades elementais, banco do Método
src/engine.jsx        → motor de geração de texto: monta a leitura inteira,
                         sem rede, a partir dos dados acima
src/App.jsx             → interface (abas, seleção de cartas, diário, ficha de carta)
package.json              → dependências
vite.config.js             → configuração do Vite
```
