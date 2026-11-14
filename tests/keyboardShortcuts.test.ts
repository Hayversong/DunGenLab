import { describe, expect, it } from "vitest";
import { shortcutFor } from "../src/hooks/useKeyboardShortcuts";
import type { FocusInfo } from "../src/hooks/useKeyboardShortcuts";

const body: FocusInfo = { tagName: "BODY" };
const seedField: FocusInfo = { tagName: "INPUT", type: "text" };
const slider: FocusInfo = { tagName: "INPUT", type: "range" };
const button: FocusInfo = { tagName: "BUTTON", type: "button" };
const list: FocusInfo = { tagName: "SELECT" };

describe("shortcutFor", () => {
  it("com o foco na página, cada tecla tem a sua ação", () => {
    expect(shortcutFor({ key: " " }, body)).toBe("toggle");
    expect(shortcutFor({ key: "ArrowRight" }, body)).toBe("step");
    expect(shortcutFor({ key: "r" }, body)).toBe("reset");
    expect(shortcutFor({ key: "R" }, body)).toBe("reset");
    expect(shortcutFor({ key: "f" }, body)).toBe("display");
    expect(shortcutFor({ key: "F" }, body)).toBe("display");
  });

  it("F não dispara em campo de texto, em lista nem com a tecla segurada", () => {
    expect(shortcutFor({ key: "f" }, seedField)).toBeNull();
    expect(shortcutFor({ key: "f" }, list)).toBeNull();
    expect(shortcutFor({ key: "f", repeat: true }, body)).toBeNull();
    expect(shortcutFor({ key: "f", ctrlKey: true }, body)).toBeNull();
    expect(shortcutFor({ key: "f" }, button)).toBe("display");
  });

  it("funciona sem elemento em foco", () => {
    expect(shortcutFor({ key: " " }, null)).toBe("toggle");
  });

  it("ignora teclas que não são atalho", () => {
    for (const key of ["a", "Enter", "ArrowLeft", "Escape", "Tab"]) {
      expect(shortcutFor({ key }, body)).toBeNull();
    }
  });

  it("não dispara nada enquanto se digita em um campo de texto", () => {
    const typing: FocusInfo[] = [
      seedField,
      { tagName: "INPUT" },
      { tagName: "INPUT", type: "number" },
      { tagName: "TEXTAREA" },
      { tagName: "DIV", isContentEditable: true },
    ];
    for (const focus of typing) {
      for (const key of [" ", "ArrowRight", "r", "R"]) {
        expect(shortcutFor({ key }, focus)).toBeNull();
      }
    }
  });

  it("deixa o Espaço para o botão ou a lista em foco", () => {
    expect(shortcutFor({ key: " " }, button)).toBeNull();
    expect(shortcutFor({ key: " " }, list)).toBeNull();
    expect(shortcutFor({ key: " " }, slider)).toBeNull();
  });

  it("deixa a seta para o controle deslizante ou a lista em foco", () => {
    expect(shortcutFor({ key: "ArrowRight" }, slider)).toBeNull();
    expect(shortcutFor({ key: "ArrowRight" }, list)).toBeNull();
    expect(shortcutFor({ key: "ArrowRight" }, button)).toBe("step");
  });

  it("R vale em botão e controle deslizante, mas não em lista", () => {
    expect(shortcutFor({ key: "r" }, button)).toBe("reset");
    expect(shortcutFor({ key: "r" }, slider)).toBe("reset");
    expect(shortcutFor({ key: "r" }, list)).toBeNull();
  });

  it("não rouba combinações com Ctrl, Alt ou Cmd", () => {
    expect(shortcutFor({ key: "r", ctrlKey: true }, body)).toBeNull();
    expect(shortcutFor({ key: "r", metaKey: true }, body)).toBeNull();
    expect(shortcutFor({ key: "ArrowRight", altKey: true }, body)).toBeNull();
  });

  it("tecla segurada repete o passo, mas não o play/pause nem o reinício", () => {
    expect(shortcutFor({ key: "ArrowRight", repeat: true }, body)).toBe("step");
    expect(shortcutFor({ key: " ", repeat: true }, body)).toBeNull();
    expect(shortcutFor({ key: "r", repeat: true }, body)).toBeNull();
  });
});
