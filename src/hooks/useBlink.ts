import { useEffect, useState } from "react";

// Alterna entre true e false a cada `interval` ms enquanto `active` vale.
// Parado, devolve sempre true.
export function useBlink(active: boolean, interval: number): boolean {
  const [on, setOn] = useState(true);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setOn((current) => !current), interval);
    return () => clearInterval(timer);
  }, [active, interval]);

  return active ? on : true;
}
