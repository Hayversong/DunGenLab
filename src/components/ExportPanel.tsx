import { useState } from "react";
import { PNG_TILE_SIZES } from "../render/pngExport";
import type { PngTileSize } from "../render/pngExport";
import styles from "./ExportPanel.module.css";

interface ExportPanelProps {
  canExport: boolean;
  error: string | null;
  onExportPng: (tileSize: PngTileSize) => void;
}

const DEFAULT_TILE_SIZE: PngTileSize = 8;

export function ExportPanel({
  canExport,
  error,
  onExportPng,
}: ExportPanelProps) {
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
      </div>

      {!canExport && (
        <p className={styles.hint}>
          Disponível quando houver um mapa completo na tela.
        </p>
      )}
      {error !== null && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
