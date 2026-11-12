import { describe, it } from "vitest";

// Fase 1 — implementar junto com src/core/rng.ts e src/core/grid.ts
describe("rng", () => {
  it.todo("mesma seed produz a mesma sequência de 100 números");
  it.todo("seeds diferentes produzem sequências diferentes");
  it.todo("int(a, b) sempre devolve valores em [a, b)");
});

describe("grid", () => {
  it.todo("getTile fora dos limites devolve WALL");
});
