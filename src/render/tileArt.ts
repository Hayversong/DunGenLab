import { tileHash } from "./tileHash";

// Toda a arte do mapa é desenhada aqui, em código: cada tile é uma grade de
// 8 x 8 números, e cada número é a posição de uma cor na paleta do tile.

// Lado da arte de um tile, em pixels de arte.
export const ART_SIZE = 8;
// Quantas versões de cada tile existem, para o chão não parecer carimbado.
export const VARIANTS = 4;

export const TileArt = {
  // Rocha maciça, longe de qualquer chão.
  VOID: 0,
  // Topo de parede vizinha do chão.
  WALL_TOP: 1,
  // Parede vista de frente: aparece quando há chão logo abaixo.
  WALL_FACE: 2,
  // Chão de caverna (terra batida).
  FLOOR: 3,
  // Piso de sala (lajes claras).
  ROOM: 4,
  // Piso de corredor (pedras cinzentas).
  CORRIDOR: 5,
} as const;

export type TileArtKind = (typeof TileArt)[keyof typeof TileArt];

export const ART_KINDS: readonly TileArtKind[] = [
  TileArt.VOID,
  TileArt.WALL_TOP,
  TileArt.WALL_FACE,
  TileArt.FLOOR,
  TileArt.ROOM,
  TileArt.CORRIDOR,
];

// Paleta de cada tile. A posição 0 é a cor de base.
export const ART_PALETTES: Record<TileArtKind, readonly string[]> = {
  [TileArt.VOID]: ["#14120f", "#1e1b17"],
  [TileArt.WALL_TOP]: ["#4a443a", "#5a5347", "#3a352c"],
  [TileArt.WALL_FACE]: ["#2e2720", "#70523d", "#4f382a", "#8a6a50"],
  [TileArt.FLOOR]: ["#8a7350", "#766142", "#9b8562"],
  [TileArt.ROOM]: ["#bca97f", "#a08d66", "#cbb98f"],
  [TileArt.CORRIDOR]: ["#8d887a", "#6c675b", "#a09b8c"],
};

// Linha clara na borda da parede que encosta no chão, e sombra que a parede
// projeta no chão ao lado. São elas que dão a sensação de altura.
export const WALL_EDGE_COLOR = "#7a7262";
export const WALL_SHADOW_COLOR = "rgb(20 18 15 / 0.4)";

// Cores do cursor que marca o passo atual; ele alterna entre as duas.
export const CURSOR_COLORS: readonly [string, string] = ["#d8a93a", "#f1eddc"];

// Marcador do andarilho: um aventureiro de capuz. 0 é transparente.
export const HERO_PALETTE: readonly string[] = [
  "",
  "#1b1410",
  "#b0492f",
  "#e3c08f",
  "#4f8a45",
  "#d8a93a",
  "#5c4424",
];

// Dois quadros: no segundo as pernas trocam, como um passo.
export const HERO_FRAMES: readonly (readonly string[])[] = [
  [
    "..1111..",
    ".122221.",
    ".133331.",
    "14444441",
    "14455441",
    ".144441.",
    ".161161.",
    ".11..11.",
  ],
  [
    "..1111..",
    ".122221.",
    ".133331.",
    "14444441",
    "14455441",
    ".144441.",
    "..1661..",
    "..1111..",
  ],
];

// Sorteio fixo por pixel: true em mais ou menos 1 a cada `oneIn` pixels.
function speck(
  kind: TileArtKind,
  variant: number,
  x: number,
  y: number,
  salt: number,
  oneIn: number,
): boolean {
  return (
    tileHash(x + variant * 16 + salt * 64, y + kind * 16 + salt * 32) %
      oneIn ===
    0
  );
}

function pixelFor(
  kind: TileArtKind,
  variant: number,
  x: number,
  y: number,
): number {
  switch (kind) {
    case TileArt.VOID:
      return speck(kind, variant, x, y, 0, 14) ? 1 : 0;

    case TileArt.WALL_TOP:
      if (speck(kind, variant, x, y, 0, 7)) return 1;
      return speck(kind, variant, x, y, 1, 7) ? 2 : 0;

    case TileArt.WALL_FACE: {
      // Duas fiadas de tijolos, com as juntas desencontradas.
      if (y === 0) return 3;
      if (y === 4) return 0;
      if (y === 7) return 2;
      const joint = y < 4 ? (2 + variant * 2) % 8 : (6 + variant * 2) % 8;
      if (x === joint) return 0;
      return speck(kind, variant, x, y, 0, 6) ? 3 : 1;
    }

    case TileArt.FLOOR:
      if (speck(kind, variant, x, y, 0, 6)) return 1;
      return speck(kind, variant, x, y, 1, 9) ? 2 : 0;

    case TileArt.ROOM:
      // Uma laje por tile: a junta fica nas bordas de cima e da esquerda.
      if (x === 0 || y === 0) return 1;
      return speck(kind, variant, x, y, 0, 10) ? 2 : 0;

    case TileArt.CORRIDOR: {
      // Pedras menores, em duas fileiras desencontradas.
      if (y === 0 || y === 4) return 1;
      const joint = y < 4 ? (3 + variant) % 8 : (7 + variant) % 8;
      if (x === joint) return 1;
      return speck(kind, variant, x, y, 0, 8) ? 2 : 0;
    }
  }
}

// Os 64 pixels de uma variação de um tile, linha a linha.
export function tilePattern(kind: TileArtKind, variant: number): Uint8Array {
  const pattern = new Uint8Array(ART_SIZE * ART_SIZE);
  for (let y = 0; y < ART_SIZE; y++) {
    for (let x = 0; x < ART_SIZE; x++) {
      pattern[y * ART_SIZE + x] = pixelFor(kind, variant, x, y);
    }
  }
  return pattern;
}

// Um quadro do marcador do andarilho, no mesmo formato de tilePattern.
export function heroPattern(frame: number): Uint8Array {
  const rows = HERO_FRAMES[frame % HERO_FRAMES.length] ?? [];
  const pattern = new Uint8Array(ART_SIZE * ART_SIZE);
  rows.forEach((row, y) => {
    for (let x = 0; x < ART_SIZE; x++) {
      const digit = Number(row[x]);
      pattern[y * ART_SIZE + x] = Number.isNaN(digit) ? 0 : digit;
    }
  });
  return pattern;
}
