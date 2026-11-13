import { Tile } from "./types";
import type { Grid } from "./types";

export interface MapMetrics {
  // Tiles que não são parede, em % do total do grid.
  floorPercent: number;
  regionCount: number;
  // Tamanho da maior região, em % do total de chão.
  largestRegionPercent: number;
}

// Devolve o tamanho de cada grupo de tiles que passam em `belongs` e estão
// ligados por cima, baixo, esquerda ou direita. Diagonal não liga, porque quem
// anda pelo mapa não atravessa a quina entre duas paredes.
function groupSizes(grid: Grid, belongs: (tile: number) => boolean): number[] {
  const { width, tiles } = grid;
  const visited = new Uint8Array(tiles.length);
  const sizes: number[] = [];
  // Fila de índices a examinar. Uma busca recursiva empilharia uma chamada
  // por tile e estouraria a pilha em regiões grandes; a fila não tem limite.
  const queue: number[] = [];

  function enqueue(index: number): void {
    if (visited[index] || !belongs(tiles[index] as number)) return;
    // Marca ao entrar na fila, e não ao sair: assim nenhum tile entra duas
    // vezes.
    visited[index] = 1;
    queue.push(index);
  }

  for (let start = 0; start < tiles.length; start++) {
    if (visited[start] || !belongs(tiles[start] as number)) continue;

    queue.length = 0;
    enqueue(start);
    // `head` anda pela fila em vez de remover o primeiro item, que custaria
    // deslocar todos os outros a cada retirada.
    for (let head = 0; head < queue.length; head++) {
      const index = queue[head] as number;
      const x = index % width;
      if (index >= width) enqueue(index - width);
      if (x < width - 1) enqueue(index + 1);
      if (index < tiles.length - width) enqueue(index + width);
      if (x > 0) enqueue(index - 1);
    }
    sizes.push(queue.length);
  }

  return sizes;
}

// Tamanho de cada região: grupo de tiles caminháveis (tudo que não é parede).
export function regionSizes(grid: Grid): number[] {
  return groupSizes(grid, (tile) => tile !== Tile.WALL);
}

// Conta as salas olhando só para o grid: cada grupo de tiles de sala é uma.
// Serve para mapas que chegam prontos, sem o contador que o BSP mantém
// enquanto gera. Corredores têm outro valor de tile, então não juntam salas.
export function countRooms(grid: Grid): number {
  return groupSizes(grid, (tile) => tile === Tile.ROOM).length;
}

export function computeMetrics(grid: Grid): MapMetrics {
  const sizes = regionSizes(grid);
  let floor = 0;
  let largest = 0;
  for (const size of sizes) {
    floor += size;
    if (size > largest) largest = size;
  }

  return {
    floorPercent: (floor / grid.tiles.length) * 100,
    regionCount: sizes.length,
    largestRegionPercent: floor === 0 ? 0 : (largest / floor) * 100,
  };
}
