import { useId } from "react";
import type { CSSProperties } from "react";
import { barRatio, filledBlocks } from "./statBar";
import styles from "./StatBar.module.css";

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  // O valor por extenso, mostrado ao lado da barra: "42,7%".
  text: string;
  tone?: "gold" | "green" | "red" | "teal";
}

const BLOCKS = 10;

export function StatBar({
  label,
  value,
  max,
  text,
  tone = "gold",
}: StatBarProps) {
  const labelId = useId();
  const filled = filledBlocks(barRatio(value, max), BLOCKS);

  return (
    <div className={styles.stat}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      {/* O medidor abaixo já informa o valor a leitores de tela. */}
      <span className={styles.value} aria-hidden="true">
        {text}
      </span>
      <div
        className={`${styles.bar} ${styles[tone]}`}
        role="meter"
        aria-labelledby={labelId}
        style={{ "--blocks": BLOCKS } as CSSProperties}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(max, Math.max(0, value))}
        aria-valuetext={text}
      >
        {Array.from({ length: BLOCKS }, (_, index) => (
          <span key={index} data-on={index < filled} />
        ))}
      </div>
    </div>
  );
}
