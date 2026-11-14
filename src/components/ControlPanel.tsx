import type { ReactNode } from "react";
import { MAX_SEED_LENGTH } from "../core/constants";
import type { MapGenerator } from "../core/types";
import { Button } from "./ui/Button";
import { MenuList } from "./ui/MenuList";
import styles from "./ControlPanel.module.css";

interface ControlPanelProps {
  generators: readonly MapGenerator[];
  generator: MapGenerator;
  seed: string;
  onGeneratorChange: (id: string) => void;
  onSeedChange: (seed: string) => void;
  onRandomSeed: () => void;
  // Botões de reprodução, entre a lista de algoritmos e a seed.
  children?: ReactNode;
}

export function ControlPanel({
  generators,
  generator,
  seed,
  onGeneratorChange,
  onSeedChange,
  onRandomSeed,
  children,
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

      {children}

      <div className={styles.field}>
        <label htmlFor="seed">Seed</label>
        <div className={styles.seedRow}>
          <input
            id="seed"
            className="px-frame-sm px-field"
            type="text"
            value={seed}
            maxLength={MAX_SEED_LENGTH}
            onChange={(event) => onSeedChange(event.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          <Button onClick={onRandomSeed}>Sortear</Button>
        </div>
      </div>
    </div>
  );
}
