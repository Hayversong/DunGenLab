import { describe, expect, it } from "vitest";
import { generators } from "../src/core/generators";
import { bsp } from "../src/core/generators/bsp";
import { cellularAutomata } from "../src/core/generators/cellularAutomata";
import { clampParams } from "../src/core/params";
import type { GenParams } from "../src/core/types";

describe("clampParams", () => {
  it("não mexe nos parâmetros padrão de nenhum algoritmo", () => {
    for (const generator of generators) {
      expect(clampParams(generator, generator.defaultParams)).toEqual(
        generator.defaultParams,
      );
    }
  });

  it("os padrões de todo algoritmo estão dentro da própria faixa", () => {
    for (const generator of generators) {
      for (const def of generator.paramSchema) {
        const value = generator.defaultParams[def.key];
        expect(value).toBeGreaterThanOrEqual(def.min);
        expect(value).toBeLessThanOrEqual(def.max);
      }
    }
  });

  it("prende valores fora da faixa no limite mais próximo", () => {
    const fitted = clampParams(bsp, {
      minLeafSize: 1,
      maxDepth: 99,
      roomPadding: -4,
      corridorWidth: Infinity,
    });
    expect(fitted).toEqual({
      minLeafSize: 6,
      maxDepth: 8,
      roomPadding: 1,
      corridorWidth: 3,
    });
  });

  it("usa o padrão para o que falta ou não é número", () => {
    const broken = { iterations: Number.NaN, birthLimit: "5" } as unknown;
    expect(clampParams(cellularAutomata, broken as GenParams)).toEqual(
      cellularAutomata.defaultParams,
    );
    expect(clampParams(cellularAutomata, {})).toEqual(
      cellularAutomata.defaultParams,
    );
  });

  it("descarta chaves que o algoritmo não conhece", () => {
    const fitted = clampParams(bsp, { ...bsp.defaultParams, extra: 7 });
    expect(fitted).toEqual(bsp.defaultParams);
  });

  it("arredonda os inteiros e preserva os decimais", () => {
    const fitted = clampParams(cellularAutomata, {
      ...cellularAutomata.defaultParams,
      iterations: 3.6,
      initialWallChance: 0.47,
    });
    expect(fitted.iterations).toBe(4);
    expect(fitted.initialWallChance).toBe(0.47);
  });

  it("não altera o objeto recebido", () => {
    const params = { ...bsp.defaultParams, maxDepth: 99 };
    clampParams(bsp, params);
    expect(params.maxDepth).toBe(99);
  });
});
