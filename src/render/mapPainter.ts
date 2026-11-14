import type { Grid, Point } from "../core/types";
import { drawCells, drawGrid, drawMarkers } from "./canvasRenderer";
import type { MarkerKind } from "./canvasRenderer";
import type { TileAtlas } from "./tileAtlas";

// Tiles que precisam ser redesenhados: os que mudaram e os oito vizinhos de
// cada um, porque o desenho de um tile depende de quem está em volta.
export function dirtyCells(
  previous: Uint8Array,
  next: Uint8Array,
  width: number,
  height: number,
): Set<number> {
  const dirty = new Set<number>();
  for (let index = 0; index < next.length; index++) {
    if (previous[index] === next[index]) continue;
    const x = index % width;
    const y = (index - x) / width;
    for (let dy = -1; dy <= 1; dy++) {
      const ny = y + dy;
      if (ny < 0 || ny >= height) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        if (nx < 0 || nx >= width) continue;
        dirty.add(ny * width + nx);
      }
    }
  }
  return dirty;
}

export interface PaintInput {
  grid: Grid;
  tileSize: number;
  atlas: TileAtlas | null;
  highlight: readonly Point[];
  marker: MarkerKind;
  blinkOn: boolean;
}

export interface MapPainter {
  // Devolve quantos tiles foram redesenhados.
  paint(ctx: CanvasRenderingContext2D, input: PaintInput): number;
  // Esquece o que já foi desenhado: o próximo paint refaz o mapa todo.
  reset(): void;
}

interface Painted {
  tiles: Uint8Array;
  width: number;
  height: number;
  tileSize: number;
  atlas: TileAtlas | null;
  // Tiles com marcador por cima, que precisam ser limpos no próximo quadro.
  marked: number[];
}

// Lembra o que está no canvas e, a cada quadro, redesenha só a diferença.
// Em um mapa de 160 x 90 isso troca 14.400 tiles por uns poucos.
export function createMapPainter(): MapPainter {
  let painted: Painted | null = null;

  return {
    reset() {
      painted = null;
    },

    paint(ctx, input) {
      const { grid, tileSize, atlas } = input;
      let count: number;

      if (
        !painted ||
        painted.width !== grid.width ||
        painted.height !== grid.height ||
        painted.tileSize !== tileSize ||
        painted.atlas !== atlas
      ) {
        drawGrid(ctx, grid, tileSize, atlas);
        count = grid.tiles.length;
        painted = {
          tiles: grid.tiles.slice(),
          width: grid.width,
          height: grid.height,
          tileSize,
          atlas,
          marked: [],
        };
      } else {
        const dirty = dirtyCells(
          painted.tiles,
          grid.tiles,
          grid.width,
          grid.height,
        );
        for (const index of painted.marked) dirty.add(index);
        drawCells(ctx, grid, tileSize, atlas, dirty);
        count = dirty.size;
        painted.tiles.set(grid.tiles);
      }

      const visible = input.highlight.filter(
        (point) =>
          point.x >= 0 &&
          point.y >= 0 &&
          point.x < grid.width &&
          point.y < grid.height,
      );
      drawMarkers(ctx, tileSize, atlas, visible, input.marker, input.blinkOn);
      painted.marked = visible.map((point) => point.y * grid.width + point.x);
      return count;
    },
  };
}
