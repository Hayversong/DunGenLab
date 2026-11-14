import { useMediaQuery } from "./useMediaQuery";

// true quando a pessoa pediu ao sistema menos animação. Acompanha a mudança
// dessa preferência sem precisar recarregar a página.
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
