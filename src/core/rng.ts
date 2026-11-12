import type { Rng } from "./types";

// Hash xmur3: espalha os caracteres do texto por um inteiro de 32 bits,
// de modo que seeds parecidas ("a" e "b") virem números bem diferentes.
export function hashSeed(text: string): number {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: string | number): Rng {
  const next = mulberry32(typeof seed === "string" ? hashSeed(seed) : seed);

  return {
    next,
    int(minInclusive, maxExclusive) {
      if (maxExclusive <= minInclusive) {
        throw new RangeError("int: o máximo precisa ser maior que o mínimo");
      }
      return minInclusive + Math.floor(next() * (maxExclusive - minInclusive));
    },
    chance(p) {
      return next() < p;
    },
    pick<T>(arr: readonly T[]): T {
      if (arr.length === 0) {
        throw new RangeError("pick: a lista está vazia");
      }
      return arr[Math.floor(next() * arr.length)] as T;
    },
  };
}
