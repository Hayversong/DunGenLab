import type { MapGenerator } from "../types";

export const generators: readonly MapGenerator[] = [];

export function getGenerator(id: string): MapGenerator | undefined {
  return generators.find((generator) => generator.id === id);
}
