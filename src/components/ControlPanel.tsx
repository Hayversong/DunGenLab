import {
  MAX_MAP_HEIGHT,
  MAX_MAP_WIDTH,
  MIN_MAP_HEIGHT,
  MIN_MAP_WIDTH,
} from "../core/constants";
import type { GenParams, MapGenerator, ParamDef } from "../core/types";
import { ParamField } from "./ParamField";
import styles from "./ControlPanel.module.css";

export interface MapSize {
  width: number;
  height: number;
}

// Largura e altura usam o mesmo campo dos parâmetros dos algoritmos.
const SIZE_FIELDS: (ParamDef & { key: keyof MapSize })[] = [
  {
    key: "width",
    label: "Largura (tiles)",
    type: "int",
    min: MIN_MAP_WIDTH,
    max: MAX_MAP_WIDTH,
    step: 1,
  },
  {
    key: "height",
    label: "Altura (tiles)",
    type: "int",
    min: MIN_MAP_HEIGHT,
    max: MAX_MAP_HEIGHT,
    step: 1,
  },
];

interface ControlPanelProps {
  generators: readonly MapGenerator[];
  generator: MapGenerator;
  params: GenParams;
  seed: string;
  size: MapSize;
  onGeneratorChange: (id: string) => void;
  onParamChange: (key: string, value: number) => void;
  onSeedChange: (seed: string) => void;
  onRandomSeed: () => void;
  onSizeChange: (key: keyof MapSize, value: number) => void;
}

export function ControlPanel({
  generators,
  generator,
  params,
  seed,
  size,
  onGeneratorChange,
  onParamChange,
  onSeedChange,
  onRandomSeed,
  onSizeChange,
}: ControlPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.field}>
        <label htmlFor="algorithm">Algoritmo</label>
        <select
          id="algorithm"
          value={generator.id}
          onChange={(event) => onGeneratorChange(event.target.value)}
        >
          {generators.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <p className={styles.description}>{generator.description}</p>
      </div>

      <div className={styles.field}>
        <label htmlFor="seed">Seed</label>
        <div className={styles.seedRow}>
          <input
            id="seed"
            type="text"
            value={seed}
            onChange={(event) => onSeedChange(event.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" onClick={onRandomSeed}>
            Aleatória
          </button>
        </div>
      </div>

      <fieldset className={styles.params}>
        <legend>Tamanho do mapa</legend>
        {SIZE_FIELDS.map((def) => (
          <ParamField
            key={def.key}
            def={def}
            value={size[def.key]}
            onChange={(_, value) => onSizeChange(def.key, value)}
          />
        ))}
      </fieldset>

      <fieldset className={styles.params}>
        <legend>Parâmetros</legend>
        {generator.paramSchema.map((def) => (
          <ParamField
            key={def.key}
            def={def}
            value={params[def.key] ?? generator.defaultParams[def.key] ?? 0}
            onChange={onParamChange}
          />
        ))}
        <p className={styles.hint}>Valem a partir da próxima geração.</p>
      </fieldset>
    </div>
  );
}
