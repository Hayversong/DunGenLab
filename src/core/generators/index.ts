import type { MapGenerator } from "../types";
import { bsp } from "./bsp";
import { cellularAutomata } from "./cellularAutomata";
import { drunkardsWalk } from "./drunkardsWalk";

export const generators: readonly MapGenerator[] = [
  drunkardsWalk,
  cellularAutomata,
  bsp,
];

export function getGenerator(id: string): MapGenerator | undefined {
  return generators.find((generator) => generator.id === id);
}
