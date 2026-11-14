import { describe, expect, it } from "vitest";
import { isCursorKey, moveCursor } from "../src/components/ui/menuCursor";
import { barRatio, filledBlocks } from "../src/components/ui/statBar";

describe("moveCursor", () => {
  it("as setas sobem e descem uma posição", () => {
    expect(moveCursor(0, "ArrowDown", 3)).toBe(1);
    expect(moveCursor(2, "ArrowUp", 3)).toBe(1);
  });

  it("dá a volta nas pontas", () => {
    expect(moveCursor(2, "ArrowDown", 3)).toBe(0);
    expect(moveCursor(0, "ArrowUp", 3)).toBe(2);
  });

  it("Home e End vão para as pontas", () => {
    expect(moveCursor(1, "Home", 3)).toBe(0);
    expect(moveCursor(1, "End", 3)).toBe(2);
  });

  it("as setas para os lados valem como as de cima e baixo", () => {
    expect(moveCursor(0, "ArrowRight", 3)).toBe(1);
    expect(moveCursor(0, "ArrowLeft", 3)).toBe(2);
  });

  it("outras teclas não movem o cursor", () => {
    for (const key of ["Enter", " ", "r", "Tab"]) {
      expect(moveCursor(1, key, 3)).toBe(1);
      expect(isCursorKey(key)).toBe(false);
    }
  });

  it("reconhece as teclas de navegação mesmo quando o cursor não sai do lugar", () => {
    for (const key of ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"]) {
      expect(isCursorKey(key)).toBe(true);
    }
    expect(isCursorKey("Home")).toBe(true);
    expect(moveCursor(0, "Home", 3)).toBe(0);
  });

  it("lista de um item ou vazia não quebra", () => {
    expect(moveCursor(0, "ArrowDown", 1)).toBe(0);
    expect(moveCursor(0, "ArrowUp", 1)).toBe(0);
    expect(moveCursor(5, "ArrowDown", 0)).toBe(0);
  });
});

describe("barRatio", () => {
  it("divide o valor pelo máximo", () => {
    expect(barRatio(40, 100)).toBe(0.4);
    expect(barRatio(3, 4)).toBe(0.75);
  });

  it("prende o resultado entre 0 e 1", () => {
    expect(barRatio(150, 100)).toBe(1);
    expect(barRatio(-5, 100)).toBe(0);
  });

  it("máximo inválido ou valor quebrado dá barra vazia", () => {
    expect(barRatio(10, 0)).toBe(0);
    expect(barRatio(10, -1)).toBe(0);
    expect(barRatio(10, Number.NaN)).toBe(0);
    expect(barRatio(Number.NaN, 100)).toBe(0);
  });
});

describe("filledBlocks", () => {
  it("arredonda para o bloco mais próximo", () => {
    expect(filledBlocks(0.4, 10)).toBe(4);
    expect(filledBlocks(0.427, 10)).toBe(4);
    expect(filledBlocks(0.46, 10)).toBe(5);
    expect(filledBlocks(1, 10)).toBe(10);
  });

  it("zero não acende nada", () => {
    expect(filledBlocks(0, 10)).toBe(0);
  });

  it("qualquer valor acima de zero acende pelo menos um bloco", () => {
    expect(filledBlocks(0.01, 10)).toBe(1);
  });

  it("não passa do total de blocos", () => {
    expect(filledBlocks(3, 10)).toBe(10);
    expect(filledBlocks(0.5, 0)).toBe(0);
  });
});
