import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  luminance,
  parseColorTokens,
} from "../src/styles/contrast";
// O sufixo ?raw entrega o arquivo como texto, sem processá-lo como CSS.
import tokensCss from "../src/styles/tokens.css?raw";

const tokens = parseColorTokens(tokensCss);

function token(name: string): string {
  const value = tokens[name];
  if (!value) throw new Error(`Token ausente: ${name}`);
  return value;
}

describe("contrastRatio", () => {
  it("preto sobre branco dá 21 e cor sobre ela mesma dá 1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#d8a93a", "#d8a93a")).toBe(1);
  });

  it("não depende da ordem das cores", () => {
    expect(contrastRatio("#f1eddc", "#1f2f6b")).toBe(
      contrastRatio("#1f2f6b", "#f1eddc"),
    );
  });

  it("confere com valores de referência conhecidos", () => {
    // Cinza #777777 sobre branco: exemplo clássico que fica logo abaixo de 4,5.
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
    expect(luminance("#ffffff")).toBeCloseTo(1, 5);
    expect(luminance("#000000")).toBe(0);
  });

  it("recusa cor fora do formato #rrggbb", () => {
    expect(() => luminance("#fff")).toThrow("Cor inválida");
    expect(() => luminance("azul")).toThrow("Cor inválida");
  });
});

describe("parseColorTokens", () => {
  it("lê só variáveis com cor em hexadecimal", () => {
    const css = ":root { --a: #AABBCC; --u: 4px; --b: var(--a); }";
    expect(parseColorTokens(css)).toEqual({ "--a": "#aabbcc" });
  });
});

describe("pares de texto da paleta", () => {
  // [cor do texto, cor do fundo]. Todo par usado para texto entra aqui.
  const textPairs: [string, string][] = [
    ["--text", "--win-1"],
    ["--text", "--win-2"],
    ["--text", "--win-3"],
    ["--text-soft", "--win-1"],
    ["--text-disabled", "--win-1"],
    ["--gold", "--win-1"],
    ["--green-light", "--win-1"],
    ["--red-light", "--win-1"],
    ["--teal-light", "--win-1"],
    ["--text", "--win-track"],
    ["--text", "--stone-900"],
    ["--text", "--stone-800"],
    ["--text-stone", "--stone-800"],
    ["--gold", "--stone-900"],
    ["--parch-text", "--parch"],
    ["--parch-soft", "--parch"],
    ["--ink-on-gold", "--gold"],
    ["--text", "--error-bg"],
  ];

  for (const [fg, bg] of textPairs) {
    it(`${fg} sobre ${bg} passa no nível AA (4,5)`, () => {
      expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("as cores de preenchimento não servem como texto sobre a janela", () => {
    for (const fill of ["--green", "--red", "--teal"]) {
      expect(contrastRatio(token(fill), token("--win-3"))).toBeLessThan(4.5);
    }
  });
});
