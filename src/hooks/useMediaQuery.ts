import { useCallback, useSyncExternalStore } from "react";

// true enquanto a consulta de mídia vale. Acompanha as mudanças: girar o
// celular ou redimensionar a janela atualiza o valor.
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
