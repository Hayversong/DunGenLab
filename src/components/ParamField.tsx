import type { ParamDef } from "../core/types";
import styles from "./ParamField.module.css";

interface ParamFieldProps {
  def: ParamDef;
  value: number;
  onChange: (key: string, value: number) => void;
}

// Casas decimais do passo: 0.05 mostra duas, 1 não mostra nenhuma.
function decimalsOf(step: number): number {
  const text = String(step);
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

function formatParam(def: ParamDef, value: number): string {
  return def.type === "int"
    ? String(Math.round(value))
    : value.toFixed(decimalsOf(def.step));
}

export function ParamField({ def, value, onChange }: ParamFieldProps) {
  const id = `param-${def.key}`;

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{def.label}</label>
      <output htmlFor={id}>{formatParam(def, value)}</output>
      <input
        id={id}
        type="range"
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        onChange={(event) => onChange(def.key, event.target.valueAsNumber)}
      />
    </div>
  );
}
