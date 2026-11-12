export const Tile = {
  WALL: 0,
  FLOOR: 1,
  ROOM: 2,
  CORRIDOR: 3,
} as const;

export type TileValue = (typeof Tile)[keyof typeof Tile];

export interface Point {
  x: number;
  y: number;
}

export interface Grid {
  width: number;
  height: number;
  // Uma linha depois da outra: o tile (x, y) fica em y * width + x.
  tiles: Uint8Array;
}

// Os geradores devolvem isto a cada passo, em vez de uma cópia do grid.
export interface GenStep {
  description?: string;
  highlight?: Point[];
  done?: boolean;
}

export interface Rng {
  // Número em [0, 1).
  next(): number;
  int(minInclusive: number, maxExclusive: number): number;
  // true com probabilidade p.
  chance(p: number): boolean;
  pick<T>(arr: readonly T[]): T;
}
