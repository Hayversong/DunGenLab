import { useEffect, useState } from "react";
import type { RefObject } from "react";

export interface ElementSize {
  width: number;
  height: number;
}

const EMPTY: ElementSize = { width: 0, height: 0 };

// Tamanho do miolo de um elemento, em pixels de CSS, sempre atualizado. O
// ResizeObserver avisa quando o elemento muda de tamanho por qualquer motivo
// (janela redimensionada, painel escondido), e não só quando a janela muda.
export function useElementSize(
  ref: RefObject<HTMLElement | null>,
): ElementSize {
  const [size, setSize] = useState(EMPTY);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      const width = Math.floor(box.width);
      const height = Math.floor(box.height);
      // Devolver o mesmo objeto quando nada mudou evita renderizar à toa.
      setSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
