import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Grid, Point } from "../core/types";
import { canvasSize, drawGrid, fitTileSize } from "../render/canvasRenderer";
import styles from "./MapCanvas.module.css";

interface MapCanvasProps {
  gridRef: RefObject<Grid | null>;
  highlight?: readonly Point[];
  // O grid é mutado no lugar; este número muda quando é hora de redesenhar.
  version: number;
}

export function MapCanvas({ gridRef, highlight, version }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const grid = gridRef.current;
    if (!canvas || !ctx || !grid) return;

    const tileSize = fitTileSize(grid);
    const size = canvasSize(grid, tileSize);
    // Mexer em width/height apaga o canvas, então só quando o tamanho muda.
    if (canvas.width !== size.width || canvas.height !== size.height) {
      canvas.width = size.width;
      canvas.height = size.height;
    }

    drawGrid(ctx, grid, tileSize, highlight);
  }, [gridRef, highlight, version]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      role="img"
      aria-label="Mapa gerado"
    />
  );
}
