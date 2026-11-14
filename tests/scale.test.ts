import { describe, expect, it } from "vitest";
import { MAX_TILE, fitTileSize, tileSizeFor } from "../src/render/scale";

describe("fitTileSize", () => {
  it("escolhe o maior tile inteiro que cabe nas duas dimensões", () => {
    expect(fitTileSize(1000, 600, 80, 45)).toBe(12);
    expect(fitTileSize(800, 600, 40, 30)).toBe(20);
    expect(fitTileSize(1300, 900, 160, 90)).toBe(8);
  });

  it("respeita a dimensão mais apertada", () => {
    expect(fitTileSize(2000, 300, 40, 30)).toBe(10);
    expect(fitTileSize(300, 2000, 40, 30)).toBe(7);
  });

  it("o mapa cabe na área, e um tile a mais já não caberia", () => {
    const grids = [
      [40, 30],
      [80, 45],
      [160, 90],
    ] as const;
    for (const [cols, rows] of grids) {
      for (const [width, height] of [
        [358, 400],
        [838, 560],
        [1392, 912],
      ] as const) {
        const tile = fitTileSize(width, height, cols, rows);
        expect(Number.isInteger(tile)).toBe(true);
        expect(tile * cols).toBeLessThanOrEqual(width);
        expect(tile * rows).toBeLessThanOrEqual(height);
        const bigger = tile + 1;
        expect(bigger * cols > width || bigger * rows > height).toBe(true);
      }
    }
  });

  it("área menor que a grade devolve 1, nunca 0", () => {
    expect(fitTileSize(100, 50, 160, 90)).toBe(1);
    expect(fitTileSize(159, 1000, 160, 90)).toBe(1);
  });

  it("área vazia, negativa ou inválida devolve 1", () => {
    expect(fitTileSize(0, 0, 80, 50)).toBe(1);
    expect(fitTileSize(-10, 500, 80, 50)).toBe(1);
    expect(fitTileSize(Number.NaN, 500, 80, 50)).toBe(1);
    expect(fitTileSize(500, 500, 0, 0)).toBe(1);
  });

  it("não passa do tile máximo", () => {
    expect(fitTileSize(4000, 4000, 20, 20)).toBe(MAX_TILE);
    expect(fitTileSize(4000, 4000, 20, 20, 16)).toBe(16);
  });

  it("área exata usa o tile exato", () => {
    expect(fitTileSize(800, 500, 80, 50)).toBe(10);
    expect(fitTileSize(799, 500, 80, 50)).toBe(9);
  });
});

describe("tileSizeFor", () => {
  const area = { width: 358, height: 400 };

  it("no modo ajustar, usa a área em pixels do aparelho", () => {
    expect(tileSizeFor("fit", area, 80, 50, 1)).toBe(4);
    expect(tileSizeFor("fit", area, 80, 50, 3)).toBe(13);
  });

  it("no zoom manual, o tile é múltiplo do tile base", () => {
    expect(tileSizeFor(1, area, 80, 50, 1)).toBe(8);
    expect(tileSizeFor(2, area, 80, 50, 1)).toBe(16);
    expect(tileSizeFor(3, area, 80, 50, 2)).toBe(48);
  });

  it("proporção de pixels inválida vale 1", () => {
    expect(tileSizeFor("fit", area, 80, 50, 0)).toBe(4);
    expect(tileSizeFor(1, area, 80, 50, Number.NaN)).toBe(8);
  });
});
