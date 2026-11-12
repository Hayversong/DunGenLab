import { useRef, useState } from "react";
import { MapCanvas } from "./components/MapCanvas";
import { createGrid, setTile } from "./core/grid";
import { Tile } from "./core/types";
import type { Grid, Point } from "./core/types";
import styles from "./App.module.css";

const GRID_WIDTH = 80;
const GRID_HEIGHT = 50;
const TILE_SIZE = 10;

const ALGORITHMS = ["Drunkard's Walk", "Cellular Automata", "BSP"];

// Grid de teste até os geradores existirem: xadrez de chão e parede.
function createCheckerboard(width: number, height: number): Grid {
  const grid = createGrid(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((x + y) % 2 === 0) setTile(grid, x, y, Tile.FLOOR);
    }
  }
  return grid;
}

// Os quatro cantos, para conferir que o canvas tem o tamanho certo.
const CORNERS: Point[] = [
  { x: 0, y: 0 },
  { x: GRID_WIDTH - 1, y: 0 },
  { x: 0, y: GRID_HEIGHT - 1 },
  { x: GRID_WIDTH - 1, y: GRID_HEIGHT - 1 },
];

function App() {
  const gridRef = useRef<Grid | null>(null);
  if (gridRef.current === null) {
    gridRef.current = createCheckerboard(GRID_WIDTH, GRID_HEIGHT);
  }
  const [version] = useState(0);
  const [seed, setSeed] = useState("gato-preto");

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>DunGenLab</h1>
        <p>Geração procedural de masmorras, passo a passo</p>
      </header>

      <main className={styles.layout}>
        <section className={styles.stage} aria-label="Mapa">
          <MapCanvas
            gridRef={gridRef}
            tileSize={TILE_SIZE}
            highlight={CORNERS}
            version={version}
          />
        </section>

        <aside className={styles.panel} aria-label="Controles">
          <div className={styles.field}>
            <label htmlFor="algorithm">Algoritmo</label>
            <select id="algorithm" disabled>
              {ALGORITHMS.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="seed">Seed</label>
            <input
              id="seed"
              type="text"
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          <section className={styles.metrics} aria-labelledby="metrics-title">
            <h2 id="metrics-title">Métricas</h2>
            <p className={styles.empty}>
              As métricas aparecem ao fim da geração.
            </p>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default App;
