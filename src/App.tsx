import { useState } from "react";
import { ControlPanel } from "./components/ControlPanel";
import { ExportPanel } from "./components/ExportPanel";
import { HelpContent } from "./components/HelpContent";
import { MapCanvas } from "./components/MapCanvas";
import { MetricsPanel } from "./components/MetricsPanel";
import { ParamsPanel } from "./components/ParamsPanel";
import type { MapSize } from "./components/ParamsPanel";
import { PlaybackBar } from "./components/PlaybackBar";
import { Button } from "./components/ui/Button";
import { DialogBox } from "./components/ui/DialogBox";
import { Modal } from "./components/ui/Modal";
import { Tabs } from "./components/ui/Tabs";
import { Window } from "./components/ui/Window";
import { DEFAULT_MAP_HEIGHT, DEFAULT_MAP_WIDTH } from "./core/constants";
import { exportFileName, fromJSON, toJSON } from "./core/export";
import { generators, getGenerator } from "./core/generators";
import { clampMapSize } from "./core/grid";
import { clampParams } from "./core/params";
import type { GenParams, MapGenerator } from "./core/types";
import { useGeneration } from "./hooks/useGeneration";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useMediaQuery } from "./hooks/useMediaQuery";
import type { GenerationStatus } from "./hooks/useGeneration";
import { downloadBlob } from "./render/download";
import { renderPngBlob } from "./render/pngExport";
import type { PngTileSize } from "./render/pngExport";
import { ZOOM_LEVELS } from "./render/scale";
import type { Zoom } from "./render/scale";
import styles from "./App.module.css";

const DEFAULT_SIZE: MapSize = {
  width: DEFAULT_MAP_WIDTH,
  height: DEFAULT_MAP_HEIGHT,
};

const DEFAULT_GENERATOR = generators[0] as MapGenerator;

// Abaixo desta largura as três janelas não cabem ao lado do mapa e viram
// abas. O mesmo número aparece nas consultas de mídia do CSS.
const COMPACT_QUERY = "(max-width: 1099px)";

const STATUS_TEXT: Record<GenerationStatus, string> = {
  idle: "Aperte Gerar para começar.",
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

  const [zoom, setZoom] = useState<Zoom>("fit");
  // Modo exibição: só o mapa e a caixa de texto, sem os painéis.
  const [display, setDisplay] = useState(false);
  const [modal, setModal] = useState<"file" | "help" | null>(null);
  const compact = useMediaQuery(COMPACT_QUERY);

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
  // Com uma janela aberta por cima, as teclas são dela.
  useKeyboardShortcuts({
    toggle: () => {
      if (modal !== null) return;
      if (generation.status === "running") generation.pause();
      else if (generation.status === "paused") generation.resume();
      else handleGenerate();
    },
    step: () => {
      if (modal === null && generation.status === "paused") generation.step();
    },
    reset: () => {
      if (modal === null && generation.status !== "idle") handleReset();
    },
    display: () => {
      if (modal === null) setDisplay((current) => !current);
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

  const playback = (part: "all" | "main" | "extra") => (
    <PlaybackBar
      part={part}
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
  );

  const commands = (
    <ControlPanel
      generators={generators}
      generator={generator}
      seed={seed}
      onGeneratorChange={handleGeneratorChange}
      onSeedChange={setSeed}
      onRandomSeed={() => setSeed(randomSeed())}
    >
      {playback(compact ? "extra" : "all")}
    </ControlPanel>
  );

  const parameters = (
    <ParamsPanel
      generator={generator}
      params={params}
      size={size}
      onParamChange={handleParamChange}
      onSizeChange={handleSizeChange}
    />
  );

  const status = (
    <MetricsPanel
      metrics={generation.metrics}
      roomCount={generation.lastStep?.roomCount ?? null}
      elapsedMs={generation.elapsedMs}
      imported={generation.imported}
    />
  );

  // Parado, a caixa apresenta o algoritmo escolhido.
  const dialogText =
    generation.lastStep?.description ??
    (generation.status === "idle"
      ? `${generator.description} ${STATUS_TEXT.idle}`
      : STATUS_TEXT[generation.status]);

  return (
    <div className={styles.app} data-display={display}>
      {display ? (
        <div className={styles.exit}>
          <Button onClick={() => setDisplay(false)} aria-keyshortcuts="F">
            Sair da exibição
          </Button>
        </div>
      ) : (
        <header className={styles.header}>
          <div className={styles.brand}>
            <h1 className="px-title">DunGenLab</h1>
            <p>Geração procedural de masmorras, passo a passo</p>
          </div>
          <div className={styles.tools}>
            <span aria-hidden="true">Zoom</span>
            <select
              aria-label="Zoom do mapa"
              className="px-frame-sm"
              value={zoom}
              onChange={(event) => {
                const level = ZOOM_LEVELS.find(
                  (item) => item === Number(event.target.value),
                );
                setZoom(level ?? "fit");
              }}
            >
              <option value="fit">Ajustar à tela</option>
              {ZOOM_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}x
                </option>
              ))}
            </select>
            <Button onClick={() => setModal("file")}>Arquivo</Button>
            <Button onClick={() => setModal("help")}>Ajuda</Button>
            <Button onClick={() => setDisplay(true)} aria-keyshortcuts="F">
              Exibição
            </Button>
          </div>
        </header>
      )}

      {!display && !compact && (
        <aside className={styles.commands} aria-label="Comandos">
          <Window title="Comandos">{commands}</Window>
        </aside>
      )}

      <main className={styles.map}>
        <section className={`px-frame ${styles.mapFrame}`} aria-label="Mapa">
          <MapCanvas
            gridRef={generation.gridRef}
            highlight={generation.lastStep?.highlight}
            version={generation.version}
            zoom={zoom}
          />
        </section>
      </main>

      <div className={styles.dialog}>
        {/* Durante a animação o texto muda dezenas de vezes por segundo:
            aparece direto, sem o efeito de digitação, e um leitor de tela
            só é avisado quando ela para. */}
        <DialogBox
          text={dialogText}
          instant={generation.status === "running"}
          live={generation.status === "running" ? "off" : "polite"}
        />
      </div>

      {!display && !compact && (
        <aside className={styles.side} aria-label="Parâmetros e status">
          <Window title="Parâmetros">{parameters}</Window>
          <Window title="Status" className={styles.grow}>
            {status}
          </Window>
        </aside>
      )}

      {!display && compact && (
        <aside className={styles.side} aria-label="Controles">
          {playback("main")}
          <Tabs
            label="Painéis"
            tabs={[
              { id: "commands", label: "Comandos", content: commands },
              { id: "params", label: "Parâmetros", content: parameters },
              { id: "status", label: "Status", content: status },
            ]}
          />
        </aside>
      )}

      <Modal
        open={modal === "file"}
        onClose={() => setModal(null)}
        title="Arquivo"
      >
        <ExportPanel
          canExport={exportable !== null}
          error={exportError}
          onExportPng={handleExportPng}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
        />
      </Modal>

      <Modal
        open={modal === "help"}
        onClose={() => setModal(null)}
        title="Ajuda"
        variant="parchment"
      >
        <HelpContent />
      </Modal>
    </div>
  );
}

export default App;
