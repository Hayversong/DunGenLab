import { useEffect, useRef } from "react";
import { TileArt } from "../../render/tileArt";
import { createTileAtlas } from "../../render/tileAtlas";
import styles from "./Legend.module.css";

// Lado de cada amostra, em pixels: o dobro da arte, para dar para ver.
const SWATCH = 16;

interface LegendItem {
  label: string;
  // Linha do atlas de onde a amostra é copiada; "hero" é o andarilho.
  row: number | "hero";
}

const ITEMS: readonly LegendItem[] = [
  { label: "Parede", row: TileArt.WALL_FACE },
  { label: "Caverna", row: TileArt.FLOOR },
  { label: "Sala", row: TileArt.ROOM },
  { label: "Corredor", row: TileArt.CORRIDOR },
  { label: "Andarilho", row: "hero" },
];

// As amostras são copiadas do mesmo atlas que desenha o mapa: a legenda
// nunca fica diferente do que aparece na tela.
export function Legend() {
  const swatchesRef = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    const atlas = createTileAtlas(SWATCH);
    if (!atlas) return;
    ITEMS.forEach((item, index) => {
      const ctx = swatchesRef.current[index]?.getContext("2d");
      if (!ctx) return;
      const row = item.row === "hero" ? atlas.heroRow : item.row;
      ctx.clearRect(0, 0, SWATCH, SWATCH);
      if (item.row === "hero") {
        // O andarilho tem fundo transparente: vai sobre o chão de caverna.
        ctx.drawImage(
          atlas.image,
          0,
          TileArt.FLOOR * SWATCH,
          SWATCH,
          SWATCH,
          0,
          0,
          SWATCH,
          SWATCH,
        );
      }
      ctx.drawImage(
        atlas.image,
        0,
        row * SWATCH,
        SWATCH,
        SWATCH,
        0,
        0,
        SWATCH,
        SWATCH,
      );
    });
  }, []);

  return (
    <ul className={styles.legend}>
      {ITEMS.map((item, index) => (
        <li key={item.label}>
          <canvas
            ref={(element) => {
              swatchesRef.current[index] = element;
            }}
            width={SWATCH}
            height={SWATCH}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
