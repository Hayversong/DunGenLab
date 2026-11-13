import type { Grid } from "../core/types";
import { canvasSize, drawGrid } from "./canvasRenderer";

// Tamanhos de tile oferecidos na exportação, em pixels.
export const PNG_TILE_SIZES = [4, 8, 16] as const;
export type PngTileSize = (typeof PNG_TILE_SIZES)[number];

// Desenha o grid em um canvas à parte, que nunca aparece na tela, e devolve
// a imagem como PNG. Assim o tamanho exportado não depende do canvas visível
// e o destaque do passo atual fica de fora.
export function renderPngBlob(
  grid: Grid,
  tileSize: PngTileSize,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const size = canvasSize(grid, tileSize);
  canvas.width = size.width;
  canvas.height = size.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.reject(new Error("Não foi possível criar a imagem."));
  }
  drawGrid(ctx, grid, tileSize);

  // toBlob entrega o resultado por callback; a Promise deixa usar await.
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Não foi possível criar a imagem."));
    }, "image/png");
  });
}
