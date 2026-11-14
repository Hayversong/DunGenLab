import { Tile } from "../core/types";
import type { Grid, Point, TileValue } from "../core/types";
import { Edge, wallArt, wallEdges } from "./autoTile";
import {
  ART_PALETTES,
  CURSOR_COLORS,
  HERO_FRAMES,
  TileArt,
  VARIANTS,
  WALL_EDGE_COLOR,
  WALL_SHADOW_COLOR,
} from "./tileArt";
import type { TileArtKind } from "./tileArt";
import type { TileAtlas } from "./tileAtlas";
import { tileVariant } from "./tileHash";

// Cores usadas quando o tile é pequeno demais para ter textura.
export const TILE_COLORS: Record<TileValue, string> = {
  [Tile.WALL]: ART_PALETTES[TileArt.VOID][1] ?? "",
  [Tile.FLOOR]: ART_PALETTES[TileArt.FLOOR][0] ?? "",
  [Tile.ROOM]: ART_PALETTES[TileArt.ROOM][0] ?? "",
  [Tile.CORRIDOR]: ART_PALETTES[TileArt.CORRIDOR][0] ?? "",
};

const FLOOR_ART: Record<TileValue, TileArtKind> = {
  [Tile.WALL]: TileArt.VOID,
  [Tile.FLOOR]: TileArt.FLOOR,
  [Tile.ROOM]: TileArt.ROOM,
  [Tile.CORRIDOR]: TileArt.CORRIDOR,
};

// "cursor" é a moldura que pisca; "hero" é o bonequinho do andarilho.
export type MarkerKind = "cursor" | "hero";

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

// O atlas só serve se foi feito para este tamanho de tile.
function usable(atlas: TileAtlas | null, tileSize: number): TileAtlas | null {
  return atlas && atlas.tileSize === tileSize ? atlas : null;
}

// Espessura de um "pixel de arte" na tela.
function artUnit(tileSize: number): number {
  return Math.max(1, Math.floor(tileSize / 8));
}

function isWall(grid: Grid, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return true;
  return grid.tiles[y * grid.width + x] === Tile.WALL;
}

// Desenha um tile. O resultado depende dos oito vizinhos (a parede muda de
// arte e o chão ganha sombra), e de mais nada.
export function drawCell(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  tileSize: number,
  atlas: TileAtlas | null,
  x: number,
  y: number,
): void {
  const tile = grid.tiles[y * grid.width + x] as TileValue;
  const left = x * tileSize;
  const top = y * tileSize;
  const textured = usable(atlas, tileSize);

  if (!textured) {
    ctx.fillStyle = TILE_COLORS[tile];
    ctx.fillRect(left, top, tileSize, tileSize);
    return;
  }

  const wall = tile === Tile.WALL;
  const kind = wall ? wallArt(grid, x, y) : FLOOR_ART[tile];
  ctx.drawImage(
    textured.image,
    tileVariant(x, y, VARIANTS) * tileSize,
    kind * tileSize,
    tileSize,
    tileSize,
    left,
    top,
    tileSize,
    tileSize,
  );

  const unit = artUnit(tileSize);
  if (wall) {
    // Contorno claro nos lados da parede que dão para o chão. O lado de
    // baixo não precisa: ali a arte já é a parede vista de frente.
    const edges = wallEdges(grid, x, y);
    if (edges === 0) return;
    ctx.fillStyle = WALL_EDGE_COLOR;
    if (edges & Edge.N) ctx.fillRect(left, top, tileSize, unit);
    if (edges & Edge.W) ctx.fillRect(left, top, unit, tileSize);
    if (edges & Edge.E) {
      ctx.fillRect(left + tileSize - unit, top, unit, tileSize);
    }
    return;
  }

  // Sombra da parede sobre o chão: mais larga embaixo dela, fina ao lado.
  const wallAbove = isWall(grid, x, y - 1);
  const wallLeft = isWall(grid, x - 1, y);
  if (!wallAbove && !wallLeft) return;
  ctx.fillStyle = WALL_SHADOW_COLOR;
  if (wallAbove) ctx.fillRect(left, top, tileSize, unit * 2);
  if (wallLeft) ctx.fillRect(left, top, unit, tileSize);
}

// Desenha o mapa inteiro.
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  tileSize: number,
  atlas: TileAtlas | null = null,
): void {
  const { width, height } = canvasSize(grid, tileSize);
  ctx.imageSmoothingEnabled = false;

  if (!usable(atlas, tileSize)) {
    // Parede é o fundo: pinta tudo de uma vez e depois só o que não é.
    ctx.fillStyle = TILE_COLORS[Tile.WALL];
    ctx.fillRect(0, 0, width, height);
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (grid.tiles[y * grid.width + x] === Tile.WALL) continue;
        drawCell(ctx, grid, tileSize, null, x, y);
      }
    }
    return;
  }

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      drawCell(ctx, grid, tileSize, atlas, x, y);
    }
  }
}

// Redesenha só os tiles pedidos, dados pela posição no array do grid.
export function drawCells(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  tileSize: number,
  atlas: TileAtlas | null,
  indices: Iterable<number>,
): void {
  ctx.imageSmoothingEnabled = false;
  for (const index of indices) {
    const x = index % grid.width;
    drawCell(ctx, grid, tileSize, atlas, x, (index - x) / grid.width);
  }
}

// Marca os tiles do passo atual, por cima do mapa. `blinkOn` alterna a cada
// piscada: troca a cor do cursor e o quadro do bonequinho.
export function drawMarkers(
  ctx: CanvasRenderingContext2D,
  tileSize: number,
  atlas: TileAtlas | null,
  points: readonly Point[],
  kind: MarkerKind,
  blinkOn: boolean,
): void {
  if (points.length === 0) return;
  const textured = usable(atlas, tileSize);
  const unit = artUnit(tileSize);
  const inner = tileSize - unit * 2;
  ctx.fillStyle = CURSOR_COLORS[blinkOn ? 0 : 1];

  for (const point of points) {
    const left = point.x * tileSize;
    const top = point.y * tileSize;

    if (kind === "hero" && textured) {
      const frame = (blinkOn ? 0 : 1) % HERO_FRAMES.length;
      ctx.drawImage(
        textured.image,
        frame * tileSize,
        textured.heroRow * tileSize,
        tileSize,
        tileSize,
        left,
        top,
        tileSize,
        tileSize,
      );
      continue;
    }

    if (!textured || inner <= 0) {
      ctx.fillRect(left, top, tileSize, tileSize);
      continue;
    }
    // Moldura oca: quatro barras, para o tile continuar visível no meio.
    ctx.fillRect(left, top, tileSize, unit);
    ctx.fillRect(left, top + tileSize - unit, tileSize, unit);
    ctx.fillRect(left, top + unit, unit, inner);
    ctx.fillRect(left + tileSize - unit, top + unit, unit, inner);
  }
}
