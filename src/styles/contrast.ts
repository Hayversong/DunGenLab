// Contraste entre duas cores, pela fórmula do WCAG. Vai de 1 (cores iguais)
// a 21 (preto sobre branco). Texto normal precisa de pelo menos 4,5.

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// Luminância relativa: o quanto a cor parece clara, de 0 a 1. O verde pesa
// mais porque o olho é mais sensível a ele.
export function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`Cor inválida: ${hex}`);
  const value = parseInt(match[1] as string, 16);
  const r = channel((value >> 16) & 0xff);
  const g = channel((value >> 8) & 0xff);
  const b = channel(value & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Lê as variáveis de cor de um arquivo de tokens: { "--text": "#f1eddc" }.
export function parseColorTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const match of css.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    tokens[match[1] as string] = (match[2] as string).toLowerCase();
  }
  return tokens;
}
