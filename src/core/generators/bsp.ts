import { Tile } from "../types";
import type { GenStep, Grid, MapGenerator, Point, Rng } from "../types";

export type BspParams = {
  minLeafSize: number;
  maxDepth: number;
  roomPadding: number;
  corridorWidth: number;
};

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Nó da árvore de cortes. Com filhos, é um nó interno; sem filhos, uma folha,
// e só as folhas recebem sala.
interface BspNode {
  rect: Rect;
  left?: BspNode;
  right?: BspNode;
  room?: Rect;
}

interface Config {
  minLeafSize: number;
  maxDepth: number;
  roomPadding: number;
  corridorWidth: number;
}

// O que as três fases compartilham durante uma geração.
interface Progress {
  cuts: Point[];
  leafCount: number;
  corridorCount: number;
}

// Menor sala aceita, em tiles por lado.
const MIN_ROOM_SIZE = 3;

// Um retângulo só é considerado "comprido" a partir desta proporção.
const SPLIT_RATIO = 1.25;

function toInt(value: number, min: number, max = Infinity): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

// Valores vindos de fora podem estar fora da faixa: aqui viram números com
// os quais o algoritmo sempre termina e nunca toca na borda do grid.
function sanitize(grid: Grid, params: BspParams): Config {
  const longestSide = Math.max(grid.width, grid.height);
  const roomPadding = toInt(params.roomPadding, 1, longestSide);
  return {
    // Uma folha precisa caber a menor sala mais o espaçamento dos dois lados.
    minLeafSize: toInt(params.minLeafSize, 2 * roomPadding + MIN_ROOM_SIZE),
    maxDepth: toInt(params.maxDepth, 0),
    roomPadding,
    corridorWidth: toInt(params.corridorWidth, 1, longestSide),
  };
}

function center(rect: Rect): Point {
  return {
    x: rect.x + Math.floor(rect.w / 2),
    y: rect.y + Math.floor(rect.h / 2),
  };
}

// Fase 1: corta o retângulo do nó em dois e repete em cada metade.
function* split(
  node: BspNode,
  depth: number,
  config: Config,
  rng: Rng,
  progress: Progress,
): Generator<GenStep, void, void> {
  if (depth >= config.maxDepth) return;

  const { x, y, w, h } = node.rect;
  // Corte vertical divide a largura; horizontal, a altura. Retângulos
  // compridos são cortados no lado maior, para as folhas não virarem tiras.
  let vertical: boolean;
  if (w > h * SPLIT_RATIO) vertical = true;
  else if (h > w * SPLIT_RATIO) vertical = false;
  else vertical = rng.chance(0.5);

  const size = vertical ? w : h;
  const limit = size - config.minLeafSize;
  if (limit < config.minLeafSize) return;

  const cut = rng.int(config.minLeafSize, limit + 1);
  if (vertical) {
    node.left = { rect: { x, y, w: cut, h } };
    node.right = { rect: { x: x + cut, y, w: w - cut, h } };
    for (let i = 0; i < h; i++) progress.cuts.push({ x: x + cut, y: y + i });
  } else {
    node.left = { rect: { x, y, w, h: cut } };
    node.right = { rect: { x, y: y + cut, w, h: h - cut } };
    for (let i = 0; i < w; i++) progress.cuts.push({ x: x + i, y: y + cut });
  }

  progress.leafCount++;
  yield {
    description: `Dividindo: ${progress.leafCount} regiões`,
    highlight: progress.cuts.slice(),
  };

  yield* split(node.left, depth + 1, config, rng, progress);
  yield* split(node.right, depth + 1, config, rng, progress);
}

function collectLeaves(node: BspNode, leaves: BspNode[]): void {
  if (node.left && node.right) {
    collectLeaves(node.left, leaves);
    collectLeaves(node.right, leaves);
  } else {
    leaves.push(node);
  }
}

// Fase 2: sorteia uma sala dentro da folha, longe das bordas dela.
function createRoom(rect: Rect, padding: number, rng: Rng): Rect | null {
  const maxW = rect.w - 2 * padding;
  const maxH = rect.h - 2 * padding;
  if (maxW < MIN_ROOM_SIZE || maxH < MIN_ROOM_SIZE) return null;

  // Pelo menos metade do espaço livre, para não sobrar sala miúda em folha
  // grande.
  const w = rng.int(Math.max(MIN_ROOM_SIZE, Math.ceil(maxW / 2)), maxW + 1);
  const h = rng.int(Math.max(MIN_ROOM_SIZE, Math.ceil(maxH / 2)), maxH + 1);
  return {
    x: rect.x + padding + rng.int(0, maxW - w + 1),
    y: rect.y + padding + rng.int(0, maxH - h + 1),
    w,
    h,
  };
}

function paintRoom(grid: Grid, room: Rect): void {
  for (let y = room.y; y < room.y + room.h; y++) {
    grid.tiles.fill(
      Tile.ROOM,
      y * grid.width + room.x,
      y * grid.width + room.x + room.w,
    );
  }
}

// Nós internos não têm sala própria: desce pela árvore até achar uma folha
// que tenha. O sorteio do lado varia qual sala cada corredor alcança.
function getRoom(node: BspNode, rng: Rng): Rect | null {
  if (node.room) return node.room;
  if (!node.left || !node.right) return null;

  const first = rng.chance(0.5) ? node.left : node.right;
  const second = first === node.left ? node.right : node.left;
  return getRoom(first, rng) ?? getRoom(second, rng);
}

// Pinta um quadrado de `width` tiles de lado em volta do ponto, só onde ainda
// é parede: salas e corredores anteriores ficam como estão.
function stamp(grid: Grid, cx: number, cy: number, width: number): void {
  const start = -Math.floor((width - 1) / 2);
  for (let oy = 0; oy < width; oy++) {
    for (let ox = 0; ox < width; ox++) {
      const x = cx + start + ox;
      const y = cy + start + oy;
      if (x < 1 || y < 1 || x > grid.width - 2 || y > grid.height - 2) continue;
      const index = y * grid.width + x;
      if (grid.tiles[index] === Tile.WALL) grid.tiles[index] = Tile.CORRIDOR;
    }
  }
}

// Os dois pontos precisam estar na mesma linha ou na mesma coluna.
function carveLine(grid: Grid, from: Point, to: Point, width: number): void {
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  let x = from.x;
  let y = from.y;
  stamp(grid, x, y, width);
  while (x !== to.x || y !== to.y) {
    x += dx;
    y += dy;
    stamp(grid, x, y, width);
  }
}

// Corredor em L: dois trechos retos que se encontram numa quina.
function carveCorridor(
  grid: Grid,
  from: Point,
  to: Point,
  width: number,
  horizontalFirst: boolean,
): void {
  const corner = horizontalFirst
    ? { x: to.x, y: from.y }
    : { x: from.x, y: to.y };
  carveLine(grid, from, corner, width);
  carveLine(grid, corner, to, width);
}

// Fase 3: liga as duas metades de cada nó interno, de baixo para cima. Como
// cada metade já está ligada por dentro, um corredor entre elas basta.
function* connect(
  node: BspNode,
  grid: Grid,
  config: Config,
  rng: Rng,
  progress: Progress,
): Generator<GenStep, void, void> {
  if (!node.left || !node.right) return;

  yield* connect(node.left, grid, config, rng, progress);
  yield* connect(node.right, grid, config, rng, progress);

  const roomA = getRoom(node.left, rng);
  const roomB = getRoom(node.right, rng);
  if (!roomA || !roomB) return;

  const from = center(roomA);
  const to = center(roomB);
  carveCorridor(grid, from, to, config.corridorWidth, rng.chance(0.5));

  progress.corridorCount++;
  yield {
    description: `Corredor ${progress.corridorCount} de ${progress.leafCount - 1}`,
    highlight: [from, to],
  };
}

function* run(
  grid: Grid,
  params: BspParams,
  rng: Rng,
): Generator<GenStep, void, void> {
  grid.tiles.fill(Tile.WALL);

  const config = sanitize(grid, params);
  const progress: Progress = { cuts: [], leafCount: 1, corridorCount: 0 };
  const root: BspNode = {
    rect: { x: 0, y: 0, w: grid.width, h: grid.height },
  };

  yield* split(root, 0, config, rng, progress);

  const leaves: BspNode[] = [];
  collectLeaves(root, leaves);

  let roomCount = 0;
  for (const leaf of leaves) {
    const room = createRoom(leaf.rect, config.roomPadding, rng);
    if (!room) continue;
    leaf.room = room;
    paintRoom(grid, room);
    roomCount++;
    yield {
      description: `Sala ${roomCount} de ${leaves.length}`,
      highlight: progress.cuts.slice(),
    };
  }

  yield* connect(root, grid, config, rng, progress);

  const adjusted =
    config.minLeafSize > params.minLeafSize
      ? ` (folha mínima ajustada para ${config.minLeafSize})`
      : "";
  yield {
    description: `Concluído: ${roomCount} salas e ${progress.corridorCount} corredores${adjusted}`,
    roomCount,
    done: true,
  };
}

export const bsp: MapGenerator<BspParams> = {
  id: "bsp",
  name: "BSP",
  description:
    "Corta o mapa em retângulos, põe uma sala em cada um e liga as salas com corredores.",
  defaultParams: {
    minLeafSize: 10,
    maxDepth: 5,
    roomPadding: 1,
    corridorWidth: 1,
  },
  paramSchema: [
    {
      key: "minLeafSize",
      label: "Tamanho mínimo da folha",
      type: "int",
      min: 6,
      max: 20,
      step: 1,
    },
    {
      key: "maxDepth",
      label: "Profundidade máxima",
      type: "int",
      min: 2,
      max: 8,
      step: 1,
    },
    {
      key: "roomPadding",
      label: "Espaçamento das salas",
      type: "int",
      min: 1,
      max: 3,
      step: 1,
    },
    {
      key: "corridorWidth",
      label: "Largura dos corredores",
      type: "int",
      min: 1,
      max: 3,
      step: 1,
    },
  ],
  defaultSpeed: 0.25,
  run,
};
