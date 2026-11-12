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
npm run lint     # lint (Oxlint)
npm run format   # formatação (Prettier)
```

## Stack

Vite, React, TypeScript (strict), Canvas 2D, Vitest, Oxlint e Prettier.

## Documentação

- [`docs/contexto.md`](docs/contexto.md) — o que é o projeto, decisões e convenções
- [`docs/orientacao.md`](docs/orientacao.md) — passo a passo por fases
- [`docs/relatorio.md`](docs/relatorio.md) — visão geral e justificativas
