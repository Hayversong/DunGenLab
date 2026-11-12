# DunGenLab

Aplicação web que gera mapas de masmorra proceduralmente com três algoritmos
(Drunkard's Walk, Cellular Automata e BSP), animando a geração passo a passo em
um canvas, com controle de parâmetros, seed reproduzível, métricas e exportação
(PNG e JSON).

> Em desenvolvimento — Fase 0 (setup) concluída.

## Como rodar

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # checagem de tipos + build de produção
npm run test     # testes (Vitest)
npm run lint     # lint (ESLint)
npm run format   # formatação (Prettier)
```

## Stack

Vite, React, TypeScript (strict), Canvas 2D, Vitest, ESLint e Prettier.

## Documentação

- [`docs/orientacoes/contexto.md`](docs/orientacoes/contexto.md) — o que é o projeto, decisões e convenções
- [`docs/orientacoes/orientacao.md`](docs/orientacoes/orientacao.md) — passo a passo por fases
- [`docs/orientacoes/relatorio.md`](docs/orientacoes/relatorio.md) — visão geral e justificativas
