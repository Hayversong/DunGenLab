// Lado do tile base da arte, em pixels. O zoom manual é um múltiplo dele.
export const BASE_TILE = 8;

// Maior tile que a tela usa, em pixels do aparelho.
export const MAX_TILE = 64;

export const ZOOM_LEVELS = [1, 2, 3] as const;
export type ZoomLevel = (typeof ZOOM_LEVELS)[number];
// "fit" ajusta o mapa ao espaço livre; um número fixa o tamanho do tile.
export type Zoom = "fit" | ZoomLevel;

export interface Area {
  width: number;
  height: number;
}

// Maior tile INTEIRO com que uma grade de cols x rows cabe na área. Tile
// inteiro mantém todos os quadrados do mesmo tamanho: com 12,5 px, uns
// sairiam com 12 e outros com 13, e a textura ficaria torta.
// Nunca devolve menos que 1: se a área for menor que a grade, o mapa passa
// do espaço e quem chama decide o que fazer (rolar ou cortar).
export function fitTileSize(
  areaWidth: number,
  areaHeight: number,
  cols: number,
  rows: number,
  max: number = MAX_TILE,
): number {
  if (!(cols > 0) || !(rows > 0)) return 1;
  const fit = Math.floor(Math.min(areaWidth / cols, areaHeight / rows));
  // Área ainda não medida (0) ou valor inválido (NaN) caem aqui.
  if (!Number.isFinite(fit) || fit < 1) return 1;
  return Math.min(Math.max(1, Math.floor(max)), fit);
}

// Tamanho do tile em pixels do aparelho. A área chega em pixels de CSS;
// pixelRatio diz quantos pixels do aparelho cabem em um pixel de CSS (2 ou 3
// em celulares). Calcular na unidade do aparelho mantém cada tile com um
// número inteiro de pixels de verdade.
export function tileSizeFor(
  zoom: Zoom,
  area: Area,
  cols: number,
  rows: number,
  pixelRatio: number = 1,
): number {
  const ratio = Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1;
  if (zoom === "fit") {
    return fitTileSize(
      Math.floor(area.width * ratio),
      Math.floor(area.height * ratio),
      cols,
      rows,
    );
  }
  return Math.max(1, Math.round(BASE_TILE * zoom * ratio));
}
