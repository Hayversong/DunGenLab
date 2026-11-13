import { Tile } from "../core/types";
import type { Grid, Point, TileValue } from "../core/types";

export const TILE_COLORS: Record<TileValue, string> = {
  [Tile.WALL]: "#14161c",
  [Tile.FLOOR]: "#c9b48a",
  [Tile.ROOM]: "#d8c9a3",
  [Tile.CORRIDOR]: "#a89268",
};

export const HIGHLIGHT_COLOR = "#ff5d73";

export interface CanvasSize {
  width: number;
  height: number;
}

export function tileColor(tile: TileValue): string {
  return TILE_COLORS[tile];
}

// Tamanho interno do canvas, em pixels: cada tile ocupa um quadrado inteiro.
export function canvasSize(grid: Grid, tileSize: number): CanvasSize {
  if (!Number.isInteger(tileSize) || tileSize <= 0) {
    throw new RangeError("tileSize precisa ser um inteiro positivo");
  }
  return { width: grid.width * tileSize, height: grid.height * tileSize };
}

// Espaço que o mapa pode ocupar na tela, em pixels, e os limites do tile.
const SCREEN_MAX_WIDTH = 800;
const SCREEN_MAX_HEIGHT = 600;
const SCREEN_MIN_TILE = 4;
const SCREEN_MAX_TILE = 16;

// Escolhe o maior tile inteiro com que o grid cabe no espaço da tela: mapa
// grande ganha tiles menores, mapa pequeno ganha tiles maiores.
export function fitTileSize(grid: Grid): number {
  const fit = Math.floor(
    Math.min(SCREEN_MAX_WIDTH / grid.width, SCREEN_MAX_HEIGHT / grid.height),
  );
  return Math.min(SCREEN_MAX_TILE, Math.max(SCREEN_MIN_TILE, fit));
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  tileSize: number,
  highlight: readonly Point[] = [],
): void {
  const { width, height } = canvasSize(grid, tileSize);
  ctx.imageSmoothingEnabled = false;

  // Parede é o fundo: pinta tudo de uma vez e depois só o que não é parede.
  ctx.fillStyle = TILE_COLORS[Tile.WALL];
  ctx.fillRect(0, 0, width, height);

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const tile = grid.tiles[y * grid.width + x] as TileValue;
      if (tile === Tile.WALL) continue;
      ctx.fillStyle = TILE_COLORS[tile];
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  ctx.fillStyle = HIGHLIGHT_COLOR;
  for (const point of highlight) {
    ctx.fillRect(point.x * tileSize, point.y * tileSize, tileSize, tileSize);
  }
}
