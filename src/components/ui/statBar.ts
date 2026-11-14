// Fração preenchida de uma barra, sempre entre 0 e 1, mesmo com valor fora
// da faixa ou máximo inválido.
export function barRatio(value: number, max: number): number {
  if (!(max > 0) || Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value / max));
}

// Quantos blocos de uma barra de `blocks` blocos ficam acesos. Um valor
// maior que zero acende pelo menos um, para não parecer vazio.
export function filledBlocks(ratio: number, blocks: number): number {
  if (ratio <= 0 || blocks <= 0) return 0;
  return Math.min(blocks, Math.max(1, Math.round(ratio * blocks)));
}
