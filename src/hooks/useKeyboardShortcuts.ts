import { useEffect, useRef } from "react";

export type ShortcutAction = "toggle" | "step" | "reset" | "display";

// Só o que a decisão precisa saber da tecla e de onde o foco está. Com isso a
// regra pode ser testada sem navegador.
export interface KeyInfo {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  // true quando a tecla está sendo segurada e o sistema a repete.
  repeat?: boolean;
}

export interface FocusInfo {
  tagName: string;
  type?: string;
  isContentEditable?: boolean;
}

// Tipos de <input> em que a pessoa digita texto.
const TYPING_INPUTS = new Set([
  "text",
  "search",
  "email",
  "url",
  "tel",
  "password",
  "number",
]);

function isTyping(focus: FocusInfo): boolean {
  const tag = focus.tagName.toLowerCase();
  if (focus.isContentEditable || tag === "textarea") return true;
  return tag === "input" && TYPING_INPUTS.has(focus.type ?? "text");
}

// Diz qual ação a tecla dispara, ou null se ela deve seguir o caminho normal
// do navegador. O atalho cede a vez sempre que o elemento em foco já usa
// aquela tecla para outra coisa.
export function shortcutFor(
  key: KeyInfo,
  focus: FocusInfo | null,
): ShortcutAction | null {
  // Ctrl+R recarrega a página, Alt+seta volta no histórico: não são nossos.
  if (key.ctrlKey || key.metaKey || key.altKey) return null;

  const tag = focus?.tagName.toLowerCase() ?? "";
  // Quem está digitando a seed quer um espaço ou um "r" no texto.
  if (focus && isTyping(focus)) return null;

  switch (key.key) {
    case " ":
      // Espaço já aciona botões, abre listas e marca caixas.
      if (["button", "select", "input", "a", "summary"].includes(tag)) {
        return null;
      }
      return key.repeat ? null : "toggle";
    case "ArrowRight":
      // As setas movem controles deslizantes e trocam a opção de listas.
      if (tag === "input" || tag === "select") return null;
      return "step";
    case "r":
    case "R":
      // Em uma lista, digitar uma letra pula para a opção que começa com ela.
      if (tag === "select") return null;
      return key.repeat ? null : "reset";
    case "f":
    case "F":
      if (tag === "select") return null;
      return key.repeat ? null : "display";
    default:
      return null;
  }
}

export type ShortcutHandlers = Record<ShortcutAction, () => void>;

// `enabled` falso desliga os atalhos sem mexer nas teclas: com uma janela
// aberta por cima, o Espaço precisa continuar rolando o conteúdo dela.
export function useKeyboardShortcuts(
  handlers: ShortcutHandlers,
  enabled: boolean = true,
): void {
  // As funções mudam a cada renderização; guardá-las em uma ref deixa o
  // ouvinte de teclado ser registrado uma vez só.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const action = shortcutFor(
        event,
        target && {
          tagName: target.tagName,
          type: target instanceof HTMLInputElement ? target.type : undefined,
          isContentEditable: target.isContentEditable,
        },
      );
      if (!action) return;
      // Sem isto, o Espaço também rolaria a página.
      event.preventDefault();
      handlersRef.current[action]();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
