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

// Descreve um parâmetro numérico para a interface montar o campo sozinha.
export interface ParamDef {
  key: string;
  label: string;
  type: "int" | "float";
  min: number;
  max: number;
  step: number;
}

export type GenParams = Record<string, number>;

export interface MapGenerator<P extends GenParams = GenParams> {
  id: string;
  name: string;
  description: string;
  defaultParams: P;
  paramSchema: ParamDef[];
  // Passos por quadro sugeridos para a animação. Abaixo de 1 significa um
  // passo a cada vários quadros, para algoritmos com poucos passos.
  defaultSpeed: number;
  // Muta o grid recebido e devolve um passo leve a cada yield.
  run(grid: Grid, params: P, rng: Rng): Generator<GenStep, void, void>;
}
