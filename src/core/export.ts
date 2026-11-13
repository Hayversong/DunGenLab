import { MAX_MAP_HEIGHT, MAX_MAP_WIDTH } from "./constants";
import { createGrid } from "./grid";
import type { GenParams, Grid } from "./types";

// Versão do formato do arquivo. Sobe quando o formato mudar de um jeito que
// arquivos antigos precisem de tratamento diferente.
export const EXPORT_VERSION = 1;

// O que acompanha o grid no arquivo: como o mapa foi gerado.
export interface MapMeta {
  generator: string;
  seed: string;
  params: GenParams;
}

export interface ImportedMap {
  grid: Grid;
  meta: MapMeta;
}

export function toJSON(grid: Grid, meta: MapMeta): string {
  return JSON.stringify(
    {
      version: EXPORT_VERSION,
      generator: meta.generator,
      seed: meta.seed,
      params: meta.params,
      width: grid.width,
      height: grid.height,
      // Um dígito por tile, linha após linha.
      tiles: Array.from(grid.tiles).join(""),
    },
    null,
    2,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readDimension(value: unknown, name: string, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`O campo "${name}" precisa ser um número inteiro.`);
  }
  if (value < 1 || value > max) {
    throw new Error(
      `O campo "${name}" vale ${value}, mas precisa ficar entre 1 e ${max}.`,
    );
  }
  return value;
}

function readParams(value: unknown): GenParams {
  if (!isRecord(value)) {
    throw new Error('O campo "params" precisa ser um objeto.');
  }
  const params: GenParams = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item !== "number" || !Number.isFinite(item)) {
      throw new Error(`O parâmetro "${key}" precisa ser um número.`);
    }
    params[key] = item;
  }
  return params;
}

// Lê um arquivo exportado. O texto vem de fora do programa, então cada campo
// é conferido antes de ser usado; qualquer problema vira um Error com uma
// mensagem que pode ser mostrada ao usuário.
export function fromJSON(text: string): ImportedMap {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("O arquivo não é um JSON válido.");
  }
  if (!isRecord(data)) {
    throw new Error("O arquivo não tem o formato de um mapa do DunGenLab.");
  }

  if (data.version !== EXPORT_VERSION) {
    throw new Error(
      typeof data.version === "number"
        ? `Versão ${data.version} do formato não é suportada (esperada: ${EXPORT_VERSION}).`
        : 'O arquivo não informa a versão do formato (campo "version").',
    );
  }

  if (typeof data.generator !== "string" || data.generator === "") {
    throw new Error('O campo "generator" precisa ser um texto.');
  }
  if (typeof data.seed !== "string") {
    throw new Error('O campo "seed" precisa ser um texto.');
  }
  const params = readParams(data.params);

  const width = readDimension(data.width, "width", MAX_MAP_WIDTH);
  const height = readDimension(data.height, "height", MAX_MAP_HEIGHT);

  const tiles = data.tiles;
  if (typeof tiles !== "string") {
    throw new Error('O campo "tiles" precisa ser um texto de dígitos.');
  }
  if (tiles.length !== width * height) {
    throw new Error(
      `O mapa diz ter ${width} x ${height} = ${width * height} tiles, mas o campo "tiles" tem ${tiles.length}.`,
    );
  }

  const grid = createGrid(width, height);
  for (let i = 0; i < tiles.length; i++) {
    // "0" é o código 48; subtraindo, "0".."3" viram 0..3.
    const value = tiles.charCodeAt(i) - 48;
    if (value < 0 || value > 3) {
      throw new Error(
        `O campo "tiles" tem um caractere inválido ("${tiles[i]}") na posição ${i + 1}; só são aceitos dígitos de 0 a 3.`,
      );
    }
    grid.tiles[i] = value;
  }

  return { grid, meta: { generator: data.generator, seed: data.seed, params } };
}

// Nome do arquivo baixado. A seed é texto livre, então o que não for letra,
// número, hífen ou sublinhado vira hífen: barras e pontos confundiriam o
// sistema de arquivos.
export function exportFileName(seed: string, extension: string): string {
  const safe = seed
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return `mapa-${safe === "" ? "sem-seed" : safe}.${extension}`;
}
