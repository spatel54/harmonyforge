import type { Dispatch, SetStateAction } from "react";
import type { RiffScoreSessionHandles } from "@/context/RiffScoreSessionContext";
import type { EditableScore } from "@/lib/music/scoreTypes";
import { insertNote, setPitchByLetter } from "@/lib/music/scoreUtils";
import { isTypingTarget } from "@/lib/ui/isTypingTarget";
import type { NoteSelection } from "@/store/useScoreStore";
import { useScoreStore } from "@/store/useScoreStore";
import {
  scheduleNaturalDiatonicStep,
  scheduleTransposeNaturalLetters,
} from "./sandboxScoreTranspose";

const NOTE_DURATION_TOOLS = new Set([
  "duration-whole",
  "duration-half",
  "duration-quarter",
  "duration-eighth",
  "duration-16th",
  "duration-32nd",
]);

const DURATION_CHAIN = [
  "duration-32nd",
  "duration-16th",
  "duration-eighth",
  "duration-quarter",
  "duration-half",
  "duration-whole",
] as const;

const CODE_TO_DURATION_TOOL: Record<string, string> = {
  Digit1: "duration-32nd",
  Digit2: "duration-16th",
  Digit3: "duration-eighth",
  Digit4: "duration-quarter",
  Digit5: "duration-half",
  Digit6: "duration-whole",
  Numpad1: "duration-32nd",
  Numpad2: "duration-16th",
  Numpad3: "duration-eighth",
  Numpad4: "duration-quarter",
  Numpad5: "duration-half",
  Numpad6: "duration-whole",
};

export type SandboxScoreKeyboardCtx = {
  notationMode: string;
  score: EditableScore | null;
  selection: NoteSelection[];
  activeTool: string | null;
  /** Active duration for A–G / 0 step-time entry (from sandbox `durationForInput`). */
  noteEntryDuration: "w" | "h" | "q" | "8" | "16" | "32";
  getSession: () => RiffScoreSessionHandles | null;
  clearSelection: () => void;
  setSelection: (s: NoteSelection[]) => void;
  setActiveTool: (toolId: string | null) => void;
  setIsPaletteOpen: Dispatch<SetStateAction<boolean>>;
  handleToolSelect: (toolId: string) => void;
  applyScore: (next: EditableScore) => void;
  resolveInsertionTarget: () => {
    partId: string;
    measureIndex: number;
    noteIndex: number;
    beat: number;
  } | null;
  moveCursorHorizontally: (direction: -1 | 1) => void;
  moveCursorVertically: (direction: -1 | 1) => void;
  openHotkeyHelp?: () => void;
};

function isNoteInputMode(activeTool: string | null): boolean {
  return Boolean(activeTool && NOTE_DURATION_TOOLS.has(activeTool));
}

function stepActiveDurationTool(activeTool: string | null, direction: -1 | 1): string {
  const idx = DURATION_CHAIN.indexOf(activeTool as (typeof DURATION_CHAIN)[number]);
  const base = idx >= 0 ? idx : 3;
  const next = Math.max(0, Math.min(DURATION_CHAIN.length - 1, base + direction));
  return DURATION_CHAIN[next];
}

function selectionNoteIds(ctx: SandboxScoreKeyboardCtx): Set<string> {
  const session = ctx.getSession();
  return session?.getPitchGroupNoteIds() ?? new Set(ctx.selection.map((s) => s.noteId));
}

function canTranspose(ctx: SandboxScoreKeyboardCtx): boolean {
  if (!ctx.score) return false;
  const session = ctx.getSession();
  if (session && session.getTransposeTargetNoteIds().size > 0) return true;
  return ctx.selection.length > 0;
}

/**
 * Global capture-phase handler for `/sandbox` score editing.
 * Arrow ↑/↓ with selection: diatonic white-key step (no #/b in stored pitches).
 * ⌘/Ctrl+↑/↓: octave (±12 MIDI) then natural letter spelling.
 */
export function handleSandboxScoreKeyDown(e: KeyboardEvent, ctx: SandboxScoreKeyboardCtx): void {
  if (isTypingTarget(e.target)) return;
  if (ctx.notationMode !== "edit") return;
  if (!ctx.score) return;

  const session = ctx.getSession();
  const mod = e.metaKey || e.ctrlKey;

  // —— Help: ? (Shift+/) ——
  if (ctx.openHotkeyHelp && !mod && !e.altKey && e.key === "?") {
    e.preventDefault();
    ctx.openHotkeyHelp();
    return;
  }

  // —— Palette ——
  if (e.code === "F9") {
    e.preventDefault();
    ctx.setIsPaletteOpen((o) => !o);
    return;
  }

  // —— Escape ——
  if (e.code === "Escape") {
    e.preventDefault();
    ctx.clearSelection();
    session?.editorDeselectAll();
    return;
  }

  // —— Undo / redo ——
  if (mod && e.code === "KeyZ" && !e.altKey) {
    e.preventDefault();
    if (e.shiftKey) ctx.handleToolSelect("edit-redo");
    else ctx.handleToolSelect("edit-undo");
    return;
  }
  if (mod && e.code === "KeyY" && !e.shiftKey && !e.altKey) {
    e.preventDefault();
    ctx.handleToolSelect("edit-redo");
    return;
  }

  // —— Clipboard ——
  if (mod && e.code === "KeyC" && !e.altKey) {
    e.preventDefault();
    ctx.handleToolSelect("edit-copy");
    return;
  }
  if (mod && e.code === "KeyX" && !e.altKey) {
    e.preventDefault();
    ctx.handleToolSelect("edit-cut");
    return;
  }
  if (mod && e.code === "KeyV" && !e.altKey) {
    e.preventDefault();
    ctx.handleToolSelect("edit-paste");
    return;
  }
  if (mod && e.code === "KeyA" && !e.altKey) {
    e.preventDefault();
    session?.editorSelectAll();
    return;
  }

  // —— Delete selection ——
  if ((e.code === "Delete" || e.code === "Backspace") && !mod && !e.altKey) {
    if (ctx.selection.length === 0) return;
    e.preventDefault();
    ctx.handleToolSelect("edit-delete");
    return;
  }

  // —— Repitch / note-input mode ——
  if (!mod && !e.altKey && e.code === "KeyR") {
    e.preventDefault();
    ctx.setActiveTool(ctx.activeTool === "mode-repitch" ? "duration-quarter" : "mode-repitch");
    return;
  }
  if (!mod && !e.altKey && e.code === "KeyN") {
    e.preventDefault();
    ctx.handleToolSelect("duration-quarter");
    return;
  }

  // —— Duration shorter / longer ([ ]) ——
  if (!mod && !e.altKey && (e.code === "BracketLeft" || e.code === "BracketRight")) {
    e.preventDefault();
    const dir = e.code === "BracketLeft" ? (-1 as const) : (1 as const);
    ctx.handleToolSelect(stepActiveDurationTool(ctx.activeTool, dir));
    return;
  }

  // —— Rest / toggle rests (0) ——
  if (!mod && !e.altKey && (e.code === "Digit0" || e.code === "Numpad0")) {
    e.preventDefault();
    if (ctx.selection.length > 0) ctx.handleToolSelect("duration-rest-toggle");
    else ctx.handleToolSelect("insert-rest");
    return;
  }

  // —— Duration 1–6 (with selection → `handleToolSelect`; without → active tool) ——
  const durTool = CODE_TO_DURATION_TOOL[e.code];
  if (durTool && !mod && !e.altKey) {
    e.preventDefault();
    ctx.handleToolSelect(durTool);
    return;
  }

  // —— Diatonic white-key step / natural-letter octave (↑↓) ——
  if ((e.code === "ArrowUp" || e.code === "ArrowDown") && !e.altKey) {
    const up = e.code === "ArrowUp";
    const fallbackIds = new Set(ctx.selection.map((s) => s.noteId));
    if (canTranspose(ctx)) {
      e.preventDefault();
      e.stopPropagation();
      if (mod) {
        scheduleTransposeNaturalLetters(session, up ? 12 : -12, fallbackIds);
      } else {
        scheduleNaturalDiatonicStep(session, up ? 1 : -1, fallbackIds);
      }
      return;
    }
    if (!mod && isNoteInputMode(ctx.activeTool)) {
      e.preventDefault();
      ctx.moveCursorVertically(up ? -1 : 1);
      return;
    }
    return;
  }

  // —— Cursor ← → (step-time, no modifier) ——
  if ((e.code === "ArrowLeft" || e.code === "ArrowRight") && !mod && !e.altKey) {
    if (ctx.selection.length > 0) return;
    e.preventDefault();
    ctx.moveCursorHorizontally(e.code === "ArrowLeft" ? -1 : 1);
    return;
  }

  // —— Pitch letters A–G ——
  const letterMatch = /^Key([A-G])$/.exec(e.code);
  if (letterMatch && !mod && !e.altKey) {
    const letter = letterMatch[1]!;
    e.preventDefault();
    const ids = selectionNoteIds(ctx);
    session?.flushToZustand();
    const live = useScoreStore.getState().score ?? ctx.score;
    if (ids.size > 0) {
      ctx.applyScore(setPitchByLetter(live, ids, letter));
      return;
    }
    const target = ctx.resolveInsertionTarget();
    if (!target) return;
    ctx.applyScore(
      insertNote(live, target.partId, target.measureIndex, target.noteIndex, {
        pitch: `${letter}4`,
        duration: ctx.noteEntryDuration,
        isRest: false,
      }),
    );
    return;
  }

  // —— Tie ——
  if (e.code === "Comma" && !mod && !e.altKey) {
    if (ctx.selection.length === 0) return;
    e.preventDefault();
    ctx.handleToolSelect("duration-tie");
    return;
  }

  // —— Accidentals + - = ——
  if (!mod && !e.altKey) {
    if (e.code === "Equal" || e.code === "NumpadEqual") {
      if (ctx.selection.length === 0) return;
      e.preventDefault();
      ctx.handleToolSelect("pitch-accidental-natural");
      return;
    }
    if (e.code === "Minus" || e.code === "NumpadSubtract") {
      if (ctx.selection.length === 0) return;
      e.preventDefault();
      ctx.handleToolSelect("pitch-accidental-flat");
      return;
    }
    if (e.code === "Plus" || e.code === "NumpadAdd") {
      if (ctx.selection.length === 0) return;
      e.preventDefault();
      ctx.handleToolSelect("pitch-accidental-sharp");
      return;
    }
  }
}
