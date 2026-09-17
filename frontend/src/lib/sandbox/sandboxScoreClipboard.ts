import type { RiffScoreSessionHandles } from "@/context/RiffScoreSessionContext";
import type { EditableScore } from "@/lib/music/scoreTypes";
import { extractNotes, getNoteById } from "@/lib/music/scoreUtils";
import {
  getClipboard,
  pasteNotes,
  setClipboard,
  useScoreStore,
} from "@/store/useScoreStore";
import { applyDeleteSelectionAsRests } from "./deleteSelectionAsRests";

export type ScoreInsertAnchor = {
  partId: string;
  measureIndex: number;
  noteIndex: number;
};

function resolveClipboardNoteIds(
  session: RiffScoreSessionHandles | null | undefined,
  fallbackNoteIds?: ReadonlySet<string> | null,
): Set<string> {
  let ids = session?.peekTransposeTargetNoteIds() ?? new Set<string>();
  if (ids.size === 0 && fallbackNoteIds && fallbackNoteIds.size > 0) {
    ids = new Set(fallbackNoteIds);
  }
  return ids;
}

function resolveLiveScore(
  session: RiffScoreSessionHandles | null | undefined,
): EditableScore | null {
  return session?.readLiveScore() ?? useScoreStore.getState().score;
}

/**
 * Copy selected notes from the live editor (RiffScore peek ids, then HF selection).
 * Does not flush → loadScore, matching transpose/delete.
 */
export function copyEditorSelection(
  session: RiffScoreSessionHandles | null | undefined,
  fallbackNoteIds?: ReadonlySet<string> | null,
): boolean {
  const ids = resolveClipboardNoteIds(session, fallbackNoteIds);
  if (ids.size === 0) return false;
  const live = resolveLiveScore(session);
  if (!live) return false;
  const notes = extractNotes(live, ids);
  if (notes.length === 0) return false;
  setClipboard(notes);
  return true;
}

/** Copy then replace the selection with same-duration rests. */
export function cutEditorSelection(
  session: RiffScoreSessionHandles | null | undefined,
  fallbackNoteIds?: ReadonlySet<string> | null,
  onCut?: () => void,
): boolean {
  if (!copyEditorSelection(session, fallbackNoteIds)) return false;
  if (applyDeleteSelectionAsRests(session, fallbackNoteIds)) {
    onCut?.();
    return true;
  }
  return false;
}

function firstSelectedAnchor(
  score: EditableScore,
  ids: ReadonlySet<string>,
): ScoreInsertAnchor | null {
  for (const id of ids) {
    const found = getNoteById(score, id);
    if (!found) continue;
    return {
      partId: found.part.id,
      measureIndex: found.measureIdx,
      noteIndex: found.noteIdx,
    };
  }
  return null;
}

/**
 * MuseScore-style paste target: replace a selected rest in place, otherwise insert
 * after the selection, else the entry cursor, else the start of the first part.
 */
export function resolvePasteAnchor(
  score: EditableScore,
  session: RiffScoreSessionHandles | null | undefined,
  fallbackNoteIds?: ReadonlySet<string> | null,
  cursor?: ScoreInsertAnchor | null,
): ScoreInsertAnchor | null {
  const ids = resolveClipboardNoteIds(session, fallbackNoteIds);
  const selected = firstSelectedAnchor(score, ids);
  if (selected) {
    const part = score.parts.find((p) => p.id === selected.partId);
    const measure = part?.measures[selected.measureIndex];
    const slot = measure?.notes[selected.noteIndex];
    if (slot?.isRest) return selected;
    return {
      partId: selected.partId,
      measureIndex: selected.measureIndex,
      noteIndex: selected.noteIndex + 1,
    };
  }

  if (cursor) return cursor;

  const firstPart = score.parts[0];
  if (!firstPart) return null;
  return { partId: firstPart.id, measureIndex: 0, noteIndex: 0 };
}

export function pasteEditorClipboard(
  session: RiffScoreSessionHandles | null | undefined,
  fallbackNoteIds?: ReadonlySet<string> | null,
  cursor?: ScoreInsertAnchor | null,
): boolean {
  if (getClipboard().length === 0) return false;
  const live = resolveLiveScore(session);
  if (!live) return false;
  const target = resolvePasteAnchor(live, session, fallbackNoteIds, cursor);
  if (!target) return false;
  const next = pasteNotes(live, target.partId, target.measureIndex, target.noteIndex);
  useScoreStore.getState().applyScore(next);
  return true;
}
