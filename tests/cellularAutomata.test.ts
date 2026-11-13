import { describe, expect, it } from "vitest";
import { getGenerator } from "../src/core/generators";
import { cellularAutomata } from "../src/core/generators/cellularAutomata";
import type { CellularAutomataParams } from "../src/core/generators/cellularAutomata";
import { countTiles, createGrid, getTile } from "../src/core/grid";
import { createRng } from "../src/core/rng";
import { Tile } from "../src/core/types";
import type { GenStep, Grid } from "../src/core/types";

interface RunResult {
  grid: Grid;
  steps: GenStep[];
}

function runCa(
  seed: string | number,
  overrides: Partial<CellularAutomataParams> = {},
  width = 80,
  height = 50,
): RunResult {
  const grid = createGrid(width, height);
  const params = { ...cellularAutomata.defaultParams, ...overrides };
  const steps = [...cellularAutomata.run(grid, params, createRng(seed))];
  return { grid, steps };
}

// Proporção de paredes só entre os tiles internos, os únicos que são sorteados.
function interiorWallRatio(grid: Grid): number {
  let walls = 0;
  for (let y = 1; y < grid.height - 1; y++) {
    for (let x = 1; x < grid.width - 1; x++) {
      if (getTile(grid, x, y) === Tile.WALL) walls++;
    }
  }
  return walls / ((grid.width - 2) * (grid.height - 2));
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

describe("cellular automata", () => {
  it("está no registro", () => {
    expect(getGenerator("cellular-automata")).toBe(cellularAutomata);
  });

  it("mesma seed + mesmos parâmetros produzem grids idênticos", () => {
    const params = { iterations: 7, initialWallChance: 0.5 };
    const first = runCa("gato-preto", params);
    const second = runCa("gato-preto", params);
    expect(first.grid.tiles).toEqual(second.grid.tiles);
    expect(first.steps).toEqual(second.steps);
  });

  it("seeds diferentes produzem grids diferentes", () => {
    const first = runCa("gato-preto");
    const second = runCa("gato-branco");
    expect(first.grid.tiles).not.toEqual(second.grid.tiles);
  });

  it("sem iterações, a proporção de paredes fica perto da chance inicial", () => {
    for (const chance of [0.3, 0.45, 0.6]) {
      for (const seed of ["a", "b", "c", "d"]) {
        const { grid } = runCa(seed, {
          iterations: 0,
          initialWallChance: chance,
        });
        const ratio = interiorWallRatio(grid);
        expect(ratio).toBeGreaterThan(chance - 0.03);
        expect(ratio).toBeLessThan(chance + 0.03);
      }
    }
  });

  it("nunca altera as bordas, em nenhum passo", () => {
    const grid = createGrid(40, 30, Tile.FLOOR);
    const params = {
      ...cellularAutomata.defaultParams,
      initialWallChance: 0.3,
      iterations: 12,
      birthLimit: 7,
      survivalLimit: 6,
    };
    let count = 0;
    for (const step of cellularAutomata.run(grid, params, createRng("borda"))) {
      void step;
      expectWallBorders(grid);
      count++;
    }
    expect(count).toBe(14);
  });

  it("dá um passo para o ruído, um por iteração e um de conclusão", () => {
    const { steps } = runCa("passos", { iterations: 4 });
    expect(steps).toHaveLength(6);
    expect(steps.at(-1)?.done).toBe(true);
    expect(steps.slice(0, -1).some((step) => step.done)).toBe(false);
  });

  it("só escreve parede e chão", () => {
    const { grid } = runCa("tiles");
    expect(
      countTiles(grid, (tile) => tile === Tile.ROOM || tile === Tile.CORRIDOR),
    ).toBe(0);
  });

  it("aplica a regra lendo o estado antigo, não o que acabou de escrever", () => {
    // Com chance 0 o interior começa todo chão e só a borda é parede. Um
    // tile de canto do interior vê 5 paredes e vira parede; os outros, no
    // máximo 3, e continuam chão. Atualizando no lugar, o canto já
    // convertido empurraria o vizinho seguinte para 4 e o erro se espalharia.
    const { grid } = runCa(
      "buffers",
      { initialWallChance: 0, iterations: 1, birthLimit: 4, survivalLimit: 4 },
      6,
      6,
    );
    const rows = [];
    for (let y = 0; y < 6; y++) {
      let row = "";
      for (let x = 0; x < 6; x++) {
        row += getTile(grid, x, y) === Tile.WALL ? "#" : ".";
      }
      rows.push(row);
    }
    expect(rows).toEqual([
      "######",
      "##..##",
      "#....#",
      "#....#",
      "##..##",
      "######",
    ]);
  });

  it("termina com parâmetros fora da faixa", () => {
    const extremes: Partial<CellularAutomataParams>[] = [
      { iterations: -5 },
      { iterations: 2.7 },
      { iterations: Number.NaN },
      { initialWallChance: 5 },
      { initialWallChance: -1 },
      { birthLimit: 0, survivalLimit: 0 },
      { birthLimit: 99, survivalLimit: 99 },
    ];
    for (const params of extremes) {
      const { grid, steps } = runCa("extremo", params);
      expect(steps.at(-1)?.done).toBe(true);
      expect(steps.length).toBeLessThanOrEqual(14);
      expectWallBorders(grid);
    }
  });

  it("termina em grids pequenos demais para ter interior", () => {
    const sizes: [number, number][] = [
      [1, 1],
      [2, 2],
      [3, 3],
      [2, 9],
    ];
    for (const [width, height] of sizes) {
      const { grid, steps } = runCa("pequeno", {}, width, height);
      expect(steps.at(-1)?.done).toBe(true);
      if (width < 3 || height < 3) {
        expect(countTiles(grid, (tile) => tile !== Tile.WALL)).toBe(0);
      }
    }
  });
});
