import { create } from "zustand";
import type { EditableScore, Note } from "@/lib/music/scoreTypes";
import { cloneScore, deleteNotesAsRests, normalizeScoreRests } from "@/lib/music/scoreUtils";
import { generateId } from "@/lib/music/scoreTypes";

export interface NoteSelection {
  partId: string;
  measureIndex: number;
  noteIndex: number;
  noteId: string;
}

const MAX_HISTORY = 50;

export interface ScoreState {
  score: EditableScore | null;
  history: EditableScore[];
  historyIndex: number;
  visibleParts: Set<string>;
  setVisibleParts: (parts: Set<string>) => void;
  togglePartVisibility: (partId: string) => void;
  setScore: (score: EditableScore | null) => void;
  pushState: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  deleteSelection: (noteIds: string[]) => void;
  applyScore: (nextScore: EditableScore) => void;
  /** Replace score from RiffScore flush; does not grow Zustand history (RiffScore owns edit undo). */
  replaceScoreFromEditor: (nextScore: EditableScore) => void;
}

export const useScoreStore = create<ScoreState>((set, get) => ({
  score: null,
  history: [],
  historyIndex: -1,
  visibleParts: new Set<string>(),
  setVisibleParts: (visibleParts) => set({ visibleParts }),
  togglePartVisibility: (partId) => {
    const { visibleParts } = get();
    const next = new Set(visibleParts);
    if (next.has(partId)) next.delete(partId);
    else next.add(partId);
    set({ visibleParts: next });
  },
  setScore: (score) => {
    const normalized = score ? normalizeScoreRests(score) : null;
    set({
      score: normalized,
      history: normalized ? [cloneScore(normalized)] : [],
      historyIndex: normalized ? 0 : -1,
      canUndo: false,
      canRedo: false,
      visibleParts: normalized ? new Set(normalized.parts.map((p) => p.id)) : new Set(),
    });
  },
  pushState: () => {
    const { score } = get();
    if (!score) return;
    const { history, historyIndex } = get();
    const trimmed = history.slice(0, historyIndex + 1);
    trimmed.push(cloneScore(score));
    if (trimmed.length > MAX_HISTORY) trimmed.shift();
    set({
      history: trimmed,
      historyIndex: trimmed.length - 1,
      canUndo: trimmed.length > 1,
      canRedo: false,
    });
  },
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    set({
      score: cloneScore(history[nextIndex]),
      historyIndex: nextIndex,
      canUndo: nextIndex > 0,
      canRedo: true,
    });
  },
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    set({
      score: cloneScore(history[nextIndex]),
      historyIndex: nextIndex,
      canUndo: true,
      canRedo: nextIndex < history.length - 1,
    });
  },
  canUndo: false,
  canRedo: false,
  deleteSelection: (noteIds) => {
    const { score } = get();
    if (!score || noteIds.length === 0) return;
    // Per Iter2 §2: convert selected notes to rests of the same duration
    // (preserves surrounding durations + overall measure length). The raw
    // `deleteNotes` helper is still available for callers that truly want
    // to remove events (e.g. programmatic insert flows).
    const next = deleteNotesAsRests(score, new Set(noteIds));
    get().applyScore(next);
  },
  applyScore: (nextScore: EditableScore) => {
    const { score } = get();
    if (!score) return;
    const normalized = normalizeScoreRests(nextScore);
    const { history, historyIndex } = get();
    const trimmed = history.slice(0, historyIndex + 1);
    trimmed.push(cloneScore(normalized));
    if (trimmed.length > MAX_HISTORY) trimmed.shift();
    set({
      score: normalized,
      history: trimmed,
      historyIndex: trimmed.length - 1,
      canUndo: trimmed.length > 1,
      canRedo: false,
    });
  },
  replaceScoreFromEditor: (nextScore) => {
    const normalized = normalizeScoreRests(nextScore);
    set({
      score: normalized,
      history: [cloneScore(normalized)],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    });
  },
}));

/** Module-level clipboard for Cut/Copy/Paste */
let clipboardNotes: Note[] = [];

export function getClipboard(): Note[] {
  return [...clipboardNotes];
}

export function setClipboard(notes: Note[]): void {
  clipboardNotes = notes.map((n) => ({ ...n, id: generateId("n") }));
}

export function pasteNotes(score: EditableScore, targetPartId: string, targetMeasureIndex: number, targetNoteIndex: number): EditableScore {
  if (clipboardNotes.length === 0) return score;
  const next = cloneScore(score);
  const part = next.parts.find((p) => p.id === targetPartId);
  if (!part || targetMeasureIndex >= part.measures.length) return score;
  const measure = part.measures[targetMeasureIndex];
  const toInsert = clipboardNotes.map((n) => ({ ...n, id: generateId("n") }));
  const at = measure.notes[targetNoteIndex];
  if (at?.isRest) {
    measure.notes.splice(targetNoteIndex, 1, ...toInsert);
  } else {
    measure.notes.splice(targetNoteIndex, 0, ...toInsert);
  }
  return next;
}
