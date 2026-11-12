import { Tile } from "./types";
import type { Grid, TileValue } from "./types";

export function createGrid(
  width: number,
  height: number,
  fill: TileValue = Tile.WALL,
): Grid {
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new RangeError("As dimensões do grid precisam ser inteiras");
  }
  if (width <= 0 || height <= 0) {
    throw new RangeError("As dimensões do grid precisam ser positivas");
  }
  return { width, height, tiles: new Uint8Array(width * height).fill(fill) };
}

export function inBounds(grid: Grid, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < grid.width && y < grid.height;
}

// Fora do grid tudo conta como parede, assim quem chama não precisa
// checar os limites antes de olhar um vizinho.
export function getTile(grid: Grid, x: number, y: number): TileValue {
  if (!inBounds(grid, x, y)) return Tile.WALL;
  return grid.tiles[y * grid.width + x] as TileValue;
}

export function setTile(
  grid: Grid,
  x: number,
  y: number,
  value: TileValue,
): void {
  if (!inBounds(grid, x, y)) return;
  grid.tiles[y * grid.width + x] = value;
}

export function cloneGrid(grid: Grid): Grid {
  return {
    width: grid.width,
    height: grid.height,
    tiles: grid.tiles.slice(),
  };
}

export function countTiles(
  grid: Grid,
  predicate: (tile: TileValue) => boolean,
): number {
  let count = 0;
  for (const tile of grid.tiles) {
    if (predicate(tile as TileValue)) count++;
  }
  return count;
}
