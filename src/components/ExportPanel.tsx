import { useRef, useState } from "react";
import { PNG_TILE_SIZES } from "../render/pngExport";
import type { PngTileSize } from "../render/pngExport";
import styles from "./ExportPanel.module.css";

interface ExportPanelProps {
  canExport: boolean;
  error: string | null;
  onExportPng: (tileSize: PngTileSize) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
}

const DEFAULT_TILE_SIZE: PngTileSize = 8;

export function ExportPanel({
  canExport,
  error,
  onExportPng,
  onExportJson,
  onImportJson,
}: ExportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tileSize, setTileSize] = useState<PngTileSize>(DEFAULT_TILE_SIZE);

  return (
    <section className={styles.export} aria-labelledby="export-title">
      <h2 id="export-title">Exportar</h2>

      <div className={styles.row}>
        <label htmlFor="png-tile-size">Tamanho do tile no PNG</label>
        <select
          id="png-tile-size"
          value={tileSize}
          onChange={(event) => {
            const chosen = PNG_TILE_SIZES.find(
              (size) => size === Number(event.target.value),
            );
            if (chosen) setTileSize(chosen);
          }}
        >
          {PNG_TILE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} px
            </option>
          ))}
        </select>
      </div>

      <div className={styles.buttons}>
        <button
          type="button"
          onClick={() => onExportPng(tileSize)}
          disabled={!canExport}
        >
          Exportar PNG
        </button>
        <button type="button" onClick={onExportJson} disabled={!canExport}>
          Exportar JSON
        </button>
      </div>

      {!canExport && (
        <p className={styles.hint}>
          Disponível quando houver um mapa completo na tela.
        </p>
      )}

      <div className={styles.buttons}>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Importar JSON
        </button>
        {/* O campo de arquivo do navegador não aceita estilo; fica escondido
            e o botão acima abre a janela de escolha por ele. */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          aria-label="Arquivo JSON para importar"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Limpa a escolha: sem isso, escolher o mesmo arquivo de novo
            // não dispararia outro evento.
            event.target.value = "";
            if (file) onImportJson(file);
          }}
        />
      </div>
      {error !== null && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
