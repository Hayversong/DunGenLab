// Embaralha a posição (x, y) em um inteiro sem sinal de 32 bits. Não é
// sorteio: a mesma posição dá sempre o mesmo número, então a textura de um
// tile não muda de um quadro para o outro nem de uma máquina para outra.
export function tileHash(x: number, y: number): number {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

// Qual das `count` variações de arte o tile (x, y) usa.
export function tileVariant(x: number, y: number, count: number): number {
  if (!(count >= 1)) return 0;
  return tileHash(x, y) % Math.floor(count);
}
