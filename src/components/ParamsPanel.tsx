import {
  MAX_MAP_HEIGHT,
  MAX_MAP_WIDTH,
  MIN_MAP_HEIGHT,
  MIN_MAP_WIDTH,
} from "../core/constants";
import type { GenParams, MapGenerator, ParamDef } from "../core/types";
import { ParamField } from "./ParamField";
import styles from "./ParamsPanel.module.css";

export interface MapSize {
  width: number;
  height: number;
}

// Largura e altura usam o mesmo campo dos parâmetros dos algoritmos.
const SIZE_FIELDS: (ParamDef & { key: keyof MapSize })[] = [
  {
    key: "width",
    label: "Largura",
    type: "int",
    min: MIN_MAP_WIDTH,
    max: MAX_MAP_WIDTH,
    step: 1,
  },
  {
    key: "height",
    label: "Altura",
    type: "int",
    min: MIN_MAP_HEIGHT,
    max: MAX_MAP_HEIGHT,
    step: 1,
  },
];

interface ParamsPanelProps {
  generator: MapGenerator;
  params: GenParams;
  size: MapSize;
  onParamChange: (key: string, value: number) => void;
  onSizeChange: (key: keyof MapSize, value: number) => void;
}

export function ParamsPanel({
  generator,
  params,
  size,
  onParamChange,
  onSizeChange,
}: ParamsPanelProps) {
  return (
    <div className={styles.panel}>
      <fieldset className={styles.group}>
        <legend>Mapa (tiles)</legend>
        {SIZE_FIELDS.map((def) => (
          <ParamField
            key={def.key}
            def={def}
            value={size[def.key]}
            onChange={(_, value) => onSizeChange(def.key, value)}
          />
        ))}
      </fieldset>

      <fieldset className={styles.group}>
        <legend>{generator.name}</legend>
        {generator.paramSchema.map((def) => (
          <ParamField
            key={def.key}
            def={def}
            value={params[def.key] ?? generator.defaultParams[def.key] ?? 0}
            onChange={onParamChange}
          />
        ))}
      </fieldset>
    </div>
  );
}
