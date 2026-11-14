import type { ComponentProps } from "react";
import styles from "./Button.module.css";

interface ButtonProps extends ComponentProps<"button"> {
  // "primary" é a ação principal da tela, em ouro.
  variant?: "default" | "primary";
}

export function Button({
  variant = "default",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = ["px-frame-sm", styles.button, styles[variant], className]
    .filter(Boolean)
    .join(" ");
  return <button type={type} className={classes} {...rest} />;
}
