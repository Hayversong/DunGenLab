import { useState } from "react";
import { ControlPanel } from "./components/ControlPanel";
import type { MapSize } from "./components/ControlPanel";
import { ExportPanel } from "./components/ExportPanel";
import { MapCanvas } from "./components/MapCanvas";
import { MetricsPanel } from "./components/MetricsPanel";
import { PlaybackBar } from "./components/PlaybackBar";
import { DialogBox } from "./components/ui/DialogBox";
import { Window } from "./components/ui/Window";
import { DEFAULT_MAP_HEIGHT, DEFAULT_MAP_WIDTH } from "./core/constants";
import { exportFileName, fromJSON, toJSON } from "./core/export";
import { generators, getGenerator } from "./core/generators";
import { clampMapSize } from "./core/grid";
import { clampParams } from "./core/params";
import type { GenParams, MapGenerator } from "./core/types";
import { useGeneration } from "./hooks/useGeneration";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import type { GenerationStatus } from "./hooks/useGeneration";
import { downloadBlob } from "./render/download";
import { renderPngBlob } from "./render/pngExport";
import type { PngTileSize } from "./render/pngExport";
import styles from "./App.module.css";

const DEFAULT_SIZE: MapSize = {
  width: DEFAULT_MAP_WIDTH,
  height: DEFAULT_MAP_HEIGHT,
};

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

function App() {
  const [generator, setGenerator] = useState(DEFAULT_GENERATOR);
  const [params, setParams] = useState<GenParams>(
    DEFAULT_GENERATOR.defaultParams,
  );
  const [seed, setSeed] = useState("gato-preto");
  const [size, setSize] = useState(DEFAULT_SIZE);
  const generation = useGeneration(
    DEFAULT_SIZE.width,
    DEFAULT_SIZE.height,
    DEFAULT_GENERATOR.defaultSpeed,
  );

  const [exportError, setExportError] = useState<string | null>(null);

  // Só há o que exportar com um mapa completo na tela.
  const exportable = generation.status === "done" ? generation.meta : null;

  function handleGenerate() {
    generation.start({ generator, params, seed, ...size });
  }

  function handleReset() {
    generation.reset(size.width, size.height);
  }

  // Cada atalho faz o mesmo que o botão correspondente e respeita os mesmos
  // estados em que o botão fica desabilitado.
  useKeyboardShortcuts({
    toggle: () => {
      if (generation.status === "running") generation.pause();
      else if (generation.status === "paused") generation.resume();
      else handleGenerate();
    },
    step: () => {
      if (generation.status === "paused") generation.step();
    },
    reset: () => {
      if (generation.status !== "idle") handleReset();
    },
  });

  function handleGeneratorChange(id: string) {
    const next = getGenerator(id);
    if (!next) return;
    generation.reset(size.width, size.height);
    setGenerator(next);
    setParams(next.defaultParams);
    generation.setSpeed(next.defaultSpeed);
  }

  function handleParamChange(key: string, value: number) {
    setParams((current) => ({ ...current, [key]: value }));
  }

  function handleSizeChange(key: keyof MapSize, value: number) {
    const next = { ...size, [key]: value };
    setSize(next);
    // Sem mapa na tela, o quadro vazio já acompanha o tamanho escolhido. Com
    // mapa, o tamanho novo só vale a partir da próxima geração.
    if (generation.status === "idle") generation.reset(next.width, next.height);
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

      const fitted = clampParams(imported, meta.params);
      setGenerator(imported);
      setParams(fitted);
      setSeed(meta.seed);
      // Os controles ficam com o tamanho do arquivo, para o próximo Gerar
      // sair igual. Arquivo menor que o mínimo da tela fica no mínimo.
      setSize(clampMapSize(grid.width, grid.height));
      generation.setSpeed(imported.defaultSpeed);
      generation.load(grid, { ...meta, params: fitted });
    } catch (error) {
      setExportError(`Não foi possível importar: ${errorMessage(error)}`);
    }
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className="px-title">DunGenLab</h1>
        <p>Geração procedural de masmorras, passo a passo</p>
      </header>

      <main className={styles.layout}>
        <section className={styles.stage} aria-label="Mapa">
          <MapCanvas
            gridRef={generation.gridRef}
            highlight={generation.lastStep?.highlight}
            version={generation.version}
          />
          {/* Durante a animação o texto muda dezenas de vezes por segundo:
              aparece direto, sem o efeito de digitação, e um leitor de tela
              só é avisado quando ela para. */}
          <DialogBox
            text={
              generation.lastStep?.description ?? STATUS_TEXT[generation.status]
            }
            instant={generation.status === "running"}
            live={generation.status === "running" ? "off" : "polite"}
          />
          <PlaybackBar
            status={generation.status}
            speed={generation.speed}
            onGenerate={handleGenerate}
            onPause={generation.pause}
            onResume={generation.resume}
            onStep={generation.step}
            onFinish={generation.finish}
            onReset={handleReset}
            onSpeedChange={generation.setSpeed}
          />
        </section>

        <aside className={styles.panel} aria-label="Controles">
          <Window title="Comandos">
            <ControlPanel
              generators={generators}
              generator={generator}
              params={params}
              seed={seed}
              size={size}
              onGeneratorChange={handleGeneratorChange}
              onParamChange={handleParamChange}
              onSeedChange={setSeed}
              onRandomSeed={() => setSeed(randomSeed())}
              onSizeChange={handleSizeChange}
            />
          </Window>

          <Window title="Status">
            <MetricsPanel
              metrics={generation.metrics}
              roomCount={generation.lastStep?.roomCount ?? null}
              elapsedMs={generation.elapsedMs}
              imported={generation.imported}
            />
          </Window>

          <Window title="Arquivo">
            <ExportPanel
              canExport={exportable !== null}
              error={exportError}
              onExportPng={handleExportPng}
              onExportJson={handleExportJson}
              onImportJson={handleImportJson}
            />
          </Window>
        </aside>
      </main>
    </div>
  );
}

export default App;
