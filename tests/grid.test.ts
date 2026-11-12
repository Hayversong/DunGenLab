import { describe, expect, it } from "vitest";
import {
  cloneGrid,
  countTiles,
  createGrid,
  getTile,
  inBounds,
  setTile,
} from "../src/core/grid";
import { Tile } from "../src/core/types";

describe("createGrid", () => {
  it("cria o grid com o tamanho pedido, todo de parede por padrão", () => {
    const grid = createGrid(4, 3);
    expect(grid.width).toBe(4);
    expect(grid.height).toBe(3);
    expect(grid.tiles).toHaveLength(12);
    expect(Array.from(grid.tiles).every((t) => t === Tile.WALL)).toBe(true);
  });

  it("aceita outro tile de preenchimento", () => {
    const grid = createGrid(2, 2, Tile.FLOOR);
    expect(Array.from(grid.tiles)).toEqual([1, 1, 1, 1]);
  });

  it("recusa dimensões inválidas", () => {
    expect(() => createGrid(0, 5)).toThrow(RangeError);
    expect(() => createGrid(5, -1)).toThrow(RangeError);
    expect(() => createGrid(2.5, 5)).toThrow(RangeError);
  });
});

describe("inBounds", () => {
  it("reconhece os cantos e o que está fora", () => {
    const grid = createGrid(3, 2);
    expect(inBounds(grid, 0, 0)).toBe(true);
    expect(inBounds(grid, 2, 1)).toBe(true);
    expect(inBounds(grid, 3, 1)).toBe(false);
    expect(inBounds(grid, 2, 2)).toBe(false);
    expect(inBounds(grid, -1, 0)).toBe(false);
    expect(inBounds(grid, 0, -1)).toBe(false);
  });
});

describe("getTile e setTile", () => {
  it("gravam e leem na posição y * width + x", () => {
    const grid = createGrid(3, 3);
    setTile(grid, 2, 1, Tile.FLOOR);
    expect(getTile(grid, 2, 1)).toBe(Tile.FLOOR);
    expect(grid.tiles[5]).toBe(Tile.FLOOR);
  });

  it("getTile fora dos limites devolve WALL", () => {
    const grid = createGrid(3, 3, Tile.FLOOR);
    expect(getTile(grid, -1, 0)).toBe(Tile.WALL);
    expect(getTile(grid, 0, -1)).toBe(Tile.WALL);
    expect(getTile(grid, 3, 0)).toBe(Tile.WALL);
    expect(getTile(grid, 0, 3)).toBe(Tile.WALL);
  });

  it("setTile fora dos limites não altera nada", () => {
    const grid = createGrid(3, 3);
    const before = Array.from(grid.tiles);
    setTile(grid, -1, 0, Tile.FLOOR);
    setTile(grid, 3, 0, Tile.FLOOR);
    setTile(grid, 0, -1, Tile.FLOOR);
    setTile(grid, 0, 3, Tile.FLOOR);
    expect(Array.from(grid.tiles)).toEqual(before);
  });
});

describe("cloneGrid", () => {
  it("copia o conteúdo sem compartilhar o buffer", () => {
    const grid = createGrid(3, 3);
    setTile(grid, 1, 1, Tile.ROOM);
    const copy = cloneGrid(grid);

    expect(copy).toEqual(grid);
    expect(copy.tiles).not.toBe(grid.tiles);
    expect(copy.tiles.buffer).not.toBe(grid.tiles.buffer);

    setTile(copy, 0, 0, Tile.FLOOR);
    expect(getTile(grid, 0, 0)).toBe(Tile.WALL);
  });
});

describe("countTiles", () => {
  it("conta os tiles que passam no predicado", () => {
    const grid = createGrid(3, 3);
    setTile(grid, 0, 0, Tile.FLOOR);
    setTile(grid, 1, 0, Tile.ROOM);
    setTile(grid, 2, 0, Tile.CORRIDOR);
    expect(countTiles(grid, (t) => t !== Tile.WALL)).toBe(3);
    expect(countTiles(grid, (t) => t === Tile.WALL)).toBe(6);
  });
});
