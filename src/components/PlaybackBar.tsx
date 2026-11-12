import type { GenerationStatus } from "../hooks/useGeneration";
import { MAX_SPEED, MIN_SPEED } from "../hooks/useGeneration";
import styles from "./PlaybackBar.module.css";

interface PlaybackBarProps {
  status: GenerationStatus;
  speed: number;
  onGenerate: () => void;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onFinish: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export function PlaybackBar({
  status,
  speed,
  onGenerate,
  onPause,
  onResume,
  onStep,
  onFinish,
  onReset,
  onSpeedChange,
}: PlaybackBarProps) {
  const inProgress = status === "running" || status === "paused";

  return (
    <div className={styles.bar}>
      <div className={styles.buttons}>
        <button type="button" className={styles.primary} onClick={onGenerate}>
          Gerar
        </button>
        <button
          type="button"
          onClick={status === "running" ? onPause : onResume}
          disabled={!inProgress}
        >
          {status === "running" ? "Pausar" : "Continuar"}
        </button>
        <button type="button" onClick={onStep} disabled={!inProgress}>
          Passo
        </button>
        <button type="button" onClick={onFinish} disabled={!inProgress}>
          Finalizar
        </button>
        <button type="button" onClick={onReset} disabled={status === "idle"}>
          Reiniciar
        </button>
      </div>

      <div className={styles.speed}>
        <label htmlFor="speed">Velocidade</label>
        <input
          id="speed"
          type="range"
          min={MIN_SPEED}
          max={MAX_SPEED}
          step={1}
          value={speed}
          onChange={(event) => onSpeedChange(event.target.valueAsNumber)}
        />
        <output htmlFor="speed">{speed} passos/quadro</output>
      </div>
    </div>
  );
}
