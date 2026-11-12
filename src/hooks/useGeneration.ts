import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { createGrid } from "../core/grid";
import { createRng } from "../core/rng";
import type { GenParams, GenStep, Grid, MapGenerator } from "../core/types";

export type GenerationStatus = "idle" | "running" | "paused" | "done";

export interface StartOptions {
  generator: MapGenerator;
  params: GenParams;
  seed: string;
}

export interface Generation {
  gridRef: RefObject<Grid | null>;
  version: number;
  status: GenerationStatus;
  lastStep: GenStep | null;
  // Passos do gerador consumidos a cada quadro de animação.
  speed: number;
  setSpeed: (speed: number) => void;
  start: (options: StartOptions) => void;
  pause: () => void;
  resume: () => void;
  step: () => void;
  finish: () => void;
  reset: () => void;
}

export const MIN_SPEED = 1;
export const MAX_SPEED = 100;
const DEFAULT_SPEED = 5;

export function useGeneration(width: number, height: number): Generation {
  const gridRef = useRef<Grid | null>(null);
  if (gridRef.current === null) {
    gridRef.current = createGrid(width, height);
  }
  const iteratorRef = useRef<Generator<GenStep, void, void> | null>(null);

  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [version, setVersion] = useState(0);
  const [lastStep, setLastStep] = useState<GenStep | null>(null);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);

  // Consome até `count` passos do gerador e devolve true se ele terminou.
  const advance = useCallback((count: number): boolean => {
    const iterator = iteratorRef.current;
    if (!iterator) return true;

    let last: GenStep | null = null;
    let finished = false;
    for (let i = 0; i < count && !finished; i++) {
      const result = iterator.next();
      if (result.done) {
        finished = true;
      } else {
        last = result.value;
        finished = result.value.done === true;
      }
    }

    if (last) setLastStep(last);
    setVersion((v) => v + 1);
    if (finished) {
      iteratorRef.current = null;
      setStatus("done");
    }
    return finished;
  }, []);

  useEffect(() => {
    if (status !== "running") return;

    let frameId = requestAnimationFrame(function tick() {
      if (!advance(speed)) {
        frameId = requestAnimationFrame(tick);
      }
    });
    // Sem isto, cada mudança de status ou velocidade deixaria um loop antigo
    // rodando junto com o novo.
    return () => cancelAnimationFrame(frameId);
  }, [status, speed, advance]);

  const start = useCallback(
    ({ generator, params, seed }: StartOptions) => {
      const grid = createGrid(width, height);
      gridRef.current = grid;
      iteratorRef.current = generator.run(grid, params, createRng(seed));
      setLastStep(null);
      setVersion((v) => v + 1);
      setStatus("running");
    },
    [width, height],
  );

  const pause = useCallback(() => {
    setStatus((current) => (current === "running" ? "paused" : current));
  }, []);

  const resume = useCallback(() => {
    setStatus((current) => (current === "paused" ? "running" : current));
  }, []);

  const step = useCallback(() => {
    if (!iteratorRef.current) return;
    setStatus("paused");
    advance(1);
  }, [advance]);

  const finish = useCallback(() => {
    if (!iteratorRef.current) return;
    advance(Infinity);
  }, [advance]);

  const reset = useCallback(() => {
    iteratorRef.current = null;
    gridRef.current = createGrid(width, height);
    setLastStep(null);
    setVersion((v) => v + 1);
    setStatus("idle");
  }, [width, height]);

  return {
    gridRef,
    version,
    status,
    lastStep,
    speed,
    setSpeed,
    start,
    pause,
    resume,
    step,
    finish,
    reset,
  };
}
