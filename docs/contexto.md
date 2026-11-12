# DunGenLab — Arquivo de Contexto

> Documento de referência do projeto. Se for usar uma IA para ajudar no desenvolvimento, cole este arquivo no início da conversa. Ele descreve **o que** é o projeto, **o que está decidido** e **as convenções**. O *como fazer passo a passo* está em `orientacao.md`; a explicação geral e conceitual está em `relatorio.md`.

---

## 1. Resumo em uma frase

Aplicação web de frontend que **gera mapas de masmorra proceduralmente** com três algoritmos (Drunkard's Walk, Cellular Automata e BSP), **animando a geração passo a passo** em um canvas, com controle de parâmetros, seed reproduzível, métricas do mapa e exportação (PNG e JSON).

## 2. Objetivos

**Objetivo principal:** ter um projeto de portfólio visual, que mostre domínio de algoritmos de geração procedural e de frontend com Canvas, finalizado em um fim de semana.

**Objetivos de aprendizado:**
- Entender de verdade como cada algoritmo funciona, vendo-o rodar.
- Praticar Canvas API, `requestAnimationFrame` e controle de animação (play, pause, passo, velocidade).
- Separar lógica pura (algoritmos) de interface (React), deixando o núcleo testável.
- Trabalhar com PRNG com seed para garantir reprodutibilidade.

**Objetivo secundário:** o núcleo de algoritmos poderá ser reaproveitado em jogos (ex.: GameMaker, Godot) como referência de implementação.

## 3. Escopo

### Dentro do escopo (MVP)
1. Três geradores: Drunkard's Walk, Cellular Automata, BSP.
2. Renderização em canvas de uma grade de tiles (parede/chão, e sala/corredor no BSP).
3. Animação passo a passo, com play/pause, avançar um passo, reiniciar e controle de velocidade.
4. Painel de parâmetros por algoritmo (sliders/inputs) e seletor de algoritmo.
5. Seed (texto ou número) com botão de seed aleatória; mesma seed + mesmos parâmetros = mesmo mapa.
6. Métricas: % de chão, número de regiões conectadas, número de salas (quando aplicável), tempo de geração.
7. Exportar mapa como **PNG** e como **JSON**; importar o JSON de volta (opcional, ver "Se sobrar tempo").
8. Interface responsiva básica e tema escuro.

### Se sobrar tempo (extras)
- Importar JSON e recarregar o mapa.
- Garantir conectividade (pós-processamento que liga regiões isoladas).
- Comparar dois algoritmos lado a lado.
- Compartilhar via URL (seed e parâmetros na query string).
- Tema claro/escuro alternável.

### Fora do escopo (não fazer neste fim de semana)
- Backend, contas de usuário, banco de dados.
- Geração 3D ou mapas em hexágonos.
- Editor manual de mapa (isso é o projeto 1 da lista de ideias).
- Itens, inimigos, loot, lógica de jogo.
- Algoritmos além dos três (Perlin/Simplex, WFC, etc.). Ficam para uma v2.

## 4. Stack decidida

| Camada | Escolha | Motivo |
|---|---|---|
| Build/dev | **Vite** | Setup rápido, HMR |
| Linguagem | **TypeScript** (strict) | Tipos para o modelo de dados e para os geradores |
| UI | **React 18+** | Painel de controles e estado de UI |
| Render do mapa | **Canvas 2D API** | Simples e rápido para grade de tiles |
| Estilo | **CSS Modules** ou CSS puro | Sem dependência extra |
| Testes | **Vitest** | Integra com Vite; foco em testar o núcleo |
| Lint/format | ESLint + Prettier | Padrão |

**Regra de ouro:** nenhum arquivo dentro de `src/core/` importa React ou toca no DOM. O núcleo é TypeScript puro.

## 5. Arquitetura em camadas

```
┌──────────────────────────────────────────────┐
│  UI (React)                                  │
│  Painel de controles, métricas, botões       │
└───────────────┬──────────────────────────────┘
                │ props / hooks
┌───────────────▼──────────────────────────────┐
│  Controlador de animação (hook)              │
│  Consome o gerador, controla play/pause/step │
└───────┬──────────────────────┬───────────────┘
        │                      │
┌───────▼────────┐    ┌────────▼───────────────┐
│ Core (TS puro) │    │ Renderer (Canvas)       │
│ Geradores, RNG │    │ Desenha Grid no canvas  │
│ Métricas, Grid │    │ Sem lógica de algoritmo │
└────────────────┘    └─────────────────────────┘
```

### Estrutura de pastas

```
dungenlab/
├─ src/
│  ├─ core/
│  │  ├─ types.ts            # Grid, Tile, Point, GenStep, Generator...
│  │  ├─ grid.ts             # criar/clonar/ler/escrever grid
│  │  ├─ rng.ts              # PRNG com seed (mulberry32) + hash de string
│  │  ├─ metrics.ts          # % chão, flood fill, regiões
│  │  ├─ export.ts           # toJSON / fromJSON
│  │  └─ generators/
│  │     ├─ drunkardsWalk.ts
│  │     ├─ cellularAutomata.ts
│  │     ├─ bsp.ts
│  │     └─ index.ts         # registro dos geradores
│  ├─ render/
│  │  └─ canvasRenderer.ts   # drawGrid(ctx, grid, opts)
│  ├─ hooks/
│  │  └─ useGeneration.ts    # controle da animação
│  ├─ components/
│  │  ├─ MapCanvas.tsx
│  │  ├─ ControlPanel.tsx
│  │  ├─ ParamField.tsx
│  │  ├─ PlaybackBar.tsx
│  │  └─ MetricsPanel.tsx
│  ├─ App.tsx
│  └─ main.tsx
├─ tests/
│  ├─ rng.test.ts
│  ├─ generators.test.ts
│  └─ metrics.test.ts
└─ docs/
   ├─ contexto.md
   ├─ orientacao.md
   └─ relatorio.md
```

## 6. Modelo de dados (decisões)

### Grid
- Tamanho padrão: **80 × 50** tiles. Configurável entre 20×20 e 200×120.
- Armazenado em `Uint8Array` de tamanho `width * height` (índice = `y * width + x`).
- Valores de tile:

| Valor | Nome | Significado |
|---|---|---|
| 0 | `WALL` | Parede / vazio sólido |
| 1 | `FLOOR` | Chão (caverna ou piso genérico) |
| 2 | `ROOM` | Chão de sala (BSP) |
| 3 | `CORRIDOR` | Chão de corredor (BSP) |

Para métricas, **qualquer tile diferente de `WALL` é "caminhável"**.

### Geradores como *generator functions*
Cada algoritmo é uma função geradora (`function*`) que **muta um grid compartilhado** e faz `yield` a cada passo lógico. Isso permite:
- Rodar tudo de uma vez (consumir o iterador até o fim) para "gerar instantâneo".
- Animar (consumir N passos por frame).
- Pausar e avançar passo a passo naturalmente.

O `yield` devolve um objeto leve (`GenStep`), **não uma cópia do grid** (evita custo de memória):

```ts
interface GenStep {
  description?: string;   // texto curto: "Cortando sala 3 em dois"
  highlight?: Point[];    // células a destacar neste passo (opcional)
  done?: boolean;         // true no último passo
}
```

### Contrato de um gerador

```ts
interface Generator<P> {
  id: string;                       // "drunkards-walk"
  name: string;                     // "Drunkard's Walk"
  description: string;              // texto curto para a UI
  defaultParams: P;
  paramSchema: ParamDef[];          // descreve sliders/inputs da UI
  run(grid: Grid, params: P, rng: Rng): Generator<GenStep, void, void>;
}
```

(Em TypeScript, o tipo do iterador será `IterableIterator<GenStep>` ou `Generator<GenStep, void, void>` do lib padrão; atenção para não confundir com o nome da interface acima, que pode se chamar `MapGenerator`.)

## 7. Algoritmos — parâmetros e valores padrão

### 7.1 Drunkard's Walk (caminhada do bêbado)
Um "andarilho" começa no centro e se move aleatoriamente nas 4 direções, abrindo chão por onde passa, até atingir a porcentagem desejada de chão.

| Parâmetro | Tipo | Padrão | Faixa |
|---|---|---|---|
| `targetFloorPercent` | slider | 40 | 10–70 |
| `walkers` | slider | 1 | 1–8 |
| `stepsPerYield` | int | 5 | 1–50 |
| `turnBias` | slider | 0 | 0–0.8 (tendência de manter a direção) |

### 7.2 Cellular Automata (autômato celular — cavernas)
Preenche o grid com paredes aleatórias (ruído) e aplica regras de vizinhança por várias iterações para suavizar em cavernas.

| Parâmetro | Tipo | Padrão | Faixa |
|---|---|---|---|
| `initialWallChance` | slider | 0.45 | 0.30–0.60 |
| `iterations` | int | 5 | 1–12 |
| `birthLimit` | int | 5 | 3–7 (parede nasce se vizinhas-parede ≥ valor) |
| `survivalLimit` | int | 4 | 2–6 (parede sobrevive se vizinhas-parede ≥ valor) |

Cada `yield` = uma iteração completa (e um yield inicial para mostrar o ruído).
Vizinhança: Moore (8 vizinhos); bordas contam como parede.

### 7.3 BSP (Binary Space Partitioning — salas e corredores)
Divide o mapa recursivamente em retângulos; em cada folha cria uma sala; depois conecta irmãos com corredores.

| Parâmetro | Tipo | Padrão | Faixa |
|---|---|---|---|
| `minLeafSize` | int | 10 | 6–20 |
| `maxDepth` | int | 5 | 2–8 |
| `roomPadding` | int | 1 | 1–3 |
| `corridorWidth` | int | 1 | 1–3 |

Fases (cada uma gera `yield`s): (1) dividir, (2) criar salas, (3) conectar corredores.

## 8. Seed e aleatoriedade

- PRNG: **mulberry32** (32 bits, simples, rápido, determinístico).
- A seed da UI é um texto. Converte-se em número com um hash simples (ex.: cyrb128/xmur3) para alimentar o PRNG.
- **Proibido usar `Math.random()` dentro de `src/core/`.** Tudo passa pelo `Rng` recebido por parâmetro. Exceção única: o botão "seed aleatória" da UI.
- Critério: gerar duas vezes com a mesma seed e parâmetros resulta em grids idênticos (teste automatizado).

## 9. Métricas

| Métrica | Como calcular |
|---|---|
| % de chão | tiles ≠ WALL ÷ total × 100 |
| Regiões conectadas | flood fill (BFS iterativo) em 4 direções |
| Maior região (%) | tamanho da maior região ÷ total de chão |
| Salas | contador mantido pelo BSP (null para os outros) |
| Tempo de geração | `performance.now()` ao rodar sem animação |

Usar BFS **iterativo** (fila), nunca recursão, para não estourar a pilha em grids grandes.

## 10. Formato de exportação JSON

```json
{
  "version": 1,
  "generator": "bsp",
  "seed": "gato-preto",
  "params": { "minLeafSize": 10, "maxDepth": 5, "roomPadding": 1, "corridorWidth": 1 },
  "width": 80,
  "height": 50,
  "tiles": "0000111100..."
}
```

- `tiles` é uma string com um dígito por tile, linha após linha (compacta e legível).
- `version` existe para permitir mudanças futuras no formato.
- Exportar PNG: usar `canvas.toBlob`; o PNG sai em resolução inteira (1 tile = N pixels, configurável), sem a UI.

## 11. Convenções de código

- TypeScript `strict: true`. Sem `any` (usar `unknown` + validação quando necessário).
- Funções puras no `core`; efeitos colaterais só em hooks/componentes.
- Nomes de arquivos: `camelCase.ts` para módulos, `PascalCase.tsx` para componentes.
- Identificadores em inglês; comentários, textos de UI e documentação em português.
- Commits no formato *Conventional Commits* (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
- Um commit por funcionalidade concluída; nada de commits gigantes no domingo à noite.
- Constantes mágicas ficam em um arquivo `constants.ts` ou no `defaultParams`.

## 12. Glossário

| Termo | Significado |
|---|---|
| Procedural | Conteúdo gerado por algoritmo e não desenhado à mão |
| Seed | Valor inicial do PRNG; mesma seed = mesma sequência |
| PRNG | Gerador de números pseudoaleatórios determinístico |
| Tile | Uma célula da grade |
| Flood fill | Percorrer uma região conectada a partir de um ponto |
| BSP | Divisão binária recursiva do espaço |
| Vizinhança de Moore | Os 8 vizinhos ao redor de uma célula |
| Folha (BSP) | Nó final da árvore, que não foi dividido |

## 13. Critérios de "pronto"

- [ ] Os 3 algoritmos geram mapas visualmente corretos e animam passo a passo.
- [ ] Play, pause, passo e velocidade funcionam sem travar a interface.
- [ ] Mesma seed + mesmos parâmetros produz o mesmo mapa (teste passando).
- [ ] Métricas exibidas e corretas (conferidas em um grid pequeno à mão).
- [ ] Export PNG e JSON funcionando.
- [ ] Sem erros no console; `npm run build` passa; `npm run test` passa.
- [ ] README com GIF/prints, explicação dos algoritmos e link do deploy.
- [ ] Deploy publicado (Vercel, Netlify ou GitHub Pages).
