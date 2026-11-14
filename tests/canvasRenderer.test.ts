import { describe, expect, it } from "vitest";
import { createGrid, setTile } from "../src/core/grid";
import { Tile } from "../src/core/types";
import {
  TILE_COLORS,
  canvasSize,
  drawCells,
  drawGrid,
  drawMarkers,
  tileColor,
} from "../src/render/canvasRenderer";
import {
  CURSOR_COLORS,
  TileArt,
  WALL_EDGE_COLOR,
  WALL_SHADOW_COLOR,
} from "../src/render/tileArt";
import { createFakeContext, fakeAtlas } from "./fakeCanvas";

describe("tileColor", () => {
  it("dá uma cor diferente para cada tipo de tile", () => {
    const colors = Object.values(Tile).map(tileColor);
    expect(new Set(colors).size).toBe(4);
    for (const color of colors) expect(color).toMatch(/^#[0-9a-f]{6}$/);
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

describe("drawGrid sem atlas (cor chapada)", () => {
  it("desliga a suavização e pinta o fundo de parede no canvas inteiro", () => {
    const { ctx, fake, fills } = createFakeContext();
    drawGrid(ctx, createGrid(4, 3), 5);
    expect(fake.imageSmoothingEnabled).toBe(false);
    expect(fills).toEqual([
      { color: TILE_COLORS[Tile.WALL], x: 0, y: 0, w: 20, h: 15 },
    ]);
  });

  it("pinta cada tile que não é parede no pixel x * tileSize, y * tileSize", () => {
    const { ctx, fills } = createFakeContext();
    const grid = createGrid(4, 3);
    setTile(grid, 1, 0, Tile.FLOOR);
    setTile(grid, 3, 2, Tile.ROOM);
    setTile(grid, 0, 1, Tile.CORRIDOR);
    drawGrid(ctx, grid, 5);
    expect(fills.slice(1)).toEqual([
      { color: TILE_COLORS[Tile.FLOOR], x: 5, y: 0, w: 5, h: 5 },
      { color: TILE_COLORS[Tile.CORRIDOR], x: 0, y: 5, w: 5, h: 5 },
      { color: TILE_COLORS[Tile.ROOM], x: 15, y: 10, w: 5, h: 5 },
    ]);
  });

  it("ignora um atlas feito para outro tamanho de tile", () => {
    const { ctx, images } = createFakeContext();
    drawGrid(ctx, createGrid(2, 2), 5, fakeAtlas(8));
    expect(images).toHaveLength(0);
  });
});

describe("drawGrid com atlas", () => {
  it("copia um tile do atlas para cada posição do grid", () => {
    const { ctx, images } = createFakeContext();
    drawGrid(ctx, createGrid(4, 3), 8, fakeAtlas(8));
    expect(images).toHaveLength(12);
    expect(images.map((call) => `${call.dx},${call.dy}`)).toContain("24,16");
    // Sem chão por perto, tudo é rocha maciça (linha 0 do atlas).
    expect(images.every((call) => call.sy === TileArt.VOID * 8)).toBe(true);
  });

  it("usa a linha do atlas do tipo de cada tile", () => {
    const { ctx, images } = createFakeContext();
    const grid = createGrid(5, 5);
    setTile(grid, 1, 2, Tile.FLOOR);
    setTile(grid, 2, 2, Tile.ROOM);
    setTile(grid, 3, 2, Tile.CORRIDOR);
    drawGrid(ctx, grid, 8, fakeAtlas(8));
    const rowAt = (x: number, y: number) =>
      (images.find((call) => call.dx === x * 8 && call.dy === y * 8)?.sy ??
        -8) / 8;
    expect(rowAt(1, 2)).toBe(TileArt.FLOOR);
    expect(rowAt(2, 2)).toBe(TileArt.ROOM);
    expect(rowAt(3, 2)).toBe(TileArt.CORRIDOR);
    // Parede com chão embaixo é vista de frente; com chão em cima, de topo.
    expect(rowAt(2, 1)).toBe(TileArt.WALL_FACE);
    expect(rowAt(2, 3)).toBe(TileArt.WALL_TOP);
    expect(rowAt(0, 0)).toBe(TileArt.VOID);
  });

  it("o mesmo tile usa sempre a mesma variação", () => {
    const grid = createGrid(6, 6);
    const first = createFakeContext();
    const second = createFakeContext();
    drawGrid(first.ctx, grid, 8, fakeAtlas(8));
    drawGrid(second.ctx, grid, 8, fakeAtlas(8));
    expect(second.images).toEqual(first.images);
    expect(new Set(first.images.map((call) => call.sx)).size).toBeGreaterThan(
      1,
    );
  });

  it("dá contorno à parede e sombra ao chão ao lado dela", () => {
    const { ctx, fills } = createFakeContext();
    const grid = createGrid(3, 3);
    setTile(grid, 1, 1, Tile.FLOOR);
    drawGrid(ctx, grid, 16, fakeAtlas(16));
    // Parede de baixo: contorno na borda de cima, com 2 px (16 / 8).
    expect(fills).toContainEqual({
      color: WALL_EDGE_COLOR,
      x: 16,
      y: 32,
      w: 16,
      h: 2,
    });
    // Chão: sombra larga em cima e fina à esquerda.
    expect(fills).toContainEqual({
      color: WALL_SHADOW_COLOR,
      x: 16,
      y: 16,
      w: 16,
      h: 4,
    });
    expect(fills).toContainEqual({
      color: WALL_SHADOW_COLOR,
      x: 16,
      y: 16,
      w: 2,
      h: 16,
    });
  });
});

describe("drawCells", () => {
  it("redesenha só os tiles pedidos", () => {
    const { ctx, images } = createFakeContext();
    const grid = createGrid(4, 3);
    drawCells(ctx, grid, 8, fakeAtlas(8), [0, 5, 11]);
    expect(images.map((call) => [call.dx, call.dy])).toEqual([
      [0, 0],
      [8, 8],
      [24, 16],
    ]);
  });
});

describe("drawMarkers", () => {
  const points = [{ x: 2, y: 1 }];

  it("não desenha nada sem pontos", () => {
    const { ctx, fills, images } = createFakeContext();
    drawMarkers(ctx, 8, fakeAtlas(8), [], "cursor", true);
    expect(fills).toHaveLength(0);
    expect(images).toHaveLength(0);
  });

  it("o cursor é uma moldura oca que alterna entre duas cores", () => {
    const on = createFakeContext();
    drawMarkers(on.ctx, 16, fakeAtlas(16), points, "cursor", true);
    expect(on.fills).toEqual([
      { color: CURSOR_COLORS[0], x: 32, y: 16, w: 16, h: 2 },
      { color: CURSOR_COLORS[0], x: 32, y: 30, w: 16, h: 2 },
      { color: CURSOR_COLORS[0], x: 32, y: 18, w: 2, h: 12 },
      { color: CURSOR_COLORS[0], x: 46, y: 18, w: 2, h: 12 },
    ]);
    const off = createFakeContext();
    drawMarkers(off.ctx, 16, fakeAtlas(16), points, "cursor", false);
    expect(off.fills[0]?.color).toBe(CURSOR_COLORS[1]);
  });

  it("sem atlas, o cursor preenche o tile", () => {
    const { ctx, fills } = createFakeContext();
    drawMarkers(ctx, 3, null, points, "hero", true);
    expect(fills).toEqual([
      { color: CURSOR_COLORS[0], x: 6, y: 3, w: 3, h: 3 },
    ]);
  });

  it("o herói vem da linha própria do atlas e troca de quadro", () => {
    const first = createFakeContext();
    drawMarkers(first.ctx, 8, fakeAtlas(8), points, "hero", true);
    expect(first.images).toEqual([{ sx: 0, sy: 48, dx: 16, dy: 8, size: 8 }]);
    const second = createFakeContext();
    drawMarkers(second.ctx, 8, fakeAtlas(8), points, "hero", false);
    expect(second.images[0]?.sx).toBe(8);
  });
});
