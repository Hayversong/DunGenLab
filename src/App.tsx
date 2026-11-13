import { useState } from "react";
import { ControlPanel } from "./components/ControlPanel";
import { ExportPanel } from "./components/ExportPanel";
import { MapCanvas } from "./components/MapCanvas";
import { MetricsPanel } from "./components/MetricsPanel";
import { PlaybackBar } from "./components/PlaybackBar";
import { exportFileName, fromJSON, toJSON } from "./core/export";
import { generators, getGenerator } from "./core/generators";
import type { GenParams, MapGenerator } from "./core/types";
import { useGeneration } from "./hooks/useGeneration";
import type { GenerationStatus } from "./hooks/useGeneration";
import { downloadBlob } from "./render/download";
import { renderPngBlob } from "./render/pngExport";
import type { PngTileSize } from "./render/pngExport";
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Algo deu errado.";
}

// Um mapa do maior tamanho aceito cabe com muita folga neste limite.
const MAX_IMPORT_BYTES = 1024 * 1024;

// Ajusta os parâmetros de um arquivo ao que o algoritmo declara: usa o padrão
// para o que faltar, descarta o que sobrar e prende cada valor na sua faixa.
function fitParams(generator: MapGenerator, imported: GenParams): GenParams {
  const params: GenParams = {};
  for (const def of generator.paramSchema) {
    const value = imported[def.key] ?? generator.defaultParams[def.key] ?? 0;
    params[def.key] = Math.min(def.max, Math.max(def.min, value));
  }
  return params;
}

function App() {
  const [generator, setGenerator] = useState(DEFAULT_GENERATOR);
  const [params, setParams] = useState<GenParams>(
    DEFAULT_GENERATOR.defaultParams,
  );
  const [seed, setSeed] = useState("gato-preto");
  const generation = useGeneration(
    GRID_WIDTH,
    GRID_HEIGHT,
    DEFAULT_GENERATOR.defaultSpeed,
  );

  const [exportError, setExportError] = useState<string | null>(null);

  // Só há o que exportar com um mapa completo na tela.
  const exportable = generation.status === "done" ? generation.meta : null;

  function handleGeneratorChange(id: string) {
    const next = getGenerator(id);
    if (!next) return;
    generation.reset();
    setGenerator(next);
    setParams(next.defaultParams);
    generation.setSpeed(next.defaultSpeed);
  }

  function handleParamChange(key: string, value: number) {
    setParams((current) => ({ ...current, [key]: value }));
  }

  async function handleExportPng(tileSize: PngTileSize) {
    const grid = generation.gridRef.current;
    if (!grid || !exportable) return;
    setExportError(null);
    try {
      const blob = await renderPngBlob(grid, tileSize);
      downloadBlob(blob, exportFileName(exportable.seed, "png"));
    } catch (error) {
      setExportError(errorMessage(error));
    }
  }

  function handleExportJson() {
    const grid = generation.gridRef.current;
    if (!grid || !exportable) return;
    setExportError(null);
    const blob = new Blob([toJSON(grid, exportable)], {
      type: "application/json",
    });
    downloadBlob(blob, exportFileName(exportable.seed, "json"));
  }

  async function handleImportJson(file: File) {
    setExportError(null);
    try {
      if (file.size > MAX_IMPORT_BYTES) {
        throw new Error("O arquivo é grande demais para ser um mapa.");
      }
      const { grid, meta } = fromJSON(await file.text());
      const imported = getGenerator(meta.generator);
      if (!imported) {
        throw new Error(
          `O arquivo usa o algoritmo "${meta.generator}", que este app não conhece.`,
        );
      }

      const fitted = fitParams(imported, meta.params);
      setGenerator(imported);
      setParams(fitted);
      setSeed(meta.seed);
      generation.setSpeed(imported.defaultSpeed);
      generation.load(grid, { ...meta, params: fitted });
    } catch (error) {
      setExportError(`Não foi possível importar: ${errorMessage(error)}`);
    }
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

          <MetricsPanel
            metrics={generation.metrics}
            roomCount={generation.lastStep?.roomCount ?? null}
            elapsedMs={generation.elapsedMs}
          />

          <ExportPanel
            canExport={exportable !== null}
            error={exportError}
            onExportPng={handleExportPng}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
          />
        </aside>
      </main>
    </div>
  );
}

export default App;
