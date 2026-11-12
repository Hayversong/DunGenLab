import { useState } from "react";
import { ControlPanel } from "./components/ControlPanel";
import { MapCanvas } from "./components/MapCanvas";
import { PlaybackBar } from "./components/PlaybackBar";
import { generators, getGenerator } from "./core/generators";
import type { GenParams, MapGenerator } from "./core/types";
import { useGeneration } from "./hooks/useGeneration";
import type { GenerationStatus } from "./hooks/useGeneration";
import styles from "./App.module.css";

const GRID_WIDTH = 80;
const GRID_HEIGHT = 50;
const TILE_SIZE = 10;

const DEFAULT_GENERATOR = generators[0] as MapGenerator;

const STATUS_TEXT: Record<GenerationStatus, string> = {
  idle: "Clique em Gerar para começar.",
  running: "Gerando…",
  paused: "Em pausa.",
  done: "Concluído.",
};

// Única fonte de acaso fora do Rng: só escolhe um texto de seed novo.
function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

function App() {
  const [generator, setGenerator] = useState(DEFAULT_GENERATOR);
  const [params, setParams] = useState<GenParams>(
    DEFAULT_GENERATOR.defaultParams,
  );
  const [seed, setSeed] = useState("gato-preto");
  const generation = useGeneration(GRID_WIDTH, GRID_HEIGHT);

  function handleGeneratorChange(id: string) {
    const next = getGenerator(id);
    if (!next) return;
    generation.reset();
    setGenerator(next);
    setParams(next.defaultParams);
  }

  function handleParamChange(key: string, value: number) {
    setParams((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>DunGenLab</h1>
        <p>Geração procedural de masmorras, passo a passo</p>
      </header>

      <main className={styles.layout}>
        <section className={styles.stage} aria-label="Mapa">
          <MapCanvas
            gridRef={generation.gridRef}
            tileSize={TILE_SIZE}
            highlight={generation.lastStep?.highlight}
            version={generation.version}
          />
          <p className={styles.stepText} role="status">
            {generation.lastStep?.description ?? STATUS_TEXT[generation.status]}
          </p>
          <PlaybackBar
            status={generation.status}
            speed={generation.speed}
            onGenerate={() => generation.start({ generator, params, seed })}
            onPause={generation.pause}
            onResume={generation.resume}
            onStep={generation.step}
            onFinish={generation.finish}
            onReset={generation.reset}
            onSpeedChange={generation.setSpeed}
          />
        </section>

        <aside className={styles.panel} aria-label="Controles">
          <ControlPanel
            generators={generators}
            generator={generator}
            params={params}
            seed={seed}
            onGeneratorChange={handleGeneratorChange}
            onParamChange={handleParamChange}
            onSeedChange={setSeed}
            onRandomSeed={() => setSeed(randomSeed())}
          />

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
