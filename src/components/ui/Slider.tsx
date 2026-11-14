import type { CSSProperties } from "react";
import styles from "./Slider.module.css";

interface SliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  // O valor por extenso, mostrado ao lado do rótulo e lido em voz alta.
  text: string;
  onChange: (value: number) => void;
}

// Controle deslizante: por baixo é o <input type="range"> do navegador, com
// teclado e leitor de tela funcionando; só a aparência é trocada.
export function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  text,
  onChange,
}: SliderProps) {
  const ratio = max > min ? (value - min) / (max - min) : 0;
  // Posição do preenchimento da trilha, de 0% a 100%.
  const style = {
    "--fill": `${Math.min(1, Math.max(0, ratio)) * 100}%`,
  } as CSSProperties;

  return (
    <div className={styles.slider}>
      <label htmlFor={id}>{label}</label>
      <output htmlFor={id}>{text}</output>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={text}
        style={style}
        onChange={(event) => onChange(event.target.valueAsNumber)}
      />
    </div>
  );
}
