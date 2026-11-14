import type { TileAtlas } from "../src/render/tileAtlas";

export interface FillCall {
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ImageCall {
  sx: number;
  sy: number;
  dx: number;
  dy: number;
  size: number;
}

// Contexto falso que só anota as chamadas, para testar sem navegador.
export function createFakeContext() {
  const fills: FillCall[] = [];
  const images: ImageCall[] = [];
  const fake = {
    fillStyle: "",
    imageSmoothingEnabled: true,
    fillRect(x: number, y: number, w: number, h: number) {
      fills.push({ color: fake.fillStyle, x, y, w, h });
    },
    drawImage(
      _image: unknown,
      sx: number,
      sy: number,
      size: number,
      _sh: number,
      dx: number,
      dy: number,
    ) {
      images.push({ sx, sy, dx, dy, size });
    },
  };
  return {
    ctx: fake as unknown as CanvasRenderingContext2D,
    fake,
    fills,
    images,
    clear() {
      fills.length = 0;
      images.length = 0;
    },
  };
}

// Canvas falso para a fábrica do atlas.
export function createFakeSurface() {
  const { ctx, fills } = createFakeContext();
  const surface = { width: 0, height: 0, getContext: () => ctx };
  return { surface: surface as unknown as HTMLCanvasElement, fills };
}

// Atlas sem imagem de verdade: basta para conferir de onde o renderer copia.
export function fakeAtlas(tileSize: number): TileAtlas {
  return {
    image: {} as unknown as HTMLCanvasElement,
    tileSize,
    heroRow: 6,
  };
}
