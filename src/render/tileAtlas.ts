import {
  ART_KINDS,
  ART_PALETTES,
  ART_SIZE,
  HERO_FRAMES,
  HERO_PALETTE,
  VARIANTS,
  heroPattern,
  tilePattern,
} from "./tileArt";

// Uma imagem só, com todos os tiles lado a lado: uma linha por tipo, uma
// coluna por variação. Desenhar o mapa vira copiar pedaços dela.
export interface TileAtlas {
  image: HTMLCanvasElement;
  tileSize: number;
  // Linha do atlas em que fica o marcador do andarilho.
  heroRow: number;
}

// Abaixo deste tamanho a textura vira ruído: o mapa usa cor chapada.
export const MIN_TEXTURE_TILE = 6;

function createCanvas(): HTMLCanvasElement {
  return document.createElement("canvas");
}

// Amplia a arte de 8 x 8 para o tamanho do tile, pixel a pixel. Cada pixel
// de arte vira um retângulo de bordas inteiras, sem suavização.
function paintPattern(
  ctx: CanvasRenderingContext2D,
  pattern: Uint8Array,
  palette: readonly string[],
  left: number,
  top: number,
  tileSize: number,
): void {
  for (let y = 0; y < ART_SIZE; y++) {
    const y0 = Math.floor((y * tileSize) / ART_SIZE);
    const y1 = Math.floor(((y + 1) * tileSize) / ART_SIZE);
    for (let x = 0; x < ART_SIZE; x++) {
      const color = palette[pattern[y * ART_SIZE + x] ?? 0];
      // Cor vazia é pixel transparente.
      if (!color) continue;
      const x0 = Math.floor((x * tileSize) / ART_SIZE);
      const x1 = Math.floor(((x + 1) * tileSize) / ART_SIZE);
      ctx.fillStyle = color;
      ctx.fillRect(left + x0, top + y0, x1 - x0, y1 - y0);
    }
  }
}

// Desenha o atlas uma vez, em um canvas que nunca aparece na tela. Quem
// testa sem navegador passa a própria fábrica de canvas.
export function createTileAtlas(
  tileSize: number,
  makeSurface: () => HTMLCanvasElement = createCanvas,
): TileAtlas | null {
  if (!Number.isInteger(tileSize) || tileSize < MIN_TEXTURE_TILE) return null;

  const image = makeSurface();
  const heroRow = ART_KINDS.length;
  image.width = Math.max(VARIANTS, HERO_FRAMES.length) * tileSize;
  image.height = (heroRow + 1) * tileSize;
  const ctx = image.getContext("2d");
  if (!ctx) return null;

  for (const kind of ART_KINDS) {
    for (let variant = 0; variant < VARIANTS; variant++) {
      paintPattern(
        ctx,
        tilePattern(kind, variant),
        ART_PALETTES[kind],
        variant * tileSize,
        kind * tileSize,
        tileSize,
      );
    }
  }
  HERO_FRAMES.forEach((_, frame) => {
    paintPattern(
      ctx,
      heroPattern(frame),
      HERO_PALETTE,
      frame * tileSize,
      heroRow * tileSize,
      tileSize,
    );
  });

  return { image, tileSize, heroRow };
}
