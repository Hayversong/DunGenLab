import { useRef, useState } from "react";
import { PNG_TILE_SIZES } from "../render/pngExport";
import type { PngTileSize } from "../render/pngExport";
import { Button } from "./ui/Button";
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
    <div className={styles.export}>
      <h3 className={styles.heading}>Exportar</h3>
      <div className={styles.row}>
        <label htmlFor="png-tile-size">Tile no PNG</label>
        <select
          id="png-tile-size"
          className="px-frame-sm px-field"
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
        <Button onClick={() => onExportPng(tileSize)} disabled={!canExport}>
          Exportar PNG
        </Button>
        <Button onClick={onExportJson} disabled={!canExport}>
          Exportar JSON
        </Button>
      </div>

      {!canExport && (
        <p className={styles.hint}>
          Disponível quando houver um mapa completo na tela.
        </p>
      )}

      <h3 className={styles.heading}>Importar</h3>
      <div className={styles.buttons}>
        <Button onClick={() => fileInputRef.current?.click()}>
          Importar JSON
        </Button>
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
    </div>
  );
}
