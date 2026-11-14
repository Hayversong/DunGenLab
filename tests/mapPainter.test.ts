import { describe, expect, it } from "vitest";
import { createGrid, setTile } from "../src/core/grid";
import { Tile } from "../src/core/types";
import { createMapPainter, dirtyCells } from "../src/render/mapPainter";
import type { PaintInput } from "../src/render/mapPainter";
import { createFakeContext, fakeAtlas } from "./fakeCanvas";

describe("dirtyCells", () => {
  it("nada mudou, nada a redesenhar", () => {
    const tiles = new Uint8Array(12);
    expect(dirtyCells(tiles, tiles.slice(), 4, 3).size).toBe(0);
  });

  it("um tile alterado suja ele e os oito vizinhos", () => {
    const previous = new Uint8Array(25);
    const next = previous.slice();
    next[12] = Tile.FLOOR;
    expect([...dirtyCells(previous, next, 5, 5)].sort((a, b) => a - b)).toEqual(
      [6, 7, 8, 11, 12, 13, 16, 17, 18],
    );
  });

  it("no canto, não sai do mapa nem dá a volta na linha", () => {
    const previous = new Uint8Array(12);
    const next = previous.slice();
    next[3] = Tile.FLOOR;
    expect([...dirtyCells(previous, next, 4, 3)].sort((a, b) => a - b)).toEqual(
      [2, 3, 6, 7],
    );
  });
});

describe("createMapPainter", () => {
  const atlas = fakeAtlas(8);

  function input(overrides: Partial<PaintInput> = {}): PaintInput {
    return {
      grid: createGrid(10, 10),
      tileSize: 8,
      atlas,
      highlight: [],
      marker: "cursor",
      blinkOn: true,
      ...overrides,
    };
  }

  it("a primeira pintura desenha o mapa inteiro", () => {
    const { ctx, images } = createFakeContext();
    const painter = createMapPainter();
    expect(painter.paint(ctx, input())).toBe(100);
    expect(images).toHaveLength(100);
  });

  it("sem mudança, a segunda pintura não desenha nada", () => {
    const fake = createFakeContext();
    const painter = createMapPainter();
    const state = input();
    painter.paint(fake.ctx, state);
    fake.clear();
    expect(painter.paint(fake.ctx, state)).toBe(0);
    expect(fake.images).toHaveLength(0);
  });

  it("um tile alterado redesenha só a vizinhança dele", () => {
    const fake = createFakeContext();
    const painter = createMapPainter();
    const state = input();
    painter.paint(fake.ctx, state);
    fake.clear();
    setTile(state.grid, 5, 5, Tile.FLOOR);
    expect(painter.paint(fake.ctx, state)).toBe(9);
    expect(fake.images).toHaveLength(9);
  });

  it("limpa o marcador do quadro anterior", () => {
    const fake = createFakeContext();
    const painter = createMapPainter();
    const state = input({ highlight: [{ x: 2, y: 3 }] });
    painter.paint(fake.ctx, state);
    fake.clear();
    // O marcador saiu: o tile em que ele estava precisa ser refeito.
    expect(painter.paint(fake.ctx, { ...state, highlight: [] })).toBe(1);
    expect(fake.images).toEqual([
      { sx: expect.any(Number) as number, sy: 0, dx: 16, dy: 24, size: 8 },
    ]);
    expect(fake.fills).toHaveLength(0);
  });

  it("ignora destaque fora do mapa", () => {
    const fake = createFakeContext();
    const painter = createMapPainter();
    painter.paint(
      fake.ctx,
      input({
        highlight: [
          { x: 99, y: 0 },
          { x: -1, y: 2 },
        ],
      }),
    );
    expect(fake.fills).toHaveLength(0);
  });

  it("mudar o tamanho do tile, o grid ou o atlas refaz tudo", () => {
    const fake = createFakeContext();
    const painter = createMapPainter();
    painter.paint(fake.ctx, input());
    expect(
      painter.paint(fake.ctx, input({ tileSize: 16, atlas: fakeAtlas(16) })),
    ).toBe(100);
    expect(
      painter.paint(
        fake.ctx,
        input({ grid: createGrid(4, 4), tileSize: 16, atlas: fakeAtlas(16) }),
      ),
    ).toBe(16);
  });

  it("reset força uma pintura completa", () => {
    const fake = createFakeContext();
    const painter = createMapPainter();
    const state = input();
    painter.paint(fake.ctx, state);
    painter.reset();
    expect(painter.paint(fake.ctx, state)).toBe(100);
  });
});
