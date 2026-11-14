import { Tile } from "../core/types";
import type { Grid } from "../core/types";
import { TileArt } from "./tileArt";
import type { TileArtKind } from "./tileArt";

// Um bit para cada lado. Somados, dizem de uma vez quais vizinhos são chão.
export const Edge = { N: 1, E: 2, S: 4, W: 8 } as const;

// Fora do mapa conta como parede.
function isOpen(grid: Grid, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return false;
  return grid.tiles[y * grid.width + x] !== Tile.WALL;
}

// Máscara dos quatro vizinhos que são chão. É a base do "auto-tiling": o
// desenho de uma parede depende do que há em volta dela.
export function wallEdges(grid: Grid, x: number, y: number): number {
  let mask = 0;
  if (isOpen(grid, x, y - 1)) mask |= Edge.N;
  if (isOpen(grid, x + 1, y)) mask |= Edge.E;
  if (isOpen(grid, x, y + 1)) mask |= Edge.S;
  if (isOpen(grid, x - 1, y)) mask |= Edge.W;
  return mask;
}

function touchesFloorDiagonally(grid: Grid, x: number, y: number): boolean {
  return (
    isOpen(grid, x - 1, y - 1) ||
    isOpen(grid, x + 1, y - 1) ||
    isOpen(grid, x - 1, y + 1) ||
    isOpen(grid, x + 1, y + 1)
  );
}

// Qual arte usar em uma parede. Com chão logo abaixo, a parede é vista de
// frente (tijolos); encostada no chão por outro lado, mostra o topo; longe
// de tudo, é rocha escura.
export function wallArt(grid: Grid, x: number, y: number): TileArtKind {
  const edges = wallEdges(grid, x, y);
  if (edges & Edge.S) return TileArt.WALL_FACE;
  if (edges !== 0 || touchesFloorDiagonally(grid, x, y)) {
    return TileArt.WALL_TOP;
  }
  return TileArt.VOID;
}
