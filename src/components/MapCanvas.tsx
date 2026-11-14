import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Grid, Point } from "../core/types";
import { useBlink } from "../hooks/useBlink";
import { useElementSize } from "../hooks/useElementSize";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import type { MarkerKind } from "../render/canvasRenderer";
import { createMapPainter } from "../render/mapPainter";
import type { MapPainter } from "../render/mapPainter";
import { tileSizeFor } from "../render/scale";
import type { Zoom } from "../render/scale";
import { createTileAtlas } from "../render/tileAtlas";
import type { TileAtlas } from "../render/tileAtlas";
import styles from "./MapCanvas.module.css";

interface MapCanvasProps {
  gridRef: RefObject<Grid | null>;
  highlight?: readonly Point[];
  // O grid é mutado no lugar; este número muda quando é hora de redesenhar.
  version: number;
  zoom: Zoom;
  // Como marcar os tiles do passo atual.
  marker: MarkerKind;
  // true quando o mapa deve ocupar toda a área, em qualquer tamanho de tela.
  fill?: boolean;
}

interface PaintRequest {
  highlight: readonly Point[];
  marker: MarkerKind;
  blinkOn: boolean;
  zoom: Zoom;
  areaWidth: number;
  areaHeight: number;
}

const NO_HIGHLIGHT: readonly Point[] = [];

// Milissegundos entre uma piscada e outra do cursor.
const BLINK_INTERVAL = 450;

interface Drawing {
  painter: MapPainter;
  atlas: TileAtlas | null;
  atlasTileSize: number;
}

export function MapCanvas({
  gridRef,
  highlight = NO_HIGHLIGHT,
  version,
  zoom,
  marker,
  fill = false,
}: MapCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const area = useElementSize(viewportRef);
  const reducedMotion = usePrefersReducedMotion();
  // Só pisca se há o que marcar; quem pediu menos movimento vê o cursor fixo.
  const blinkOn = useBlink(
    highlight.length > 0 && !reducedMotion,
    BLINK_INTERVAL,
  );
  // O que já está desenhado e o atlas do tamanho de tile em uso.
  const drawingRef = useRef<Drawing | null>(null);

  // O que desenhar no próximo quadro, e o pedido de quadro já feito (0 se
  // não há). Vários motivos para redesenhar podem chegar no mesmo quadro
  // (passo novo, janela redimensionada); o desenho acontece uma vez só.
  const requestRef = useRef<PaintRequest | null>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    requestRef.current = {
      highlight,
      marker,
      blinkOn,
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
      const drawing = (drawingRef.current ??= {
        painter: createMapPainter(),
        atlas: null,
        atlasTileSize: 0,
      });
      // Mexer em width/height apaga o canvas, então só quando o tamanho muda.
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        // O canvas tem um pixel por pixel do aparelho; o CSS o mostra no
        // tamanho equivalente, sem esticar nem encolher.
        canvas.style.width = `${width / ratio}px`;
        canvas.style.height = `${height / ratio}px`;
        drawing.painter.reset();
      }
      // O atlas é refeito só quando o tamanho do tile muda.
      if (drawing.atlasTileSize !== tileSize) {
        drawing.atlas = createTileAtlas(tileSize);
        drawing.atlasTileSize = tileSize;
      }

      drawing.painter.paint(ctx, {
        grid,
        tileSize,
        atlas: drawing.atlas,
        highlight: request.highlight,
        marker: request.marker,
        blinkOn: request.blinkOn,
      });
    });
  }, [
    gridRef,
    highlight,
    version,
    zoom,
    marker,
    blinkOn,
    area.width,
    area.height,
  ]);

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
      data-fill={fill}
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
