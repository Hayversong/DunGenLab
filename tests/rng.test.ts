import { describe, expect, it } from "vitest";
import { createRng, hashSeed } from "../src/core/rng";

function sequence(seed: string | number, length: number): number[] {
  const rng = createRng(seed);
  return Array.from({ length }, () => rng.next());
}

describe("hashSeed", () => {
  it("devolve um inteiro de 32 bits sem sinal", () => {
    for (const text of ["", "a", "gato-preto", "ação 🎲", "x".repeat(500)]) {
      const hash = hashSeed(text);
      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThan(2 ** 32);
    }
  });

  it("é determinístico e separa textos parecidos", () => {
    expect(hashSeed("gato-preto")).toBe(hashSeed("gato-preto"));
    expect(hashSeed("a")).not.toBe(hashSeed("b"));
    expect(hashSeed("ab")).not.toBe(hashSeed("ba"));
  });
});

describe("createRng", () => {
  it("mesma seed produz a mesma sequência de 100 números", () => {
    expect(sequence("gato-preto", 100)).toEqual(sequence("gato-preto", 100));
    expect(sequence(42, 100)).toEqual(sequence(42, 100));
  });

  it("seeds diferentes produzem sequências diferentes", () => {
    expect(sequence("gato-preto", 100)).not.toEqual(
      sequence("gato-branco", 100),
    );
    expect(sequence(1, 100)).not.toEqual(sequence(2, 100));
  });

  it("seed em texto equivale ao número do seu hash", () => {
    expect(sequence("gato-preto", 10)).toEqual(
      sequence(hashSeed("gato-preto"), 10),
    );
  });

  it("next fica sempre em [0, 1)", () => {
    const rng = createRng("limites");
    for (let i = 0; i < 10_000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("int(a, b) sempre devolve inteiros em [a, b) e alcança os extremos", () => {
    const rng = createRng("inteiros");
    const seen = new Set<number>();
    for (let i = 0; i < 10_000; i++) {
      const value = rng.int(-3, 7);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(-3);
      expect(value).toBeLessThan(7);
      seen.add(value);
    }
    expect(seen.size).toBe(10);
  });

  it("int recusa intervalo vazio", () => {
    const rng = createRng(1);
    expect(() => rng.int(5, 5)).toThrow(RangeError);
    expect(() => rng.int(5, 2)).toThrow(RangeError);
  });

  it("chance(0) é sempre false e chance(1) é sempre true", () => {
    const rng = createRng("moeda");
    for (let i = 0; i < 10_000; i++) {
      expect(rng.chance(0)).toBe(false);
      expect(rng.chance(1)).toBe(true);
    }
  });

  it("chance(p) acerta a proporção esperada", () => {
    const rng = createRng("proporcao");
    let hits = 0;
    for (let i = 0; i < 10_000; i++) {
      if (rng.chance(0.3)) hits++;
    }
    expect(hits / 10_000).toBeCloseTo(0.3, 1);
  });

  it("pick devolve itens da lista e passa por todos", () => {
    const rng = createRng("escolha");
    const options = ["n", "s", "l", "o"] as const;
    const seen = new Set<string>();
    for (let i = 0; i < 1_000; i++) {
      const value = rng.pick(options);
      expect(options).toContain(value);
      seen.add(value);
    }
    expect(seen.size).toBe(options.length);
  });

  it("pick recusa lista vazia", () => {
    expect(() => createRng(1).pick([])).toThrow(RangeError);
  });
});
