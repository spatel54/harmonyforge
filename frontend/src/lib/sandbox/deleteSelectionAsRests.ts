import type { RiffScoreSessionHandles } from "@/context/RiffScoreSessionContext";
import { deleteNotesAsRests } from "@/lib/music/scoreUtils";
import { useScoreStore } from "@/store/useScoreStore";

function resolveDeleteNoteIds(
  session: RiffScoreSessionHandles | null | undefined,
  fallbackNoteIds?: ReadonlySet<string> | null,
): Set<string> {
  let ids = session?.peekTransposeTargetNoteIds() ?? new Set<string>();
  if (ids.size === 0 && fallbackNoteIds && fallbackNoteIds.size > 0) {
    ids = new Set(fallbackNoteIds);
  }
  return ids;
}

/**
 * Replace selected notes with same-duration rests using live editor score + peeked ids
 * (no flush→loadScore race).
 */
export function applyDeleteSelectionAsRests(
  session: RiffScoreSessionHandles | null | undefined,
  fallbackNoteIds?: ReadonlySet<string> | null,
): boolean {
  const ids = resolveDeleteNoteIds(session, fallbackNoteIds);
  if (ids.size === 0) return false;

  const live = session?.readLiveScore() ?? useScoreStore.getState().score;
  if (!live) return false;

  const next = deleteNotesAsRests(live, ids);
  useScoreStore.getState().applyScore(next);
  return true;
}

export function scheduleDeleteSelectionAsRests(
  session: RiffScoreSessionHandles | null | undefined,
  fallbackNoteIds?: ReadonlySet<string> | null,
  onApplied?: () => void,
): void {
  if (applyDeleteSelectionAsRests(session, fallbackNoteIds)) {
    onApplied?.();
  }
}

/** True when the editor reports at least one deletable note target (no flush). */
export function hasDeletableEditorSelection(
  session: RiffScoreSessionHandles | null | undefined,
  fallbackNoteIds?: ReadonlySet<string> | null,
): boolean {
  if (session && session.peekTransposeTargetNoteIds().size > 0) return true;
  return Boolean(fallbackNoteIds && fallbackNoteIds.size > 0);
}
