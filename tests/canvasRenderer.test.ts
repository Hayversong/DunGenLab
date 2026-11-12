import { describe, expect, it } from "vitest";
import { createGrid, setTile } from "../src/core/grid";
import { Tile } from "../src/core/types";
import {
  HIGHLIGHT_COLOR,
  TILE_COLORS,
  canvasSize,
  drawGrid,
  tileColor,
} from "../src/render/canvasRenderer";

interface FillCall {
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Contexto falso que só anota as chamadas, para testar sem navegador.
function createFakeContext() {
  const calls: FillCall[] = [];
  const fake = {
    fillStyle: "",
    imageSmoothingEnabled: true,
    fillRect(x: number, y: number, w: number, h: number) {
      calls.push({ color: fake.fillStyle, x, y, w, h });
    },
  };
  return { ctx: fake as unknown as CanvasRenderingContext2D, fake, calls };
}

describe("tileColor", () => {
  it("dá uma cor diferente para cada tipo de tile", () => {
    const colors = Object.values(Tile).map(tileColor);
    expect(new Set(colors).size).toBe(4);
    expect(tileColor(Tile.WALL)).toBe("#14161c");
    expect(tileColor(Tile.FLOOR)).toBe("#c9b48a");
    expect(tileColor(Tile.ROOM)).toBe("#d8c9a3");
    expect(tileColor(Tile.CORRIDOR)).toBe("#a89268");
  });
});

describe("canvasSize", () => {
  it("multiplica as dimensões do grid pelo tileSize", () => {
    expect(canvasSize(createGrid(80, 50), 10)).toEqual({
      width: 800,
      height: 500,
    });
    expect(canvasSize(createGrid(4, 3), 1)).toEqual({ width: 4, height: 3 });
  });

  it("recusa tileSize inválido", () => {
    const grid = createGrid(4, 3);
    expect(() => canvasSize(grid, 0)).toThrow(RangeError);
    expect(() => canvasSize(grid, -2)).toThrow(RangeError);
    expect(() => canvasSize(grid, 1.5)).toThrow(RangeError);
  });
});

describe("drawGrid", () => {
  it("desliga a suavização e pinta o fundo de parede no canvas inteiro", () => {
    const { ctx, fake, calls } = createFakeContext();
    drawGrid(ctx, createGrid(4, 3), 10);

    expect(fake.imageSmoothingEnabled).toBe(false);
    expect(calls).toEqual([
      { color: TILE_COLORS[Tile.WALL], x: 0, y: 0, w: 40, h: 30 },
    ]);
  });

  it("pinta cada tile que não é parede no pixel x * tileSize, y * tileSize", () => {
    const { ctx, calls } = createFakeContext();
    const grid = createGrid(4, 3);
    setTile(grid, 2, 1, Tile.FLOOR);
    setTile(grid, 3, 2, Tile.ROOM);
    setTile(grid, 0, 0, Tile.CORRIDOR);
    drawGrid(ctx, grid, 10);

    expect(calls.slice(1)).toEqual([
      { color: TILE_COLORS[Tile.CORRIDOR], x: 0, y: 0, w: 10, h: 10 },
      { color: TILE_COLORS[Tile.FLOOR], x: 20, y: 10, w: 10, h: 10 },
      { color: TILE_COLORS[Tile.ROOM], x: 30, y: 20, w: 10, h: 10 },
    ]);
  });

  it("desenha o destaque por último, por cima dos tiles", () => {
    const { ctx, calls } = createFakeContext();
    const grid = createGrid(4, 3, Tile.FLOOR);
    drawGrid(ctx, grid, 10, [{ x: 1, y: 2 }]);

    expect(calls).toHaveLength(1 + 12 + 1);
    expect(calls.at(-1)).toEqual({
      color: HIGHLIGHT_COLOR,
      x: 10,
      y: 20,
      w: 10,
      h: 10,
    });
  });
});
