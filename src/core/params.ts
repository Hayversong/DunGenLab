import type { GenParams, MapGenerator } from "./types";

// Devolve os parâmetros dentro do que o algoritmo declara no paramSchema:
// usa o padrão para o que faltar ou não for número, descarta o que sobrar,
// prende cada valor na sua faixa e arredonda os que são inteiros. É a última
// barreira antes do gerador, venha o valor da tela ou de um arquivo.
export function clampParams(
  generator: MapGenerator,
  params: GenParams,
): GenParams {
  const result: GenParams = {};
  for (const def of generator.paramSchema) {
    const fallback = generator.defaultParams[def.key] ?? def.min;
    const raw = params[def.key];
    const value =
      typeof raw === "number" && !Number.isNaN(raw) ? raw : fallback;
    const clamped = Math.min(def.max, Math.max(def.min, value));
    result[def.key] = def.type === "int" ? Math.round(clamped) : clamped;
  }
  return result;
}
