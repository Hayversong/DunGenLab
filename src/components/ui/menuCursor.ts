const NEXT_KEYS = ["ArrowDown", "ArrowRight"];
const PREVIOUS_KEYS = ["ArrowUp", "ArrowLeft"];

// Teclas que o menu usa para mover o cursor. Em um grupo de opções, as setas
// para os lados valem o mesmo que as de cima e baixo.
export function isCursorKey(key: string): boolean {
  return (
    NEXT_KEYS.includes(key) ||
    PREVIOUS_KEYS.includes(key) ||
    key === "Home" ||
    key === "End"
  );
}

// Para onde o cursor do menu vai quando uma tecla é apertada. Dá a volta nas
// pontas, como em um menu de jogo. Tecla que não move o cursor devolve a
// mesma posição.
export function moveCursor(index: number, key: string, length: number): number {
  if (length <= 0) return 0;
  if (NEXT_KEYS.includes(key)) return (index + 1) % length;
  if (PREVIOUS_KEYS.includes(key)) return (index - 1 + length) % length;
  if (key === "Home") return 0;
  if (key === "End") return length - 1;
  return index;
}
