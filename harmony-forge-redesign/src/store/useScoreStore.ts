import { create } from "zustand";
import type { EditableScore, Note } from "@/lib/music/scoreTypes";
import { cloneScore, deleteNotes } from "@/lib/music/scoreUtils";
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
  /** When true, undo/redo is managed by RiffScore's command history. */
  isExternallyManaged: boolean;
  setExternallyManaged: (managed: boolean) => void;
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
}

export const useScoreStore = create<ScoreState>((set, get) => ({
  score: null,
  history: [],
  historyIndex: -1,
  visibleParts: new Set<string>(),
  isExternallyManaged: false,
  setExternallyManaged: (managed) => set({ isExternallyManaged: managed }),
  setVisibleParts: (visibleParts) => set({ visibleParts }),
  togglePartVisibility: (partId) => {
    const { visibleParts } = get();
    const next = new Set(visibleParts);
    if (next.has(partId)) next.delete(partId);
    else next.add(partId);
    set({ visibleParts: next });
  },
  setScore: (score) =>
    set({
      score,
      history: [],
      historyIndex: -1,
      canUndo: false,
      canRedo: false,
      visibleParts: score ? new Set(score.parts.map((p) => p.id)) : new Set(),
    }),
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
    get().pushState();
    const next = deleteNotes(score, new Set(noteIds));
    set({ score: next });
  },
  applyScore: (nextScore: EditableScore) => {
    const { score } = get();
    if (!score) return;
    get().pushState();
    set({ score: nextScore });
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
  measure.notes.splice(targetNoteIndex, 0, ...toInsert);
  return next;
}
