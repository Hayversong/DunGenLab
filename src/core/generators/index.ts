import type { MapGenerator } from "../types";
import { drunkardsWalk } from "./drunkardsWalk";

export const generators: readonly MapGenerator[] = [drunkardsWalk];

export function getGenerator(id: string): MapGenerator | undefined {
  return generators.find((generator) => generator.id === id);
}
