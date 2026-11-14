import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { moveCursor } from "./menuCursor";
import { Window } from "./Window";
import styles from "./Tabs.module.css";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  // Nome do conjunto de abas para leitores de tela.
  label: string;
  tabs: readonly TabItem[];
}

const TAB_KEYS = ["ArrowLeft", "ArrowRight", "Home", "End"];

// Abas: só um painel aparece por vez. As setas para os lados trocam de aba,
// como manda o padrão de acessibilidade para tablist.
export function Tabs({ label, tabs }: TabsProps) {
  const baseId = useId();
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const active = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeId),
  );

  return (
    <div className={styles.tabs}>
      <div
        role="tablist"
        aria-label={label}
        className={styles.list}
        onKeyDown={(event) => {
          if (!TAB_KEYS.includes(event.key)) return;
          // A seta direita é das abas aqui, não o atalho de "passo".
          event.preventDefault();
          event.stopPropagation();
          const next = moveCursor(active, event.key, tabs.length);
          setActiveId(tabs[next]?.id);
          buttonsRef.current[next]?.focus();
        }}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(element) => {
              buttonsRef.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${tab.id}`}
            aria-selected={index === active}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={index === active ? 0 : -1}
            className={`px-frame-sm ${styles.tab}`}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Os painéis inativos continuam montados, só escondidos: assim o que
          foi mexido em uma aba não se perde ao visitar outra. */}
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={index !== active}
          className={styles.panel}
        >
          <Window>{tab.content}</Window>
        </div>
      ))}
    </div>
  );
}
