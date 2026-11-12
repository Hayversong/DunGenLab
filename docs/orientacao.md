# DunGenLab — Arquivo de Orientação

> Guia prático de execução. Siga as fases na ordem; cada fase termina com um **marco verificável**. Decisões de arquitetura e de dados estão em `contexto.md`; o porquê de cada escolha está em `relatorio.md`.

---

## 0. Como usar este guia

1. Faça uma fase por vez. Não pule para a seguinte sem cumprir o marco.
2. Faça commit ao fim de cada fase (ou de cada item importante).
3. Se travar mais de 30 minutos em algo, **corte escopo** (veja a seção "Plano de corte" no fim) em vez de atrasar o resto.
4. Ao pedir ajuda para uma IA, cole o `contexto.md` e diga em qual fase/item você está.

## 1. Cronograma sugerido

| Bloco | Fases | Duração estimada |
|---|---|---|
| **Sábado manhã** | 0 (setup) e 1 (núcleo: tipos, grid, RNG) | 2–3 h |
| **Sábado tarde** | 2 (renderer) e 3 (Drunkard's Walk + animação) | 3–4 h |
| **Domingo manhã** | 4 (Cellular Automata e BSP) | 3–4 h |
| **Domingo tarde** | 5 (métricas), 6 (export), 7 (polimento e deploy) | 3–4 h |

Total: cerca de 12–15 horas. Se o tempo for menor, use o plano de corte.

---

## Fase 0 — Setup (30–45 min)

**Tarefas**
- [x] Criar o projeto: `npm create vite@latest dungenlab -- --template react-ts`
- [x] Instalar dependências de desenvolvimento: `npm i -D vitest prettier eslint` (e os plugins que o template pedir)
- [x] Ativar `"strict": true` no `tsconfig.json`
- [x] Adicionar script `"test": "vitest run"` no `package.json`
- [x] Criar a estrutura de pastas do `contexto.md` (seção 5), mesmo com arquivos vazios
- [x] Copiar os 3 documentos para `docs/`
- [x] Inicializar git, criar repositório no GitHub, primeiro commit

**Marco:** `npm run dev` abre a página padrão; `npm run build` e `npm run test` rodam sem erro.

---

## Fase 1 — Núcleo: tipos, grid e RNG (1,5–2 h)

Esta é a base de tudo. Faça com testes, porque o resto depende disso.

### 1.1 `core/types.ts`

```ts
export const Tile = {
  WALL: 0,
  FLOOR: 1,
  ROOM: 2,
  CORRIDOR: 3,
} as const;
export type TileValue = (typeof Tile)[keyof typeof Tile];

export interface Point { x: number; y: number }

export interface Grid {
  width: number;
  height: number;
  tiles: Uint8Array; // índice = y * width + x
}

export interface GenStep {
  description?: string;
  highlight?: Point[];
  done?: boolean;
}

export interface Rng {
  next(): number;                       // [0, 1)
  int(minInclusive: number, maxExclusive: number): number;
  chance(p: number): boolean;           // true com probabilidade p
  pick<T>(arr: readonly T[]): T;
}
```

### 1.2 `core/grid.ts`
Funções: `createGrid(w, h, fill = Tile.WALL)`, `inBounds(grid, x, y)`, `getTile(grid, x, y)` (retorna `WALL` fora dos limites), `setTile(grid, x, y, v)` (ignora fora dos limites), `cloneGrid(grid)`, `countTiles(grid, predicate)`.

### 1.3 `core/rng.ts`
Implementar:
- `hashSeed(text: string): number` — transforma string em inteiro de 32 bits (ex.: xmur3).
- `createRng(seed: string | number): Rng` — usando **mulberry32**:

```ts
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

### 1.4 Testes (`tests/rng.test.ts`)
- Mesma seed produz a mesma sequência de 100 números.
- Seeds diferentes produzem sequências diferentes.
- `int(a, b)` sempre devolve valores em `[a, b)` (testar com 10 mil amostras).
- `getTile` fora dos limites devolve `WALL`.

**Marco:** testes passando. Commit: `feat(core): tipos, grid e rng com seed`.

---

## Fase 2 — Renderer e esqueleto da UI (1,5 h)

### 2.1 `render/canvasRenderer.ts`
Função `drawGrid(ctx, grid, tileSize, highlight?)`:
- Limpa o canvas e pinta cada tile conforme a paleta (WALL escuro, FLOOR claro, ROOM e CORRIDOR em tons distintos).
- Desenha os `highlight` por cima com uma cor de destaque.
- Otimização simples: desabilitar suavização (`ctx.imageSmoothingEnabled = false`) e dimensionar o canvas por `width * tileSize`.

Paleta sugerida (ajuste ao gosto):

| Tile | Cor |
|---|---|
| WALL | `#14161c` |
| FLOOR | `#c9b48a` |
| ROOM | `#d8c9a3` |
| CORRIDOR | `#a89268` |
| Destaque | `#ff5d73` |

### 2.2 `components/MapCanvas.tsx`
Recebe `grid`, `tileSize`, `highlight` e redesenha quando mudarem (`useEffect` + `ref` do canvas). **Não** guarde o grid em `useState` se ele é mutado no lugar: use `useRef` para o grid e um contador de versão (`useState<number>`) para forçar o redesenho a cada frame.

### 2.3 Layout do `App.tsx`
Duas colunas: canvas à esquerda; à direita um painel (por enquanto vazio) com seletor de algoritmo, seed, e métricas.

**Marco:** um grid de teste (ex.: padrão xadrez) aparece no canvas, com tamanho correto e sem borrão. Commit: `feat(render): canvas renderer e layout base`.

---

## Fase 3 — Drunkard's Walk + controle de animação (2–2,5 h)

### 3.1 Algoritmo (`generators/drunkardsWalk.ts`)

Pseudocódigo:

```
function* run(grid, params, rng):
  fill grid with WALL
  alvo = floor(width*height * targetFloorPercent/100)
  criar `walkers` andarilhos, todos no centro (ou espalhados perto dele)
  floorCount = 0
  enquanto floorCount < alvo:
    para cada andarilho:
      se tile atual é WALL: virar FLOOR; floorCount++
      escolher direção:
        com probabilidade turnBias, manter a direção anterior
        senão, direção aleatória entre 4
      mover (se sair da margem de 1 tile, escolher outra direção)
    a cada `stepsPerYield` movimentos: yield { highlight: posições dos andarilhos }
  yield { done: true }
```

Cuidados:
- Mantenha uma **margem de 1 tile** de parede nas bordas.
- Proteja contra loop infinito: limite máximo de passos (ex.: `width * height * 20`).
- Teste: com `targetFloorPercent = 30`, o chão final fica entre 30% e ~31%.

### 3.2 Registro (`generators/index.ts`)
Exportar um array `generators` e um `getGenerator(id)`. A UI só conversa com esse registro, nunca importa algoritmos direto.

### 3.3 Hook de animação (`hooks/useGeneration.ts`)

Responsabilidades:
- Guardar: `grid` (ref), `iterator` (ref), `status` (`idle` | `running` | `paused` | `done`), `speed` (passos de gerador por frame), `lastStep` (descrição/highlight), `version`.
- `start()`: cria grid novo, `rng` a partir da seed, iterador a partir do gerador escolhido; status → `running`.
- Loop com `requestAnimationFrame`: a cada frame consome `speed` passos (`iterator.next()`); ao receber `done` (ou `iterator.done`), status → `done`.
- `pause()` / `resume()` / `step()` (avança 1 passo e fica em pausa) / `reset()` / `finish()` (consome tudo de uma vez, útil para medir o tempo).
- **Cancelar o `requestAnimationFrame` no cleanup do `useEffect`** para evitar vazamento e animações duplicadas (cuidado com o StrictMode do React em dev, que monta duas vezes).

### 3.4 `components/PlaybackBar.tsx`
Botões: Gerar, Play/Pause, Passo, Finalizar, Reiniciar; slider de velocidade.

### 3.5 Painel de parâmetros genérico
`ParamField.tsx` renderiza um input/slider a partir de um `ParamDef`:

```ts
interface ParamDef {
  key: string;
  label: string;
  type: "int" | "float";
  min: number;
  max: number;
  step: number;
}
```

`ControlPanel.tsx` percorre `generator.paramSchema` e monta os campos. **Assim, os próximos algoritmos aparecem na UI sem escrever UI nova.**

**Marco:** escolher Drunkard's Walk, clicar em Gerar e ver a caverna crescendo; pausar, avançar passo a passo e finalizar funcionam. Commit: `feat: drunkards walk com animacao e controles`.

---

## Fase 4 — Cellular Automata e BSP (3–4 h)

### 4.1 Cellular Automata (`generators/cellularAutomata.ts`)

```
function* run(grid, params, rng):
  para cada tile interno: WALL com prob. initialWallChance, senão FLOOR
  bordas sempre WALL
  yield { description: "Ruído inicial" }
  repetir `iterations` vezes:
    novo = cópia do grid
    para cada tile interno:
      n = quantidade de vizinhos (Moore) que são WALL (fora do grid conta como WALL)
      se tile é WALL: novo = (n >= survivalLimit) ? WALL : FLOOR
      senão:          novo = (n >= birthLimit)    ? WALL : FLOOR
    copiar novo para grid
    yield { description: `Iteração ${i}` }
  yield { done: true }
```

Atenção: **use dois buffers** (leia do antigo, escreva no novo). Atualizar no lugar corrompe o resultado, porque as células já atualizadas influenciam as vizinhas.

Teste: com seed fixa, o grid final é idêntico em duas execuções; e com `iterations = 0`, a proporção de paredes fica perto de `initialWallChance` (tolerância de ±3%).

### 4.2 BSP (`generators/bsp.ts`)

Estruturas:

```ts
interface Rect { x: number; y: number; w: number; h: number }
interface BspNode {
  rect: Rect;
  left?: BspNode;
  right?: BspNode;
  room?: Rect;
}
```

Fase A — dividir:

```
split(node, depth):
  se depth >= maxDepth: retornar
  escolher orientação:
    se w > h*1.25 → vertical; se h > w*1.25 → horizontal; senão aleatório
  limite = (orientação vertical ? w : h) - minLeafSize
  se limite < minLeafSize: retornar (não dá para dividir)
  ponto = rng.int(minLeafSize, limite + 1)
  criar left e right; yield { description: "Dividindo", highlight: borda do corte }
  split(left, depth+1); split(right, depth+1)
```

Fase B — salas (folhas): para cada folha, sala com tamanho aleatório dentro do rect, respeitando `roomPadding`; pintar como `ROOM`; `yield` por sala.

Fase C — corredores: para cada nó interno (de baixo para cima), pegar um ponto central de uma sala descendente de `left` e outro de `right`, e escavar um corredor em "L" (horizontal e depois vertical, ou o contrário, escolhido pela RNG) com largura `corridorWidth`, pintando só tiles `WALL` como `CORRIDOR`; `yield` por corredor.

Cuidados:
- Como nós internos não têm `room`, escreva uma função `getRoom(node)` que desce recursivamente até achar uma sala.
- Garanta que `minLeafSize` seja grande o bastante para caber sala + padding (ex.: `minLeafSize >= 2*roomPadding + 3`); se não, ajuste o valor ou valide na UI.
- Conte as salas para a métrica.

Teste: com seed fixa, o BSP gera pelo menos uma sala; e **todas as salas ficam em uma única região conectada** (use o flood fill da fase 5; se ainda não existir, deixe este teste para a fase 5).

**Marco:** os 3 algoritmos selecionáveis, cada um com seus parâmetros e sua animação. Commits separados: `feat: cellular automata`, `feat: bsp`.

---

## Fase 5 — Métricas (1–1,5 h)

### 5.1 `core/metrics.ts`

```ts
export interface MapMetrics {
  floorPercent: number;
  regionCount: number;
  largestRegionPercent: number; // do total de chão
}
export function computeMetrics(grid: Grid): MapMetrics
```

Implementação de regiões: BFS iterativo com fila (`number[]` de índices) e um `Uint8Array` de visitados. Percorra todos os tiles; ao achar um caminhável não visitado, abra uma nova região e some o tamanho.

### 5.2 `components/MetricsPanel.tsx`
Mostrar as métricas **ao fim da geração** (e opcionalmente em tempo real, com throttle). Mostrar também o tempo de geração medido em `finish()`.

### 5.3 Testes (`tests/metrics.test.ts`)
- Grid 5×5 todo de parede: 0% de chão, 0 regiões.
- Grid com 2 ilhas separadas (desenhadas à mão): `regionCount = 2`.
- Grid todo de chão: 100%, 1 região, maior região = 100%.

**Marco:** os números batem com os grids de teste desenhados à mão. Commit: `feat(core): metricas e flood fill`.

---

## Fase 6 — Exportação (1 h)

### 6.1 `core/export.ts`
- `toJSON(grid, meta): string` no formato da seção 10 do `contexto.md`.
- `fromJSON(text): { grid, meta }` com **validação** (versão suportada, `width*height === tiles.length`, só dígitos 0–3). Lançar erro com mensagem clara se inválido.

### 6.2 PNG
`canvas.toBlob(blob => ...)` → criar `<a download="mapa-<seed>.png">`, clicar e revogar a URL (`URL.revokeObjectURL`). Opção de `tileSize` na exportação (ex.: 4, 8, 16 px).

### 6.3 JSON
Botões "Exportar JSON" (download) e, se der tempo, "Importar JSON" (`<input type="file">`), que carrega o grid direto no canvas em status `done`.

### 6.4 Testes
Round-trip: `fromJSON(toJSON(grid))` devolve um grid idêntico; JSON inválido lança erro.

**Marco:** exportar e abrir o PNG em outro programa; exportar JSON e reimportar. Commit: `feat: exportacao png e json`.

---

## Fase 7 — Polimento, README e deploy (2–3 h)

**Interface**
- [ ] Estados vazios e desabilitados (ex.: "Passo" desabilitado durante `running`)
- [ ] Layout responsivo (painel abaixo do canvas em telas estreitas)
- [ ] Tema escuro consistente, foco visível no teclado, `aria-label` nos botões de ícone
- [ ] Atalhos: `Espaço` = play/pause, `→` = passo, `R` = reiniciar
- [ ] Mostrar a descrição do passo atual ("Dividindo região 2/5")

**Robustez**
- [ ] Validar tamanhos e parâmetros (clamp nos limites do `paramSchema`)
- [ ] Trocar de algoritmo no meio da animação cancela a anterior sem erro
- [ ] Sem avisos no console; sem vazamento de `requestAnimationFrame`

**Qualidade**
- [ ] `npm run build`, `npm run test`, `npm run lint` limpos
- [ ] Rodar em Chrome e Firefox

**README**
- [ ] Título, GIF da animação, link do deploy
- [ ] Explicação curta (1 parágrafo) de cada algoritmo, com um print
- [ ] Como rodar localmente
- [ ] Decisões técnicas (generators, PRNG com seed, núcleo sem React)

**Deploy**
- [ ] Publicar na Vercel, Netlify ou GitHub Pages (se for Pages, configurar `base` no `vite.config.ts`)
- [ ] Testar o link público

**Marco final:** todos os itens da seção 13 do `contexto.md` marcados.

---

## Plano de corte (se o tempo apertar)

Corte nesta ordem, do primeiro ao último:
1. Importar JSON, atalhos de teclado, tema alternável
2. Opção de tamanho do tile no PNG, `turnBias` e múltiplos andarilhos
3. Testes além do RNG e das métricas
4. O terceiro algoritmo (BSP) — **mas só em último caso**, pois é o mais impressionante visualmente

**Não corte:** seed reproduzível, animação passo a passo e o README (é o que transforma o código em portfólio).

---

## Armadilhas comuns

| Problema | Causa provável | Solução |
|---|---|---|
| Mapa diferente com a mesma seed | `Math.random()` escondido no código | Buscar `Math.random` em `src/core` |
| Animação dobra de velocidade | StrictMode montando duas vezes sem cleanup | Cancelar o `requestAnimationFrame` no retorno do `useEffect` |
| Canvas borrado | Suavização de imagem ou escala CSS | `imageSmoothingEnabled = false`; dimensionar via atributos `width/height`, não só CSS |
| Cave estranha / "queijo suíço" | Atualizar CA no lugar | Usar dois buffers |
| Estouro de pilha no flood fill | Recursão em mapa grande | BFS iterativo com fila |
| BSP sem salas em algumas seeds | `minLeafSize` pequeno demais para o padding | Validar o parâmetro e usar fallback de tamanho mínimo |
| React lento | `setState` com o grid inteiro a cada frame | Grid em `useRef` + contador de versão |

---

## Ordem sugerida de commits

```
chore: setup vite react ts vitest
feat(core): tipos, grid e rng com seed
test(core): rng e grid
feat(render): canvas renderer e layout base
feat: drunkards walk com animacao e controles
feat: cellular automata
feat: bsp
feat(core): metricas e flood fill
feat: exportacao png e json
style: polimento de ui e responsividade
docs: readme com gifs e explicacao dos algoritmos
```
