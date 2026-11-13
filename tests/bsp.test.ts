import { describe, expect, it } from "vitest";
import { getGenerator } from "../src/core/generators";
import { bsp } from "../src/core/generators/bsp";
import type { BspParams } from "../src/core/generators/bsp";
import { countTiles, createGrid, getTile } from "../src/core/grid";
import { createRng } from "../src/core/rng";
import { Tile } from "../src/core/types";
import type { GenStep, Grid } from "../src/core/types";

interface RunResult {
  grid: Grid;
  steps: GenStep[];
  roomCount: number;
}

function runBsp(
  seed: string | number,
  overrides: Partial<BspParams> = {},
  width = 80,
  height = 50,
): RunResult {
  const grid = createGrid(width, height);
  const params = { ...bsp.defaultParams, ...overrides };
  const steps = [...bsp.run(grid, params, createRng(seed))];
  return { grid, steps, roomCount: steps.at(-1)?.roomCount ?? -1 };
}

interface RoomRegion {
  size: number;
  width: number;
  height: number;
}

// Agrupa os tiles de sala que se tocam (em 4 direções) e mede cada grupo.
function roomRegions(grid: Grid): RoomRegion[] {
  const visited = new Uint8Array(grid.tiles.length);
  const regions: RoomRegion[] = [];

  for (let start = 0; start < grid.tiles.length; start++) {
    if (grid.tiles[start] !== Tile.ROOM || visited[start]) continue;

    const queue = [start];
    visited[start] = 1;
    let size = 0;
    let minX = grid.width;
    let maxX = -1;
    let minY = grid.height;
    let maxY = -1;

    for (let head = 0; head < queue.length; head++) {
      const index = queue[head] as number;
      const x = index % grid.width;
      const y = Math.floor(index / grid.width);
      size++;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      const neighbors = [
        x > 0 ? index - 1 : -1,
        x < grid.width - 1 ? index + 1 : -1,
        index - grid.width,
        index + grid.width,
      ];
      for (const next of neighbors) {
        if (next < 0 || next >= grid.tiles.length) continue;
        if (grid.tiles[next] !== Tile.ROOM || visited[next]) continue;
        visited[next] = 1;
        queue.push(next);
      }
    }

    regions.push({ size, width: maxX - minX + 1, height: maxY - minY + 1 });
  }
  return regions;
}

function expectWallBorders(grid: Grid): void {
  for (let x = 0; x < grid.width; x++) {
    expect(getTile(grid, x, 0)).toBe(Tile.WALL);
    expect(getTile(grid, x, grid.height - 1)).toBe(Tile.WALL);
  }
  for (let y = 0; y < grid.height; y++) {
    expect(getTile(grid, 0, y)).toBe(Tile.WALL);
    expect(getTile(grid, grid.width - 1, y)).toBe(Tile.WALL);
  }
}

const SEEDS = Array.from({ length: 25 }, (_, index) => `seed-${index}`);

describe("bsp", () => {
  it("está no registro", () => {
    expect(getGenerator("bsp")).toBe(bsp);
  });

  it("mesma seed + mesmos parâmetros produzem grids idênticos", () => {
    const params = { minLeafSize: 8, corridorWidth: 2 };
    const first = runBsp("gato-preto", params);
    const second = runBsp("gato-preto", params);
    expect(first.grid.tiles).toEqual(second.grid.tiles);
    expect(first.steps).toEqual(second.steps);
  });

  it("seeds diferentes produzem grids diferentes", () => {
    const first = runBsp("gato-preto");
    const second = runBsp("gato-branco");
    expect(first.grid.tiles).not.toEqual(second.grid.tiles);
  });

  it("gera pelo menos uma sala em muitas seeds", () => {
    for (const seed of SEEDS) {
      const { grid, roomCount } = runBsp(seed);
      expect(roomCount).toBeGreaterThanOrEqual(1);
      expect(countTiles(grid, (tile) => tile === Tile.ROOM)).toBeGreaterThan(0);
    }
  });

  it("gera salas mesmo com a folha mínima menor do que o espaçamento pede", () => {
    for (const seed of SEEDS) {
      const { roomCount } = runBsp(seed, { minLeafSize: 6, roomPadding: 3 });
      expect(roomCount).toBeGreaterThanOrEqual(1);
    }
  });

  it("a contagem de salas bate com as salas desenhadas no grid", () => {
    const variations: Partial<BspParams>[] = [
      {},
      { minLeafSize: 6, maxDepth: 8 },
      { roomPadding: 3, corridorWidth: 3 },
    ];
    for (const params of variations) {
      for (const seed of SEEDS) {
        const { grid, roomCount } = runBsp(seed, params);
        expect(roomRegions(grid)).toHaveLength(roomCount);
      }
    }
  });

  it("toda sala é um retângulo inteiro de pelo menos 3 x 3", () => {
    // Se um corredor pintasse por cima de uma sala, ou duas salas se
    // encostassem, o grupo deixaria de preencher o próprio retângulo.
    for (const seed of SEEDS) {
      const { grid } = runBsp(seed, { corridorWidth: 3 });
      for (const region of roomRegions(grid)) {
        expect(region.size).toBe(region.width * region.height);
        expect(region.width).toBeGreaterThanOrEqual(3);
        expect(region.height).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("liga as salas com um corredor a menos do que o número de salas", () => {
    for (const seed of SEEDS) {
      const { steps, roomCount } = runBsp(seed);
      const corridors = steps.filter((step) =>
        step.description?.startsWith("Corredor"),
      );
      expect(corridors).toHaveLength(roomCount - 1);
    }
  });

  it("corredor mais largo escava mais tiles no mesmo mapa", () => {
    const corridorTiles = (width: number) =>
      countTiles(
        runBsp("largura", { corridorWidth: width }).grid,
        (tile) => tile === Tile.CORRIDOR,
      );
    expect(corridorTiles(1)).toBeGreaterThan(0);
    expect(corridorTiles(2)).toBeGreaterThan(corridorTiles(1));
    expect(corridorTiles(3)).toBeGreaterThan(corridorTiles(2));
  });

  it("as bordas continuam parede", () => {
    for (const seed of SEEDS) {
      expectWallBorders(runBsp(seed, { corridorWidth: 3 }).grid);
    }
  });

  it("só o último passo avisa que terminou e leva a contagem de salas", () => {
    const { steps } = runBsp("passos");
    expect(steps.at(-1)?.done).toBe(true);
    expect(steps.at(-1)?.roomCount).toBeGreaterThanOrEqual(1);
    for (const step of steps.slice(0, -1)) {
      expect(step.done).toBeUndefined();
      expect(step.roomCount).toBeUndefined();
    }
  });

  it("passa pelas três fases, nesta ordem", () => {
    const { steps } = runBsp("fases");
    const phases = steps
      .slice(0, -1)
      .map((step) => step.description?.split(/[ :]/)[0]);
    const order = phases.filter((phase, i) => phase !== phases[i - 1]);
    expect(order).toEqual(["Dividindo", "Sala", "Corredor"]);
  });

  it("os destaques ficam sempre dentro do grid", () => {
    const { grid, steps } = runBsp("destaque");
    for (const step of steps) {
      for (const point of step.highlight ?? []) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThan(grid.width);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThan(grid.height);
      }
    }
  });

  it("sem profundidade, faz uma sala só e nenhum corredor", () => {
    const { grid, roomCount } = runBsp("raso", { maxDepth: 0 });
    expect(roomCount).toBe(1);
    expect(countTiles(grid, (tile) => tile === Tile.CORRIDOR)).toBe(0);
  });

  it("limpa o que havia no grid antes de começar", () => {
    const grid = createGrid(30, 30, Tile.FLOOR);
    for (const step of bsp.run(grid, bsp.defaultParams, createRng("limpa"))) {
      void step;
    }
    expect(countTiles(grid, (tile) => tile === Tile.FLOOR)).toBe(0);
  });

  it("parâmetros inválidos não quebram nem prendem o gerador", () => {
    const invalid: Partial<BspParams>[] = [
      { minLeafSize: 0 },
      { minLeafSize: -5 },
      { minLeafSize: 1, roomPadding: 3 },
      { minLeafSize: Number.NaN },
      { minLeafSize: Infinity },
      { minLeafSize: 7.9 },
      { maxDepth: 0 },
      { maxDepth: -1 },
      { maxDepth: 1000 },
      { maxDepth: Infinity },
      { maxDepth: Number.NaN },
      { roomPadding: 0 },
      { roomPadding: -2 },
      { roomPadding: 50 },
      { roomPadding: Number.NaN },
      { corridorWidth: 0 },
      { corridorWidth: -1 },
      { corridorWidth: 1e9 },
      { corridorWidth: Number.NaN },
      { minLeafSize: 0, maxDepth: 1000, roomPadding: 0, corridorWidth: 0 },
    ];
    for (const params of invalid) {
      for (const seed of ["a", "b", "c"]) {
        const { grid, steps, roomCount } = runBsp(seed, params);
        expect(steps.at(-1)?.done).toBe(true);
        expect(steps.length).toBeLessThan(grid.tiles.length);
        expect(roomCount).toBeGreaterThanOrEqual(0);
        expectWallBorders(grid);
      }
    }
  });

  it("termina em grids pequenos, com ou sem espaço para sala", () => {
    const sizes: [number, number, number][] = [
      [1, 1, 0],
      [2, 2, 0],
      [4, 4, 0],
      [4, 20, 0],
      [5, 5, 1],
    ];
    for (const [width, height, expectedRooms] of sizes) {
      const { grid, steps, roomCount } = runBsp("pequeno", {}, width, height);
      expect(steps.at(-1)?.done).toBe(true);
      expect(roomCount).toBe(expectedRooms);
      expectWallBorders(grid);
    }
    const { grid } = runBsp("pequeno", {}, 5, 5);
    expect(countTiles(grid, (tile) => tile === Tile.ROOM)).toBe(9);
  });
});
