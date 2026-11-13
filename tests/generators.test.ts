import { describe, expect, it } from "vitest";
import { generators, getGenerator } from "../src/core/generators";
import { drunkardsWalk } from "../src/core/generators/drunkardsWalk";
import type { DrunkardsWalkParams } from "../src/core/generators/drunkardsWalk";
import { countTiles, createGrid, getTile } from "../src/core/grid";
import { createRng } from "../src/core/rng";
import { Tile } from "../src/core/types";
import type { GenStep, Grid } from "../src/core/types";

interface RunResult {
  grid: Grid;
  steps: GenStep[];
}

function runDrunkard(
  seed: string | number,
  overrides: Partial<DrunkardsWalkParams> = {},
  width = 80,
  height = 50,
): RunResult {
  const grid = createGrid(width, height);
  const params = { ...drunkardsWalk.defaultParams, ...overrides };
  const steps = [...drunkardsWalk.run(grid, params, createRng(seed))];
  return { grid, steps };
}

function floorPercent(grid: Grid): number {
  const floor = countTiles(grid, (tile) => tile !== Tile.WALL);
  return (floor / grid.tiles.length) * 100;
}

describe("registro de geradores", () => {
  it("encontra o gerador pelo id", () => {
    expect(getGenerator("drunkards-walk")).toBe(drunkardsWalk);
    expect(getGenerator("nao-existe")).toBeUndefined();
  });

  it("não tem ids repetidos", () => {
    const ids = generators.map((generator) => generator.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todo gerador sugere uma velocidade de animação positiva", () => {
    for (const generator of generators) {
      expect(generator.defaultSpeed).toBeGreaterThan(0);
    }
  });

  it("todo parâmetro do schema tem valor padrão dentro da faixa", () => {
    for (const generator of generators) {
      for (const def of generator.paramSchema) {
        const value = generator.defaultParams[def.key];
        expect(value).toBeGreaterThanOrEqual(def.min);
        expect(value).toBeLessThanOrEqual(def.max);
      }
      expect(Object.keys(generator.defaultParams).sort()).toEqual(
        generator.paramSchema.map((def) => def.key).sort(),
      );
    }
  });
});

describe("drunkard's walk", () => {
  it("mesma seed + mesmos parâmetros produzem grids idênticos", () => {
    const params = { walkers: 3, turnBias: 0.4 };
    const first = runDrunkard("gato-preto", params);
    const second = runDrunkard("gato-preto", params);
    expect(first.grid.tiles).toEqual(second.grid.tiles);
    expect(first.steps).toEqual(second.steps);
  });

  it("seeds diferentes produzem grids diferentes", () => {
    const first = runDrunkard("gato-preto");
    const second = runDrunkard("gato-branco");
    expect(first.grid.tiles).not.toEqual(second.grid.tiles);
  });

  it("o chão final fica entre o alvo e o alvo + 1%", () => {
    const cases: Partial<DrunkardsWalkParams>[] = [
      { targetFloorPercent: 10 },
      { targetFloorPercent: 30 },
      { targetFloorPercent: 40, walkers: 4 },
      { targetFloorPercent: 55, walkers: 8, turnBias: 0.6 },
    ];
    for (const params of cases) {
      for (const seed of ["a", "b", "c"]) {
        const percent = floorPercent(runDrunkard(seed, params).grid);
        const target = params.targetFloorPercent ?? 40;
        expect(percent).toBeGreaterThanOrEqual(target);
        expect(percent).toBeLessThanOrEqual(target + 1);
      }
    }
  });

  it("arredonda o alvo para cima quando a conta não é exata", () => {
    // 33% de 21 x 13 = 90,09 tiles: precisa de 91 para não ficar abaixo.
    const { grid } = runDrunkard("impar", { targetFloorPercent: 33 }, 21, 13);
    expect(countTiles(grid, (tile) => tile === Tile.FLOOR)).toBe(91);
  });

  it("as bordas continuam parede", () => {
    const { grid } = runDrunkard("bordas", {
      targetFloorPercent: 70,
      walkers: 8,
    });
    for (let x = 0; x < grid.width; x++) {
      expect(getTile(grid, x, 0)).toBe(Tile.WALL);
      expect(getTile(grid, x, grid.height - 1)).toBe(Tile.WALL);
    }
    for (let y = 0; y < grid.height; y++) {
      expect(getTile(grid, 0, y)).toBe(Tile.WALL);
      expect(getTile(grid, grid.width - 1, y)).toBe(Tile.WALL);
    }
  });

  it("só escreve parede e chão", () => {
    const { grid } = runDrunkard("tiles");
    expect(
      countTiles(grid, (tile) => tile === Tile.ROOM || tile === Tile.CORRIDOR),
    ).toBe(0);
  });

  it("limpa o que havia no grid antes de começar", () => {
    const grid = createGrid(20, 20, Tile.ROOM);
    const params = drunkardsWalk.defaultParams;
    for (const step of drunkardsWalk.run(grid, params, createRng("limpa"))) {
      void step;
    }
    expect(countTiles(grid, (tile) => tile === Tile.ROOM)).toBe(0);
  });

  it("o último passo avisa que terminou e os anteriores não", () => {
    const { steps } = runDrunkard("passos");
    expect(steps.at(-1)?.done).toBe(true);
    expect(steps.slice(0, -1).some((step) => step.done)).toBe(false);
  });

  it("destaca a posição de cada andarilho, sempre dentro da margem", () => {
    const { grid, steps } = runDrunkard("destaque", { walkers: 5 });
    const moving = steps.slice(0, -1);
    expect(moving.length).toBeGreaterThan(0);
    for (const step of moving) {
      expect(step.highlight).toHaveLength(5);
      for (const point of step.highlight ?? []) {
        expect(point.x).toBeGreaterThanOrEqual(1);
        expect(point.x).toBeLessThanOrEqual(grid.width - 2);
        expect(point.y).toBeGreaterThanOrEqual(1);
        expect(point.y).toBeLessThanOrEqual(grid.height - 2);
      }
    }
  });

  it("stepsPerYield menor gera mais passos para o mesmo mapa", () => {
    const fine = runDrunkard("ritmo", { stepsPerYield: 1 });
    const coarse = runDrunkard("ritmo", { stepsPerYield: 50 });
    expect(fine.grid.tiles).toEqual(coarse.grid.tiles);
    expect(fine.steps.length).toBeGreaterThan(coarse.steps.length);
  });

  it("termina mesmo com parâmetros extremos", () => {
    const extremes: Partial<DrunkardsWalkParams>[] = [
      { targetFloorPercent: 100 },
      { targetFloorPercent: 1000, walkers: 8, turnBias: 1 },
      { targetFloorPercent: 0 },
      { targetFloorPercent: -50 },
      { walkers: 0 },
      { walkers: -3, stepsPerYield: 0 },
      { stepsPerYield: -10, turnBias: 5 },
      { turnBias: 1 },
    ];
    const maxSteps = 80 * 50 * 20;
    for (const params of extremes) {
      const { steps } = runDrunkard("extremo", params);
      expect(steps.at(-1)?.done).toBe(true);
      expect(steps.length).toBeLessThanOrEqual(maxSteps + 1);
    }
  });

  it("termina em grids pequenos demais para ter interior", () => {
    const sizes: [number, number][] = [
      [1, 1],
      [2, 2],
      [3, 3],
      [3, 10],
      [10, 3],
      [5, 5],
    ];
    for (const [width, height] of sizes) {
      const { grid, steps } = runDrunkard(
        "pequeno",
        { targetFloorPercent: 70 },
        width,
        height,
      );
      expect(steps.at(-1)?.done).toBe(true);
      const interior = Math.max(0, width - 2) * Math.max(0, height - 2);
      expect(
        countTiles(grid, (tile) => tile !== Tile.WALL),
      ).toBeLessThanOrEqual(interior);
    }
  });
});
