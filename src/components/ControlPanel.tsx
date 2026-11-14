import {
  MAX_MAP_HEIGHT,
  MAX_MAP_WIDTH,
  MIN_MAP_HEIGHT,
  MIN_MAP_WIDTH,
} from "../core/constants";
import type { GenParams, MapGenerator, ParamDef } from "../core/types";
import { ParamField } from "./ParamField";
import { Button } from "./ui/Button";
import { MenuList } from "./ui/MenuList";
import { Window } from "./ui/Window";
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
      <MenuList
        label="Algoritmo"
        options={generators.map((item) => ({
          value: item.id,
          label: item.name,
        }))}
        value={generator.id}
        onChange={onGeneratorChange}
      />
      <Window variant="parchment">
        <p className={styles.description}>{generator.description}</p>
      </Window>

      <div className={styles.field}>
        <label htmlFor="seed">Seed</label>
        <div className={styles.seedRow}>
          <input
            id="seed"
            className="px-frame-sm"
            type="text"
            value={seed}
            onChange={(event) => onSeedChange(event.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          <Button onClick={onRandomSeed}>Aleatória</Button>
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
