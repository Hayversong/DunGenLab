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
