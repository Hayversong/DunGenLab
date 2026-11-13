import { Tile } from "../types";
import type { GenStep, Grid, MapGenerator, Point, Rng } from "../types";

export type DrunkardsWalkParams = {
  targetFloorPercent: number;
  walkers: number;
  stepsPerYield: number;
  turnBias: number;
};

interface Walker {
  x: number;
  y: number;
  direction: Point | null;
}

const DIRECTIONS: readonly Point[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

// Teto de movimentos por tile do grid. Sem ele, um alvo de chão alto demais
// deixaria o andarilho vagando para sempre atrás dos últimos tiles.
const MAX_STEPS_PER_TILE = 20;

// A borda de 1 tile fica sempre parede.
function insideMargin(grid: Grid, x: number, y: number): boolean {
  return x >= 1 && y >= 1 && x <= grid.width - 2 && y <= grid.height - 2;
}

function chooseDirection(
  grid: Grid,
  walker: Walker,
  turnBias: number,
  rng: Rng,
): Point | null {
  const keep = walker.direction !== null && rng.chance(turnBias);
  const wanted = keep ? walker.direction : rng.pick(DIRECTIONS);
  if (wanted && insideMargin(grid, walker.x + wanted.x, walker.y + wanted.y)) {
    return wanted;
  }

  // A direção sorteada bate na margem: sorteia entre as que continuam válidas.
  const valid = DIRECTIONS.filter((d) =>
    insideMargin(grid, walker.x + d.x, walker.y + d.y),
  );
  return valid.length > 0 ? rng.pick(valid) : null;
}

function* run(
  grid: Grid,
  params: DrunkardsWalkParams,
  rng: Rng,
): Generator<GenStep, void, void> {
  grid.tiles.fill(Tile.WALL);

  const total = grid.width * grid.height;
  const interior = Math.max(0, grid.width - 2) * Math.max(0, grid.height - 2);
  const wanted = Math.ceil((total * params.targetFloorPercent) / 100);
  const target = Math.max(0, Math.min(wanted, interior));
  const walkerCount = Math.max(1, Math.floor(params.walkers));
  const stepsPerYield = Math.max(1, Math.floor(params.stepsPerYield));
  const maxSteps = total * MAX_STEPS_PER_TILE;

  const startX = Math.floor(grid.width / 2);
  const startY = Math.floor(grid.height / 2);
  const walkers: Walker[] = Array.from({ length: walkerCount }, () => ({
    x: startX,
    y: startY,
    direction: null,
  }));

  let floorCount = 0;
  let steps = 0;

  while (floorCount < target && steps < maxSteps) {
    for (const walker of walkers) {
      const index = walker.y * grid.width + walker.x;
      if (grid.tiles[index] === Tile.WALL) {
        grid.tiles[index] = Tile.FLOOR;
        floorCount++;
        if (floorCount >= target) break;
      }

      const direction = chooseDirection(grid, walker, params.turnBias, rng);
      if (direction) {
        walker.x += direction.x;
        walker.y += direction.y;
        walker.direction = direction;
      }

      steps++;
      if (steps % stepsPerYield === 0) {
        yield {
          description: `Escavando: ${floorCount} de ${target} tiles de chão`,
          highlight: walkers.map(({ x, y }) => ({ x, y })),
        };
      }
      if (steps >= maxSteps) break;
    }
  }

  yield {
    description:
      floorCount >= target
        ? `Concluído: ${floorCount} tiles de chão em ${steps} passos`
        : `Interrompido no limite de ${maxSteps} passos, com ${floorCount} de ${target} tiles de chão`,
    done: true,
  };
}

export const drunkardsWalk: MapGenerator<DrunkardsWalkParams> = {
  id: "drunkards-walk",
  name: "Drunkard's Walk",
  description:
    "Andarilhos partem do centro e andam ao acaso, abrindo chão por onde passam.",
  defaultParams: {
    targetFloorPercent: 40,
    walkers: 1,
    stepsPerYield: 5,
    turnBias: 0,
  },
  paramSchema: [
    {
      key: "targetFloorPercent",
      label: "Chão desejado (%)",
      type: "int",
      min: 10,
      max: 70,
      step: 1,
    },
    {
      key: "walkers",
      label: "Andarilhos",
      type: "int",
      min: 1,
      max: 8,
      step: 1,
    },
    {
      key: "stepsPerYield",
      label: "Movimentos por passo",
      type: "int",
      min: 1,
      max: 50,
      step: 1,
    },
    {
      key: "turnBias",
      label: "Tendência de seguir reto",
      type: "float",
      min: 0,
      max: 0.8,
      step: 0.05,
    },
  ],
  defaultSpeed: 5,
  run,
};
