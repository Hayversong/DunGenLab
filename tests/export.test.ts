import { describe, expect, it } from "vitest";
import {
  EXPORT_VERSION,
  MAX_MAP_HEIGHT,
  MAX_MAP_WIDTH,
  exportFileName,
  fromJSON,
  toJSON,
} from "../src/core/export";
import type { MapMeta } from "../src/core/export";
import { generators } from "../src/core/generators";
import { createGrid, setTile } from "../src/core/grid";
import { createRng } from "../src/core/rng";
import { Tile } from "../src/core/types";

const META: MapMeta = {
  generator: "bsp",
  seed: "gato-preto",
  params: { minLeafSize: 10, maxDepth: 5, roomPadding: 1, corridorWidth: 1 },
};

// Um arquivo válido de 4 x 2, com um campo trocado a cada teste.
function fileWith(overrides: Record<string, unknown>): string {
  return JSON.stringify({
    version: 1,
    generator: "bsp",
    seed: "s",
    params: { a: 1 },
    width: 4,
    height: 2,
    tiles: "01230000",
    ...overrides,
  });
}

function without(key: string): string {
  const data = JSON.parse(fileWith({})) as Record<string, unknown>;
  delete data[key];
  return JSON.stringify(data);
}

describe("toJSON", () => {
  it("segue o formato combinado, com os campos na ordem", () => {
    const grid = createGrid(4, 2);
    setTile(grid, 1, 0, Tile.FLOOR);
    setTile(grid, 2, 0, Tile.ROOM);
    setTile(grid, 3, 0, Tile.CORRIDOR);

    const data = JSON.parse(toJSON(grid, META)) as Record<string, unknown>;
    expect(Object.keys(data)).toEqual([
      "version",
      "generator",
      "seed",
      "params",
      "width",
      "height",
      "tiles",
    ]);
    expect(data).toEqual({
      version: EXPORT_VERSION,
      generator: "bsp",
      seed: "gato-preto",
      params: META.params,
      width: 4,
      height: 2,
      tiles: "01230000",
    });
  });
});

describe("ida e volta", () => {
  it("fromJSON(toJSON(grid)) devolve grid e dados idênticos", () => {
    for (const generator of generators) {
      const grid = createGrid(80, 50);
      const params = generator.defaultParams;
      for (const step of generator.run(grid, params, createRng("ida"))) {
        void step;
      }
      const meta = { generator: generator.id, seed: "ida", params };

      const result = fromJSON(toJSON(grid, meta));
      expect(result.grid.width).toBe(80);
      expect(result.grid.height).toBe(50);
      expect(result.grid.tiles).toEqual(grid.tiles);
      expect(result.meta).toEqual(meta);
    }
  });

  it("funciona nos tamanhos extremos", () => {
    for (const [width, height] of [
      [1, 1],
      [MAX_MAP_WIDTH, MAX_MAP_HEIGHT],
    ] as const) {
      const grid = createGrid(width, height, Tile.CORRIDOR);
      const result = fromJSON(toJSON(grid, META));
      expect(result.grid.tiles).toEqual(grid.tiles);
    }
  });

  it("preserva seed vazia, com acentos e com aspas", () => {
    for (const seed of ["", "caverna nº 3", 'a "b" \\ c', "🗺️"]) {
      const result = fromJSON(toJSON(createGrid(2, 2), { ...META, seed }));
      expect(result.meta.seed).toBe(seed);
    }
  });

  it("o grid importado é independente do texto e do original", () => {
    const grid = createGrid(3, 3);
    const result = fromJSON(toJSON(grid, META));
    setTile(result.grid, 1, 1, Tile.FLOOR);
    expect(grid.tiles[4]).toBe(Tile.WALL);
  });
});

describe("fromJSON com entrada inválida", () => {
  it("texto que não é JSON", () => {
    for (const text of ["", "isto não é json", "{", '{"version": 1,}']) {
      expect(() => fromJSON(text)).toThrow("não é um JSON válido");
    }
  });

  it("JSON que não é um objeto", () => {
    for (const text of ["null", "42", '"texto"', "[]", "[1, 2]"]) {
      expect(() => fromJSON(text)).toThrow("formato de um mapa");
    }
  });

  it("versão desconhecida ou ausente", () => {
    expect(() => fromJSON(fileWith({ version: 2 }))).toThrow(
      "Versão 2 do formato não é suportada",
    );
    expect(() => fromJSON(fileWith({ version: 0 }))).toThrow("não é suportada");
    expect(() => fromJSON(fileWith({ version: "1" }))).toThrow("version");
    expect(() => fromJSON(without("version"))).toThrow("version");
  });

  it("tamanho incompatível com a quantidade de tiles", () => {
    expect(() => fromJSON(fileWith({ tiles: "0123000" }))).toThrow(
      "4 x 2 = 8 tiles",
    );
    expect(() => fromJSON(fileWith({ tiles: "012300000" }))).toThrow(
      'o campo "tiles" tem 9',
    );
    expect(() => fromJSON(fileWith({ width: 5 }))).toThrow("5 x 2 = 10");
    expect(() => fromJSON(fileWith({ tiles: "" }))).toThrow("tem 0");
  });

  it("caractere inválido nos tiles", () => {
    expect(() => fromJSON(fileWith({ tiles: "01240000" }))).toThrow(
      'caractere inválido ("4") na posição 4',
    );
    for (const tiles of ["0123000x", "0123 000", "0123-000", "０1230000"]) {
      expect(() => fromJSON(fileWith({ tiles }))).toThrow("caractere inválido");
    }
  });

  it("dimensões fora dos limites ou que não são inteiros", () => {
    const tooWide = MAX_MAP_WIDTH + 1;
    expect(() => fromJSON(fileWith({ width: tooWide }))).toThrow(
      `entre 1 e ${MAX_MAP_WIDTH}`,
    );
    expect(() => fromJSON(fileWith({ height: MAX_MAP_HEIGHT + 1 }))).toThrow(
      `entre 1 e ${MAX_MAP_HEIGHT}`,
    );
    for (const width of [0, -4, 1e9]) {
      expect(() => fromJSON(fileWith({ width }))).toThrow("width");
    }
    for (const height of [2.5, "2", null, true]) {
      expect(() => fromJSON(fileWith({ height }))).toThrow(
        '"height" precisa ser um número inteiro',
      );
    }
    expect(() => fromJSON(without("width"))).toThrow("width");
  });

  it("campos com tipo errado ou ausentes", () => {
    expect(() => fromJSON(fileWith({ generator: 7 }))).toThrow("generator");
    expect(() => fromJSON(fileWith({ generator: "" }))).toThrow("generator");
    expect(() => fromJSON(fileWith({ seed: 123 }))).toThrow("seed");
    expect(() => fromJSON(without("seed"))).toThrow("seed");
    expect(() => fromJSON(fileWith({ params: null }))).toThrow("params");
    expect(() => fromJSON(fileWith({ params: [1, 2] }))).toThrow("params");
    expect(() => fromJSON(fileWith({ params: { a: "1" } }))).toThrow(
      'parâmetro "a"',
    );
    expect(() => fromJSON(fileWith({ tiles: 1230000 }))).toThrow("tiles");
    expect(() => fromJSON(without("tiles"))).toThrow("tiles");
  });

  it("todo erro é um Error com mensagem", () => {
    const bad = ["x", "[]", fileWith({ version: 9 }), fileWith({ tiles: "9" })];
    for (const text of bad) {
      let caught: unknown;
      try {
        fromJSON(text);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(Error);
      expect((caught as Error).message.length).toBeGreaterThan(10);
    }
  });

  it("ignora campos a mais", () => {
    const result = fromJSON(fileWith({ extra: "tanto faz" }));
    expect(result.grid.tiles).toEqual(
      Uint8Array.from([0, 1, 2, 3, 0, 0, 0, 0]),
    );
  });
});

describe("exportFileName", () => {
  it("usa a seed no nome do arquivo", () => {
    expect(exportFileName("gato-preto", "png")).toBe("mapa-gato-preto.png");
    expect(exportFileName("abc_123", "json")).toBe("mapa-abc_123.json");
  });

  it("troca o que não pode ir em nome de arquivo", () => {
    expect(exportFileName("../../etc/passwd", "png")).toBe(
      "mapa-etc-passwd.png",
    );
    expect(exportFileName("minha seed: v2?", "json")).toBe(
      "mapa-minha-seed-v2.json",
    );
    expect(exportFileName("caverna nº 3", "png")).toBe("mapa-caverna-nº-3.png");
  });

  it("tem um nome para seed vazia", () => {
    expect(exportFileName("", "png")).toBe("mapa-sem-seed.png");
    expect(exportFileName("  //  ", "png")).toBe("mapa-sem-seed.png");
  });
});
