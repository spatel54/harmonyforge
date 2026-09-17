import type { Dispatch, SetStateAction } from "react";
import type { RiffScoreSessionHandles } from "@/context/RiffScoreSessionContext";
import type { EditableScore } from "@/lib/music/scoreTypes";
import { insertNote, setPitchByLetter } from "@/lib/music/scoreUtils";
import { isEditableTextTarget, isTypingTarget } from "@/lib/ui/isTypingTarget";
import type { NoteSelection } from "@/store/useScoreStore";
import { useScoreStore } from "@/store/useScoreStore";
import {
  scheduleNaturalDiatonicStep,
  scheduleTransposeNaturalLetters,
} from "./sandboxScoreTranspose";
import {
  hasDeletableEditorSelection,
  scheduleDeleteSelectionAsRests,
} from "./deleteSelectionAsRests";
import {
  durationTypeFromToolId,
  hasDurationEditableSelection,
  scheduleSetNoteDurations,
} from "./setNoteDurationOnSelection";

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

/** Stop RiffScore's bubble-phase listener from also handling the same shortcut. */
export function claimScoreShortcut(e: KeyboardEvent): void {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
}

function isClipboardOrHistoryShortcut(e: KeyboardEvent, mod: boolean): boolean {
  if (!mod || e.altKey) return false;
  return (
    e.code === "KeyC" ||
    e.code === "KeyX" ||
    e.code === "KeyV" ||
    e.code === "KeyZ" ||
    e.code === "KeyY" ||
    e.code === "KeyA"
  );
}

/**
 * Global capture-phase handler for `/sandbox` score editing.
 * Arrow ↑/↓ with selection: diatonic white-key step (no #/b in stored pitches).
 * ⌘/Ctrl+↑/↓: octave (±12 MIDI) then natural letter spelling.
 */
export function handleSandboxScoreKeyDown(e: KeyboardEvent, ctx: SandboxScoreKeyboardCtx): void {
  if (ctx.notationMode !== "edit") return;
  if (!ctx.score) return;

  const session = ctx.getSession();
  const mod = e.metaKey || e.ctrlKey;
  const clipboardOrHistory = isClipboardOrHistoryShortcut(e, mod);

  // Chat / lyrics keep native copy-paste and undo. Combobox + BPM do not block note shortcuts.
  if (clipboardOrHistory) {
    if (isEditableTextTarget(e.target)) return;
  } else if (isTypingTarget(e.target)) {
    return;
  }

  // —— Help: ? (Shift+/) ——
  if (ctx.openHotkeyHelp && !mod && !e.altKey && e.key === "?") {
    claimScoreShortcut(e);
    ctx.openHotkeyHelp();
    return;
  }

  // —— Palette ——
  if (e.code === "F9") {
    claimScoreShortcut(e);
    ctx.setIsPaletteOpen((o) => !o);
    return;
  }

  // —— Escape ——
  if (e.code === "Escape") {
    claimScoreShortcut(e);
    ctx.clearSelection();
    session?.editorDeselectAll();
    return;
  }

  // —— Undo / redo (⌘Z must not also run RiffScore undo — that skips / "redoes") ——
  if (mod && e.code === "KeyZ" && !e.altKey) {
    claimScoreShortcut(e);
    if (e.shiftKey) ctx.handleToolSelect("edit-redo");
    else ctx.handleToolSelect("edit-undo");
    return;
  }
  if (mod && e.code === "KeyY" && !e.shiftKey && !e.altKey) {
    claimScoreShortcut(e);
    ctx.handleToolSelect("edit-redo");
    return;
  }

  // —— Clipboard ——
  if (mod && e.code === "KeyC" && !e.altKey) {
    claimScoreShortcut(e);
    ctx.handleToolSelect("edit-copy");
    return;
  }
  if (mod && e.code === "KeyX" && !e.altKey) {
    claimScoreShortcut(e);
    ctx.handleToolSelect("edit-cut");
    return;
  }
  if (mod && e.code === "KeyV" && !e.altKey) {
    claimScoreShortcut(e);
    ctx.handleToolSelect("edit-paste");
    return;
  }
  if (mod && e.code === "KeyA" && !e.altKey) {
    claimScoreShortcut(e);
    session?.editorSelectAll();
    return;
  }

  // —— Delete selection (rest placeholders; block RiffScore event removal) ——
  if ((e.code === "Delete" || e.code === "Backspace") && !mod && !e.altKey) {
    const fallback = new Set(ctx.selection.map((s) => s.noteId));
    if (!hasDeletableEditorSelection(session, fallback)) return;
    claimScoreShortcut(e);
    scheduleDeleteSelectionAsRests(session, fallback, () => {
      ctx.clearSelection();
      session?.editorDeselectAll();
    });
    return;
  }

  // —— Repitch / note-input mode ——
  if (!mod && !e.altKey && e.code === "KeyR") {
    claimScoreShortcut(e);
    ctx.setActiveTool(ctx.activeTool === "mode-repitch" ? "duration-quarter" : "mode-repitch");
    return;
  }
  if (!mod && !e.altKey && e.code === "KeyN") {
    claimScoreShortcut(e);
    ctx.handleToolSelect("duration-quarter");
    return;
  }

  // —— Duration shorter / longer ([ ]) ——
  if (!mod && !e.altKey && (e.code === "BracketLeft" || e.code === "BracketRight")) {
    claimScoreShortcut(e);
    const dir = e.code === "BracketLeft" ? (-1 as const) : (1 as const);
    const nextTool = stepActiveDurationTool(ctx.activeTool, dir);
    const fallback = new Set(ctx.selection.map((s) => s.noteId));
    if (hasDurationEditableSelection(session, fallback)) {
      const dur = durationTypeFromToolId(nextTool);
      if (dur) {
        scheduleSetNoteDurations(session, dur, fallback);
        ctx.setActiveTool(nextTool);
        return;
      }
    }
    ctx.setActiveTool(nextTool);
    return;
  }

  // —— Rest / toggle rests (0) ——
  if (!mod && !e.altKey && (e.code === "Digit0" || e.code === "Numpad0")) {
    claimScoreShortcut(e);
    if (ctx.selection.length > 0) ctx.handleToolSelect("duration-rest-toggle");
    else ctx.handleToolSelect("insert-rest");
    return;
  }

  // —— Duration 1–6 (with selection → `handleToolSelect`; without → active tool) ——
  const durTool = CODE_TO_DURATION_TOOL[e.code];
  if (durTool && !mod && !e.altKey) {
    claimScoreShortcut(e);
    ctx.handleToolSelect(durTool);
    return;
  }

  // —— Diatonic white-key step / natural-letter octave (↑↓) ——
  if ((e.code === "ArrowUp" || e.code === "ArrowDown") && !e.altKey) {
    const up = e.code === "ArrowUp";
    const fallbackIds = new Set(ctx.selection.map((s) => s.noteId));
    if (canTranspose(ctx)) {
      claimScoreShortcut(e);
      if (mod) {
        scheduleTransposeNaturalLetters(session, up ? 12 : -12, fallbackIds);
      } else {
        scheduleNaturalDiatonicStep(session, up ? 1 : -1, fallbackIds);
      }
      return;
    }
    if (!mod && isNoteInputMode(ctx.activeTool)) {
      claimScoreShortcut(e);
      ctx.moveCursorVertically(up ? -1 : 1);
      return;
    }
    return;
  }

  // —— Cursor ← → (step-time, no modifier) ——
  if ((e.code === "ArrowLeft" || e.code === "ArrowRight") && !mod && !e.altKey) {
    if (ctx.selection.length > 0) return;
    claimScoreShortcut(e);
    ctx.moveCursorHorizontally(e.code === "ArrowLeft" ? -1 : 1);
    return;
  }

  // —— Pitch letters A–G ——
  const letterMatch = /^Key([A-G])$/.exec(e.code);
  if (letterMatch && !mod && !e.altKey) {
    const letter = letterMatch[1]!;
    claimScoreShortcut(e);
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
    claimScoreShortcut(e);
    ctx.handleToolSelect("duration-tie");
    return;
  }

  // —— Accidentals + - = ——
  if (!mod && !e.altKey) {
    if (e.code === "Equal" || e.code === "NumpadEqual") {
      if (ctx.selection.length === 0) return;
      claimScoreShortcut(e);
      ctx.handleToolSelect("pitch-accidental-natural");
      return;
    }
    if (e.code === "Minus" || e.code === "NumpadSubtract") {
      if (ctx.selection.length === 0) return;
      claimScoreShortcut(e);
      ctx.handleToolSelect("pitch-accidental-flat");
      return;
    }
    if (e.code === "Plus" || e.code === "NumpadAdd") {
      if (ctx.selection.length === 0) return;
      claimScoreShortcut(e);
      ctx.handleToolSelect("pitch-accidental-sharp");
      return;
    }
  }
}
