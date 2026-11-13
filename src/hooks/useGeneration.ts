import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { createGrid } from "../core/grid";
import { computeMetrics } from "../core/metrics";
import type { MapMetrics } from "../core/metrics";
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
  // Preenchidas quando a geração termina; null antes disso.
  metrics: MapMetrics | null;
  // Tempo da geração rodada de uma vez, sem animação. Só o Finalizar mede.
  elapsedMs: number | null;
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

// Velocidades oferecidas, em passos por quadro. As menores que 1 existem
// porque alguns algoritmos têm poucos passos e acabariam num piscar de olhos.
export const SPEED_LEVELS: readonly number[] = [
  0.02, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 25, 50, 100,
];

interface Consumed {
  last: GenStep | null;
  finished: boolean;
}

// Consome até `count` passos do gerador. Fica fora do hook para o Finalizar
// poder cronometrar só o algoritmo, sem o custo de atualizar a tela.
function consume(
  iterator: Generator<GenStep, void, void>,
  count: number,
): Consumed {
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
  return { last, finished };
}

export function useGeneration(
  width: number,
  height: number,
  initialSpeed: number,
): Generation {
  const gridRef = useRef<Grid | null>(null);
  if (gridRef.current === null) {
    gridRef.current = createGrid(width, height);
  }
  const iteratorRef = useRef<Generator<GenStep, void, void> | null>(null);
  // Fração de passo acumulada entre quadros quando a velocidade é menor que 1.
  const budgetRef = useRef(0);
  const optionsRef = useRef<StartOptions | null>(null);

  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [version, setVersion] = useState(0);
  const [lastStep, setLastStep] = useState<GenStep | null>(null);
  const [speed, setSpeed] = useState(initialSpeed);
  const [metrics, setMetrics] = useState<MapMetrics | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  // Leva o resultado de `consume` para o estado da tela.
  const apply = useCallback(({ last, finished }: Consumed) => {
    if (last) setLastStep(last);
    setVersion((v) => v + 1);
    if (finished) {
      iteratorRef.current = null;
      if (gridRef.current) setMetrics(computeMetrics(gridRef.current));
      setStatus("done");
    }
  }, []);

  // Avança `count` passos e devolve true se o gerador terminou.
  const advance = useCallback(
    (count: number): boolean => {
      const iterator = iteratorRef.current;
      if (!iterator) return true;

      const consumed = consume(iterator, count);
      apply(consumed);
      return consumed.finished;
    },
    [apply],
  );

  useEffect(() => {
    if (status !== "running") return;

    let frameId = requestAnimationFrame(function tick() {
      budgetRef.current += speed;
      const count = Math.floor(budgetRef.current);
      budgetRef.current -= count;
      if (count === 0 || !advance(count)) {
        frameId = requestAnimationFrame(tick);
      }
    });
    // Sem isto, cada mudança de status ou velocidade deixaria um loop antigo
    // rodando junto com o novo.
    return () => cancelAnimationFrame(frameId);
  }, [status, speed, advance]);

  const start = useCallback(
    ({ generator, params, seed }: StartOptions) => {
      optionsRef.current = { generator, params, seed };
      const grid = createGrid(width, height);
      gridRef.current = grid;
      iteratorRef.current = generator.run(grid, params, createRng(seed));
      // Começa com um passo inteiro de crédito: o primeiro aparece já no
      // quadro seguinte, mesmo em velocidade baixa.
      budgetRef.current = 1;
      setLastStep(null);
      setMetrics(null);
      setElapsedMs(null);
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
    const options = optionsRef.current;
    if (!iteratorRef.current || !options) return;

    // Refaz a geração do começo, de uma vez só. Com a mesma seed o mapa sai
    // igual ao que estava sendo animado, e o tempo medido vale para a geração
    // inteira, não só para o trecho que faltava.
    const grid = createGrid(width, height);
    const iterator = options.generator.run(
      grid,
      options.params,
      createRng(options.seed),
    );
    const startedAt = performance.now();
    const consumed = consume(iterator, Infinity);
    const elapsed = performance.now() - startedAt;

    gridRef.current = grid;
    setElapsedMs(elapsed);
    apply(consumed);
  }, [width, height, apply]);

  const reset = useCallback(() => {
    iteratorRef.current = null;
    gridRef.current = createGrid(width, height);
    setLastStep(null);
    setMetrics(null);
    setElapsedMs(null);
    setVersion((v) => v + 1);
    setStatus("idle");
  }, [width, height]);

  return {
    gridRef,
    version,
    status,
    lastStep,
    metrics,
    elapsedMs,
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
