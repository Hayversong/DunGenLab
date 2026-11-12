import type { GenParams, MapGenerator } from "../core/types";
import { ParamField } from "./ParamField";
import styles from "./ControlPanel.module.css";

interface ControlPanelProps {
  generators: readonly MapGenerator[];
  generator: MapGenerator;
  params: GenParams;
  seed: string;
  onGeneratorChange: (id: string) => void;
  onParamChange: (key: string, value: number) => void;
  onSeedChange: (seed: string) => void;
  onRandomSeed: () => void;
}

export function ControlPanel({
  generators,
  generator,
  params,
  seed,
  onGeneratorChange,
  onParamChange,
  onSeedChange,
  onRandomSeed,
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
