import type { GenerationStatus } from "../hooks/useGeneration";
import { SPEED_LEVELS } from "../hooks/useGeneration";
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

// O controle deslizante anda pelas posições da lista, não pelo valor: assim
// cabem no mesmo controle velocidades de 0,02 a 100 passos por quadro.
function closestLevel(speed: number): number {
  let best = 0;
  SPEED_LEVELS.forEach((level, index) => {
    const current = SPEED_LEVELS[best] ?? level;
    if (Math.abs(level - speed) < Math.abs(current - speed)) best = index;
  });
  return best;
}

function formatSpeed(speed: number): string {
  if (speed >= 1) {
    return speed === 1 ? "1 passo/quadro" : `${speed} passos/quadro`;
  }
  return `1 passo a cada ${Math.round(1 / speed)} quadros`;
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
          min={0}
          max={SPEED_LEVELS.length - 1}
          step={1}
          value={closestLevel(speed)}
          onChange={(event) =>
            onSpeedChange(SPEED_LEVELS[event.target.valueAsNumber] ?? speed)
          }
        />
        <output htmlFor="speed">{formatSpeed(speed)}</output>
      </div>
    </div>
  );
}
