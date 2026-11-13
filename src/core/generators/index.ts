import type { MapGenerator } from "../types";
import { cellularAutomata } from "./cellularAutomata";
import { drunkardsWalk } from "./drunkardsWalk";

export const generators: readonly MapGenerator[] = [
  drunkardsWalk,
  cellularAutomata,
];

export function getGenerator(id: string): MapGenerator | undefined {
  return generators.find((generator) => generator.id === id);
}
