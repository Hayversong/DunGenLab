import { describe, expect, it } from "vitest";
import { bsp } from "../src/core/generators/bsp";
import { createGrid, setTile } from "../src/core/grid";
import { createRng } from "../src/core/rng";
import { computeMetrics, countRooms, regionSizes } from "../src/core/metrics";
import { Tile } from "../src/core/types";
import type { Grid, TileValue } from "../src/core/types";

const SYMBOLS: Record<string, TileValue> = {
  "#": Tile.WALL,
  ".": Tile.FLOOR,
  R: Tile.ROOM,
  c: Tile.CORRIDOR,
};

// Monta um grid a partir de um desenho: uma string por linha.
function drawGrid(rows: string[]): Grid {
  const grid = createGrid(rows[0]?.length ?? 0, rows.length);
  rows.forEach((row, y) => {
    [...row].forEach((symbol, x) => {
      setTile(grid, x, y, SYMBOLS[symbol] ?? Tile.WALL);
    });
  });
  return grid;
}

describe("computeMetrics", () => {
  it("grid todo parede: 0% de chão e nenhuma região", () => {
    expect(computeMetrics(createGrid(5, 5))).toEqual({
      floorPercent: 0,
      regionCount: 0,
      largestRegionPercent: 0,
    });
  });

  it("grid todo chão: 100%, uma região, que é a maior", () => {
    expect(computeMetrics(createGrid(5, 5, Tile.FLOOR))).toEqual({
      floorPercent: 100,
      regionCount: 1,
      largestRegionPercent: 100,
    });
  });

  it("duas ilhas desenhadas à mão", () => {
    // prettier-ignore
    const grid = drawGrid([
      "#####",
      "#..##",
      "#.###",
      "###.#",
      "###.#",
    ]);
    // Ilha de cima: 3 tiles. Ilha de baixo: 2 tiles. Chão: 5 de 25.
    expect(regionSizes(grid)).toEqual([3, 2]);
    expect(computeMetrics(grid)).toEqual({
      floorPercent: 20,
      regionCount: 2,
      largestRegionPercent: 60,
    });
  });

  it("diagonal não conecta", () => {
    // prettier-ignore
    const grid = drawGrid([
      ".####",
      "#.###",
      "##.##",
      "###.#",
      "####.",
    ]);
    expect(regionSizes(grid)).toEqual([1, 1, 1, 1, 1]);
    expect(computeMetrics(grid)).toEqual({
      floorPercent: 20,
      regionCount: 5,
      largestRegionPercent: 20,
    });
  });

  it("não liga o fim de uma linha ao começo da seguinte", () => {
    // Na lista de tiles, (3,0) e (0,1) são vizinhos de índice, mas no mapa
    // estão em lados opostos.
    // prettier-ignore
    const grid = drawGrid([
      "###.",
      ".###",
    ]);
    expect(regionSizes(grid)).toEqual([1, 1]);
  });

  it("sala e corredor contam como chão e se ligam entre si", () => {
    // prettier-ignore
    const grid = drawGrid([
      "#######",
      "#RRc..#",
      "#RR####",
      "#######",
    ]);
    expect(regionSizes(grid)).toEqual([7]);
    expect(computeMetrics(grid).floorPercent).toBe(25);
  });

  it("acha regiões de formato torto e ordena pela primeira célula", () => {
    // prettier-ignore
    const grid = drawGrid([
      "..#..",
      "#.#.#",
      "#...#",
      "#####",
      "..#.#",
    ]);
    // Um U de 9 tiles; embaixo, um par e um tile sozinho.
    expect(regionSizes(grid)).toEqual([9, 2, 1]);
    expect(computeMetrics(grid).largestRegionPercent).toBe(75);
  });

  it("grid 200 x 120 todo chão não estoura a pilha", () => {
    const grid = createGrid(200, 120, Tile.FLOOR);
    expect(computeMetrics(grid)).toEqual({
      floorPercent: 100,
      regionCount: 1,
      largestRegionPercent: 100,
    });
  });

  it("grid 200 x 120 com um corredor em zigue-zague", () => {
    // Pior caso para uma busca recursiva: uma região só, comprida e fina.
    const grid = createGrid(200, 120);
    let expected = 0;
    for (let y = 0; y < 120; y += 2) {
      for (let x = 0; x < 200; x++) {
        setTile(grid, x, y, Tile.FLOOR);
        expected++;
      }
      if (y + 1 < 120) {
        setTile(grid, (y / 2) % 2 === 0 ? 199 : 0, y + 1, Tile.FLOOR);
        expected++;
      }
    }
    expect(regionSizes(grid)).toEqual([expected]);
  });

  it("não altera o grid", () => {
    const grid = drawGrid(["#.#", "...", "#R#"]);
    const before = grid.tiles.slice();
    computeMetrics(grid);
    expect(grid.tiles).toEqual(before);
  });
});

describe("countRooms", () => {
  it("grid sem tiles de sala: zero", () => {
    expect(countRooms(createGrid(5, 5))).toBe(0);
    expect(countRooms(createGrid(5, 5, Tile.FLOOR))).toBe(0);
  });

  it("corredor entre duas salas não as transforma em uma só", () => {
    // prettier-ignore
    const grid = drawGrid([
      "#########",
      "#RR###RR#",
      "#RRcccRR#",
      "#########",
    ]);
    expect(countRooms(grid)).toBe(2);
    expect(computeMetrics(grid).regionCount).toBe(1);
  });

  it("salas que só se tocam na diagonal contam separadas", () => {
    // prettier-ignore
    const grid = drawGrid([
      "RR##",
      "RR##",
      "##RR",
    ]);
    expect(countRooms(grid)).toBe(2);
  });

  it("bate com o contador do BSP em vários tamanhos de mapa", () => {
    const sizes: [number, number][] = [
      [20, 20],
      [80, 50],
      [200, 120],
    ];
    for (const [width, height] of sizes) {
      for (let seed = 0; seed < 10; seed++) {
        const grid = createGrid(width, height);
        const steps = [...bsp.run(grid, bsp.defaultParams, createRng(seed))];
        expect(countRooms(grid)).toBe(steps.at(-1)?.roomCount);
      }
    }
  });
});
