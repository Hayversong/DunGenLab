import type { ParamDef } from "../core/types";
import { Slider } from "./ui/Slider";

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
    : value.toFixed(decimalsOf(def.step)).replace(".", ",");
}

export function ParamField({ def, value, onChange }: ParamFieldProps) {
  return (
    <Slider
      id={`param-${def.key}`}
      label={def.label}
      value={value}
      min={def.min}
      max={def.max}
      step={def.step}
      text={formatParam(def, value)}
      onChange={(next) => onChange(def.key, next)}
    />
  );
}
