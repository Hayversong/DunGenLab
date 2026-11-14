import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Grid, Point } from "../core/types";
import { useElementSize } from "../hooks/useElementSize";
import { drawGrid } from "../render/canvasRenderer";
import { tileSizeFor } from "../render/scale";
import type { Zoom } from "../render/scale";
import styles from "./MapCanvas.module.css";

interface MapCanvasProps {
  gridRef: RefObject<Grid | null>;
  highlight?: readonly Point[];
  // O grid é mutado no lugar; este número muda quando é hora de redesenhar.
  version: number;
  zoom: Zoom;
}

interface PaintRequest {
  highlight: readonly Point[];
  zoom: Zoom;
  areaWidth: number;
  areaHeight: number;
}

const NO_HIGHLIGHT: readonly Point[] = [];

export function MapCanvas({
  gridRef,
  highlight = NO_HIGHLIGHT,
  version,
  zoom,
}: MapCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const area = useElementSize(viewportRef);

  // O que desenhar no próximo quadro, e o pedido de quadro já feito (0 se
  // não há). Vários motivos para redesenhar podem chegar no mesmo quadro
  // (passo novo, janela redimensionada); o desenho acontece uma vez só.
  const requestRef = useRef<PaintRequest | null>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    requestRef.current = {
      highlight,
      zoom,
      areaWidth: area.width,
      areaHeight: area.height,
    };
    if (frameRef.current !== 0) return;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      const request = requestRef.current;
      const viewport = viewportRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const grid = gridRef.current;
      if (!request || !viewport || !canvas || !ctx || !grid) return;
      // Antes da primeira medida não há como escolher a escala.
      if (request.areaWidth === 0 || request.areaHeight === 0) return;

      // No celular a altura da área segue a proporção do mapa.
      viewport.style.setProperty("--cols", String(grid.width));
      viewport.style.setProperty("--rows", String(grid.height));

      const ratio = window.devicePixelRatio || 1;
      const tileSize = tileSizeFor(
        request.zoom,
        { width: request.areaWidth, height: request.areaHeight },
        grid.width,
        grid.height,
        ratio,
      );
      const width = grid.width * tileSize;
      const height = grid.height * tileSize;
      // Mexer em width/height apaga o canvas, então só quando o tamanho muda.
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        // O canvas tem um pixel por pixel do aparelho; o CSS o mostra no
        // tamanho equivalente, sem esticar nem encolher.
        canvas.style.width = `${width / ratio}px`;
        canvas.style.height = `${height / ratio}px`;
      }

      drawGrid(ctx, grid, tileSize, request.highlight);
    });
  }, [gridRef, highlight, version, zoom, area.width, area.height]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frameRef.current);
      // Zerar libera o próximo pedido: sem isto, um componente remontado
      // acharia para sempre que já há um quadro pedido.
      frameRef.current = 0;
    },
    [],
  );

  const scrollable = zoom !== "fit";

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      data-scroll={scrollable}
      // Com zoom manual o mapa pode passar da área: ela rola, e precisa
      // receber o foco para rolar pelo teclado.
      tabIndex={scrollable ? 0 : undefined}
      role={scrollable ? "group" : undefined}
      aria-label={scrollable ? "Área do mapa, com rolagem" : undefined}
      onKeyDown={(event) => {
        // As setas rolam a área; não devem chegar ao atalho de "passo".
        if (scrollable && event.key.startsWith("Arrow")) {
          event.stopPropagation();
        }
      }}
    >
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        role="img"
        aria-label="Mapa gerado"
      />
    </div>
  );
}
