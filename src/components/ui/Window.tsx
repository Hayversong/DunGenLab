import { useId } from "react";
import type { ReactNode } from "react";
import styles from "./Window.module.css";

interface WindowProps {
  title?: string;
  // "blue" é a janela de menu; "parchment" é para blocos de leitura.
  variant?: "blue" | "parchment";
  className?: string;
  children: ReactNode;
}

export function Window({
  title,
  variant = "blue",
  className,
  children,
}: WindowProps) {
  const titleId = useId();
  const classes = ["px-frame", styles.window, styles[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes} aria-labelledby={title ? titleId : undefined}>
      {title && (
        <h2 id={titleId} className={`px-title ${styles.title}`}>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
