import { useRef, useState } from "react";
import { isCursorKey, moveCursor } from "./menuCursor";
import styles from "./MenuList.module.css";

export interface MenuOption<T extends string> {
  value: T;
  label: string;
}

interface MenuListProps<T extends string> {
  // Nome do grupo para leitores de tela.
  label: string;
  options: readonly MenuOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

// Menu de escolha única. As setas só movem o cursor; a escolha é confirmada
// com Enter, Espaço ou clique. Assim dá para passear pelas opções sem que
// cada movimento já troque o que está selecionado.
export function MenuList<T extends string>({
  label,
  options,
  value,
  onChange,
}: MenuListProps<T>) {
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  // Posição do cursor enquanto o menu tem o foco; null fora dele, quando o
  // cursor descansa na opção selecionada.
  const [focused, setFocused] = useState<number | null>(null);
  const cursor = focused ?? selected;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={styles.menu}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(null);
        }
      }}
      onKeyDown={(event) => {
        if (!isCursorKey(event.key)) return;
        // A tecla é do menu: a página não rola, e o evento para aqui para
        // não chegar aos atalhos globais (a seta direita daria um passo).
        event.preventDefault();
        event.stopPropagation();
        const next = moveCursor(cursor, event.key, options.length);
        itemsRef.current[next]?.focus();
      }}
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={(element) => {
            itemsRef.current[index] = element;
          }}
          type="button"
          role="radio"
          aria-checked={index === selected}
          // Só um item entra na ordem do Tab; os outros são alcançados
          // pelas setas.
          tabIndex={index === cursor ? 0 : -1}
          className={styles.item}
          data-cursor={index === cursor}
          onFocus={() => setFocused(index)}
          // Confirmar a opção que já está escolhida não é uma troca.
          onClick={() => {
            if (option.value !== value) onChange(option.value);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
