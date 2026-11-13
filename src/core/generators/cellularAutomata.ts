import { Tile } from "../types";
import type { GenStep, Grid, MapGenerator, Rng } from "../types";

export type CellularAutomataParams = {
  initialWallChance: number;
  iterations: number;
  birthLimit: number;
  survivalLimit: number;
};

// Conta as paredes entre os 8 vizinhos (vizinhança de Moore). Só é chamada
// para tiles internos, então os 8 vizinhos sempre existem dentro do grid; a
// regra "fora do grid conta como parede" é atendida pela borda, que é parede.
function countWallNeighbors(
  tiles: Uint8Array,
  width: number,
  x: number,
  y: number,
): number {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (tiles[(y + dy) * width + (x + dx)] === Tile.WALL) count++;
    }
  }
  return count;
}

function floorPercent(grid: Grid): number {
  let floor = 0;
  for (const tile of grid.tiles) {
    if (tile !== Tile.WALL) floor++;
  }
  return Math.round((floor / grid.tiles.length) * 100);
}

function* run(
  grid: Grid,
  params: CellularAutomataParams,
  rng: Rng,
): Generator<GenStep, void, void> {
  const { width, height, tiles } = grid;
  const iterations = Number.isFinite(params.iterations)
    ? Math.max(0, Math.floor(params.iterations))
    : 0;

  // A borda nunca é sorteada: fica parede do começo ao fim.
  tiles.fill(Tile.WALL);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      tiles[y * width + x] = rng.chance(params.initialWallChance)
        ? Tile.WALL
        : Tile.FLOOR;
    }
  }
  yield { description: `Ruído inicial: ${floorPercent(grid)}% de chão` };

  // Segundo buffer: a rodada lê de `tiles` e escreve em `next`. Escrevendo
  // direto em `tiles`, um tile já atualizado mudaria a contagem dos vizinhos
  // que ainda faltam, e o resultado dependeria da ordem da varredura.
  const next = new Uint8Array(tiles.length);

  for (let i = 1; i <= iterations; i++) {
    next.fill(Tile.WALL);
    let changed = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        const walls = countWallNeighbors(tiles, width, x, y);
        const limit =
          tiles[index] === Tile.WALL ? params.survivalLimit : params.birthLimit;
        const value = walls >= limit ? Tile.WALL : Tile.FLOOR;
        next[index] = value;
        if (value !== tiles[index]) changed++;
      }
    }

    tiles.set(next);
    yield {
      description: `Iteração ${i} de ${iterations}: ${changed} tiles mudaram`,
    };
  }

  yield {
    description: `Concluído: ${iterations} iterações, ${floorPercent(grid)}% de chão`,
    done: true,
  };
}

export const cellularAutomata: MapGenerator<CellularAutomataParams> = {
  id: "cellular-automata",
  name: "Cellular Automata",
  description:
    "Começa com ruído e repete uma regra de vizinhança até o caos virar caverna.",
  defaultParams: {
    initialWallChance: 0.45,
    iterations: 5,
    birthLimit: 5,
    survivalLimit: 4,
  },
  paramSchema: [
    {
      key: "initialWallChance",
      label: "Chance inicial de parede",
      type: "float",
      min: 0.3,
      max: 0.6,
      step: 0.01,
    },
    {
      key: "iterations",
      label: "Iterações",
      type: "int",
      min: 1,
      max: 12,
      step: 1,
    },
    {
      key: "birthLimit",
      label: "Vizinhas para nascer parede",
      type: "int",
      min: 3,
      max: 7,
      step: 1,
    },
    {
      key: "survivalLimit",
      label: "Vizinhas para manter parede",
      type: "int",
      min: 2,
      max: 6,
      step: 1,
    },
  ],
  // Só há um passo por iteração: devagar para dar tempo de ver cada rodada.
  defaultSpeed: 0.05,
  run,
};
