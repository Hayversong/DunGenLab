import { describe, expect, it } from "vitest";
import { createGrid, setTile } from "../src/core/grid";
import { Tile } from "../src/core/types";
import { Edge, wallArt, wallEdges } from "../src/render/autoTile";
import {
  ART_KINDS,
  ART_PALETTES,
  ART_SIZE,
  HERO_FRAMES,
  HERO_PALETTE,
  TileArt,
  VARIANTS,
  heroPattern,
  tilePattern,
} from "../src/render/tileArt";
import { MIN_TEXTURE_TILE, createTileAtlas } from "../src/render/tileAtlas";
import { tileHash, tileVariant } from "../src/render/tileHash";
import { createFakeSurface } from "./fakeCanvas";

describe("tileHash", () => {
  it("a mesma posição dá sempre o mesmo número", () => {
    expect(tileHash(12, 34)).toBe(tileHash(12, 34));
    expect(tileHash(0, 0)).toBe(tileHash(0, 0));
  });

  it("devolve um inteiro sem sinal de 32 bits", () => {
    for (const [x, y] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [199, 119],
      [-3, 7],
    ] as const) {
      const hash = tileHash(x, y);
      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThan(2 ** 32);
    }
  });

  it("não confunde (x, y) com (y, x) nem vizinhos entre si", () => {
    expect(tileHash(3, 9)).not.toBe(tileHash(9, 3));
    expect(tileHash(5, 5)).not.toBe(tileHash(6, 5));
    expect(tileHash(5, 5)).not.toBe(tileHash(5, 6));
  });
});

describe("tileVariant", () => {
  it("fica sempre dentro da quantidade de variações", () => {
    for (let y = 0; y < 30; y++) {
      for (let x = 0; x < 30; x++) {
        const variant = tileVariant(x, y, 4);
        expect(variant).toBeGreaterThanOrEqual(0);
        expect(variant).toBeLessThan(4);
      }
    }
  });

  it("espalha as variações de forma parecida", () => {
    const counts = [0, 0, 0, 0];
    for (let y = 0; y < 90; y++) {
      for (let x = 0; x < 160; x++) {
        const variant = tileVariant(x, y, 4);
        counts[variant] = (counts[variant] ?? 0) + 1;
      }
    }
    // 14.400 tiles: cada variação deve ficar perto de 3.600.
    for (const count of counts) {
      expect(count).toBeGreaterThan(3200);
      expect(count).toBeLessThan(4000);
    }
  });

  it("quantidade inválida devolve 0", () => {
    expect(tileVariant(3, 4, 0)).toBe(0);
    expect(tileVariant(3, 4, Number.NaN)).toBe(0);
  });
});

describe("tilePattern", () => {
  it("tem 64 pixels, todos com cor existente na paleta", () => {
    for (const kind of ART_KINDS) {
      for (let variant = 0; variant < VARIANTS; variant++) {
        const pattern = tilePattern(kind, variant);
        expect(pattern).toHaveLength(ART_SIZE * ART_SIZE);
        for (const pixel of pattern) {
          expect(pixel).toBeLessThan(ART_PALETTES[kind].length);
        }
      }
    }
  });

  it("é determinístico", () => {
    expect(tilePattern(TileArt.FLOOR, 2)).toEqual(
      tilePattern(TileArt.FLOOR, 2),
    );
  });

  it("as variações de um mesmo tile são diferentes entre si", () => {
    for (const kind of ART_KINDS) {
      const seen = new Set<string>();
      for (let variant = 0; variant < VARIANTS; variant++) {
        seen.add(tilePattern(kind, variant).join(""));
      }
      expect(seen.size).toBe(VARIANTS);
    }
  });

  it("sala, corredor e caverna têm cores de base diferentes", () => {
    const bases = [TileArt.FLOOR, TileArt.ROOM, TileArt.CORRIDOR].map(
      (kind) => ART_PALETTES[kind][0],
    );
    expect(new Set(bases).size).toBe(3);
  });
});

describe("heroPattern", () => {
  it("cada quadro tem 8 linhas de 8 pixels com cores da paleta", () => {
    HERO_FRAMES.forEach((rows, frame) => {
      expect(rows).toHaveLength(ART_SIZE);
      for (const row of rows) expect(row).toHaveLength(ART_SIZE);
      for (const pixel of heroPattern(frame)) {
        expect(pixel).toBeLessThan(HERO_PALETTE.length);
      }
    });
  });

  it("tem pixels transparentes em volta e os quadros diferem", () => {
    expect(heroPattern(0)[0]).toBe(0);
    expect(heroPattern(0)).not.toEqual(heroPattern(1));
  });
});

describe("wallEdges", () => {
  it("sem chão por perto, a máscara é 0", () => {
    expect(wallEdges(createGrid(3, 3), 1, 1)).toBe(0);
  });

  it("liga um bit para cada vizinho que é chão", () => {
    const grid = createGrid(3, 3);
    setTile(grid, 1, 0, Tile.FLOOR);
    expect(wallEdges(grid, 1, 1)).toBe(Edge.N);
    setTile(grid, 2, 1, Tile.ROOM);
    expect(wallEdges(grid, 1, 1)).toBe(Edge.N | Edge.E);
    setTile(grid, 1, 2, Tile.CORRIDOR);
    setTile(grid, 0, 1, Tile.FLOOR);
    expect(wallEdges(grid, 1, 1)).toBe(Edge.N | Edge.E | Edge.S | Edge.W);
  });

  it("fora do mapa conta como parede", () => {
    const grid = createGrid(2, 2);
    expect(wallEdges(grid, 0, 0)).toBe(0);
    expect(wallEdges(grid, 1, 1)).toBe(0);
  });
});

describe("wallArt", () => {
  it("escolhe a arte pelo que há em volta", () => {
    const grid = createGrid(5, 5);
    setTile(grid, 2, 2, Tile.FLOOR);
    expect(wallArt(grid, 2, 1)).toBe(TileArt.WALL_FACE);
    expect(wallArt(grid, 2, 3)).toBe(TileArt.WALL_TOP);
    expect(wallArt(grid, 1, 2)).toBe(TileArt.WALL_TOP);
    // Encostada só pela diagonal ainda é borda.
    expect(wallArt(grid, 1, 1)).toBe(TileArt.WALL_TOP);
    expect(wallArt(grid, 0, 0)).toBe(TileArt.VOID);
    expect(wallArt(grid, 4, 2)).toBe(TileArt.VOID);
  });
});

describe("createTileAtlas", () => {
  it("abaixo do tamanho mínimo não há atlas", () => {
    const { surface } = createFakeSurface();
    expect(createTileAtlas(MIN_TEXTURE_TILE - 1, () => surface)).toBeNull();
    expect(createTileAtlas(7.5, () => surface)).toBeNull();
  });

  it("tem uma linha por tipo de tile e mais uma para o herói", () => {
    const { surface } = createFakeSurface();
    const atlas = createTileAtlas(16, () => surface);
    expect(atlas?.tileSize).toBe(16);
    expect(atlas?.heroRow).toBe(ART_KINDS.length);
    expect(surface.width).toBe(VARIANTS * 16);
    expect(surface.height).toBe((ART_KINDS.length + 1) * 16);
  });

  it("pinta só dentro do atlas, com retângulos inteiros", () => {
    for (const tileSize of [6, 8, 10, 13, 16, 24]) {
      const { surface, fills } = createFakeSurface();
      createTileAtlas(tileSize, () => surface);
      expect(fills.length).toBeGreaterThan(0);
      for (const call of fills) {
        expect(Number.isInteger(call.x) && Number.isInteger(call.w)).toBe(true);
        expect(Number.isInteger(call.y) && Number.isInteger(call.h)).toBe(true);
        expect(call.x).toBeGreaterThanOrEqual(0);
        expect(call.y).toBeGreaterThanOrEqual(0);
        expect(call.x + call.w).toBeLessThanOrEqual(surface.width);
        expect(call.y + call.h).toBeLessThanOrEqual(surface.height);
      }
    }
  });

  it("no tamanho da arte, cada tile é coberto por inteiro", () => {
    const { surface, fills } = createFakeSurface();
    createTileAtlas(8, () => surface);
    const firstTile = fills.filter((call) => call.x < 8 && call.y < 8);
    expect(firstTile).toHaveLength(64);
  });
});
