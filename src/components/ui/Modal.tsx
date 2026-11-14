import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { Window } from "./Window";
import styles from "./Modal.module.css";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  variant?: "blue" | "parchment";
  children: ReactNode;
}

// Janela por cima da tela. Usa o <dialog> do navegador, que já prende o foco
// dentro dela, fecha com Esc e devolve o foco ao botão que a abriu.
export function Modal({ open, onClose, title, variant, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      aria-label={title}
      // Dispara tanto no Esc quanto no botão Fechar.
      onClose={onClose}
      // Clique fora da janela (no fundo escurecido) também fecha.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Window title={title} variant={variant}>
        {children}
        <div className={styles.footer}>
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </Window>
    </dialog>
  );
}
