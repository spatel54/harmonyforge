/** @vitest-environment happy-dom */

import { describe, expect, it, vi } from "vitest";

import type { EditableScore } from "@/lib/music/scoreTypes";
import {
  handleSandboxScoreKeyDown,
  type SandboxScoreKeyboardCtx,
} from "./sandboxScoreKeyboard";

const score: EditableScore = {
  divisions: 1,
  bpm: 96,
  parts: [
    {
      id: "P1",
      name: "Melody",
      clef: "treble",
      measures: [
        {
          id: "m1",
          timeSignature: "4/4",
          notes: [{ id: "n1", pitch: "C4", duration: "q" }],
        },
      ],
    },
  ],
};

function makeCtx(
  overrides: Partial<SandboxScoreKeyboardCtx> = {},
): SandboxScoreKeyboardCtx {
  return {
    notationMode: "edit",
    score,
    selection: [{ partId: "P1", measureIndex: 0, noteIndex: 0, noteId: "n1" }],
    activeTool: "duration-quarter",
    noteEntryDuration: "q",
    getSession: () => null,
    clearSelection: vi.fn(),
    setSelection: vi.fn(),
    setActiveTool: vi.fn(),
    setIsPaletteOpen: vi.fn(),
    handleToolSelect: vi.fn(),
    applyScore: vi.fn(),
    resolveInsertionTarget: () => ({
      partId: "P1",
      measureIndex: 0,
      noteIndex: 0,
      beat: 0,
    }),
    moveCursorHorizontally: vi.fn(),
    moveCursorVertically: vi.fn(),
    ...overrides,
  };
}

function dispatch(
  ctx: SandboxScoreKeyboardCtx,
  init: KeyboardEventInit & { code: string },
  target?: HTMLElement,
): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  if (target) {
    Object.defineProperty(event, "target", { value: target });
  }
  handleSandboxScoreKeyDown(event, ctx);
  return event;
}

describe("handleSandboxScoreKeyDown clipboard and history", () => {
  it("maps ⌘C / ⌘V / ⌘Z / ⇧⌘Z and stops the event so RiffScore cannot double-handle", () => {
    const ctx = makeCtx();
    const copy = dispatch(ctx, { code: "KeyC", key: "c", metaKey: true });
    const paste = dispatch(ctx, { code: "KeyV", key: "v", metaKey: true });
    const undo = dispatch(ctx, { code: "KeyZ", key: "z", metaKey: true });
    const redo = dispatch(ctx, {
      code: "KeyZ",
      key: "z",
      metaKey: true,
      shiftKey: true,
    });

    expect(ctx.handleToolSelect).toHaveBeenCalledWith("edit-copy");
    expect(ctx.handleToolSelect).toHaveBeenCalledWith("edit-paste");
    expect(ctx.handleToolSelect).toHaveBeenCalledWith("edit-undo");
    expect(ctx.handleToolSelect).toHaveBeenCalledWith("edit-redo");
    expect(copy.defaultPrevented).toBe(true);
    expect(paste.defaultPrevented).toBe(true);
    expect(undo.defaultPrevented).toBe(true);
    expect(redo.defaultPrevented).toBe(true);
  });

  it("still copies a note when a combobox (instrument picker) is focused", () => {
    const ctx = makeCtx();
    const box = document.createElement("div");
    box.setAttribute("role", "combobox");
    document.body.appendChild(box);
    dispatch(ctx, { code: "KeyC", key: "c", metaKey: true }, box);
    expect(ctx.handleToolSelect).toHaveBeenCalledWith("edit-copy");
    box.remove();
  });

  it("does not steal ⌘C from the Theory Inspector composer", () => {
    const ctx = makeCtx();
    const area = document.createElement("textarea");
    document.body.appendChild(area);
    dispatch(ctx, { code: "KeyC", key: "c", metaKey: true }, area);
    expect(ctx.handleToolSelect).not.toHaveBeenCalled();
    area.remove();
  });
});
