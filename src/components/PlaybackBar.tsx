import type { GenerationStatus } from "../hooks/useGeneration";
import { SPEED_LEVELS } from "../hooks/useGeneration";
import { Button } from "./ui/Button";
import { Slider } from "./ui/Slider";
import styles from "./PlaybackBar.module.css";

interface PlaybackBarProps {
  status: GenerationStatus;
  speed: number;
  // "main" são os três botões mais usados; "extra" é o resto. Em tela
  // estreita eles ficam em lugares diferentes; "all" mostra tudo junto.
  part?: "all" | "main" | "extra";
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
  // Curto de propósito: divide a linha com o rótulo "Velocidade".
  return speed >= 1 ? `${speed}x` : `1/${Math.round(1 / speed)}x`;
}

export function PlaybackBar({
  status,
  speed,
  part = "all",
  onGenerate,
  onPause,
  onResume,
  onStep,
  onFinish,
  onReset,
  onSpeedChange,
}: PlaybackBarProps) {
  const inProgress = status === "running" || status === "paused";
  const showMain = part !== "extra";
  const showExtra = part !== "main";

  return (
    <div className={styles.bar} data-part={part}>
      <div className={styles.buttons}>
        {showMain && (
          <>
            <Button
              variant="primary"
              className={styles.generate}
              onClick={onGenerate}
            >
              Gerar
            </Button>
            <Button
              onClick={status === "running" ? onPause : onResume}
              disabled={!inProgress}
              aria-keyshortcuts="Space"
            >
              {status === "running" ? "Pausar" : "Continuar"}
            </Button>
            {/* Com a animação rodando, o passo manual não faria diferença: é
                preciso pausar antes. */}
            <Button
              onClick={onStep}
              disabled={status !== "paused"}
              aria-keyshortcuts="ArrowRight"
            >
              Passo
            </Button>
          </>
        )}
        {showExtra && (
          <>
            <Button onClick={onFinish} disabled={!inProgress}>
              Finalizar
            </Button>
            <Button
              onClick={onReset}
              disabled={status === "idle"}
              aria-keyshortcuts="R"
            >
              Reiniciar
            </Button>
          </>
        )}
      </div>

      {showExtra && (
        <Slider
          id="speed"
          label="Velocidade"
          min={0}
          max={SPEED_LEVELS.length - 1}
          step={1}
          value={closestLevel(speed)}
          text={formatSpeed(speed)}
          onChange={(level) => onSpeedChange(SPEED_LEVELS[level] ?? speed)}
        />
      )}
    </div>
  );
}
