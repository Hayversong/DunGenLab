// Tamanho do mapa, em tiles: o padrão e os limites aceitos, tanto nos
// controles da tela quanto em arquivos importados. O teto existe porque um
// grid gigante travaria a página.
export const DEFAULT_MAP_WIDTH = 80;
export const DEFAULT_MAP_HEIGHT = 50;
export const MIN_MAP_WIDTH = 20;
export const MIN_MAP_HEIGHT = 20;
export const MAX_MAP_WIDTH = 200;
export const MAX_MAP_HEIGHT = 120;

// Tamanho máximo dos textos que vêm de fora (campo da tela ou arquivo
// importado). Um texto enorme estouraria a interface e o nome do arquivo.
export const MAX_SEED_LENGTH = 40;
export const MAX_GENERATOR_ID_LENGTH = 40;
