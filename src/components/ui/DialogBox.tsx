import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import styles from "./DialogBox.module.css";

interface DialogBoxProps {
  text: string;
  // true mostra o texto inteiro de uma vez. Usado quando ele muda rápido
  // demais para ser "digitado", como durante a animação.
  instant?: boolean;
  // Como um leitor de tela trata as mudanças: "off" não anuncia.
  live?: "off" | "polite";
}

// Milissegundos entre uma letra e outra.
const TYPE_INTERVAL = 24;

interface TypedTextProps {
  text: string;
}

// Mostra o texto letra a letra. Um clique mostra o resto de uma vez.
function TypedText({ text }: TypedTextProps) {
  const [count, setCount] = useState(0);
  const done = count >= text.length;
  const length = text.length;

  useEffect(() => {
    if (done) return;
    // A contagem sai do tempo passado, não de um contador por tique: as
    // letras chegam junto com os quadros da tela, num ritmo constante, sem
    // tropeços quando um tique atrasa.
    const start = performance.now();
    let frameId = requestAnimationFrame(function tick(now) {
      const next = Math.min(
        length,
        Math.floor((now - start) / TYPE_INTERVAL) + 1,
      );
      setCount((c) => Math.max(c, next));
      if (next < length) frameId = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frameId);
  }, [done, length]);

  return (
    // O clique vale na caixa inteira: no começo ainda não há letra nenhuma
    // onde clicar.
    <div
      className={styles.typed}
      aria-hidden="true"
      data-done={done}
      onClick={() => setCount(text.length)}
    >
      {text.slice(0, count)}
    </div>
  );
}

export function DialogBox({
  text,
  instant = false,
  live = "polite",
}: DialogBoxProps) {
  const reducedMotion = usePrefersReducedMotion();
  const typed = !instant && !reducedMotion;

  return (
    <div className={`px-frame ${styles.dialog}`}>
      {/* O leitor de tela recebe sempre o texto inteiro, de uma vez. */}
      <p
        className={typed ? "sr-only" : styles.text}
        role="status"
        aria-live={live}
      >
        {text}
      </p>
      {/* A chave recria o componente a cada texto novo, zerando a contagem. */}
      {typed && <TypedText key={text} text={text} />}
    </div>
  );
}
