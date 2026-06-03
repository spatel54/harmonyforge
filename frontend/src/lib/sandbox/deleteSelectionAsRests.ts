import type { RiffScoreSessionHandles } from "@/context/RiffScoreSessionContext";
import { deleteNotesAsRests } from "@/lib/music/scoreUtils";
import { useScoreStore } from "@/store/useScoreStore";

/**
 * Flush RiffScore → Zustand, resolve target note ids (same path as toolbar transpose),
 * then replace selected notes with same-duration rests (never splice events out).
 */
export function applyDeleteSelectionAsRests(
  session: RiffScoreSessionHandles | null | undefined,
  fallbackNoteIds?: ReadonlySet<string> | null,
): boolean {
  session?.flushToZustand();
  let ids = new Set<string>();
  if (session) {
    ids = session.getTransposeTargetNoteIds();
  }
  if (ids.size === 0 && fallbackNoteIds && fallbackNoteIds.size > 0) {
    ids = new Set(fallbackNoteIds);
  }
  if (ids.size === 0) return false;

  const live = useScoreStore.getState().score;
  if (!live) return false;

  const next = deleteNotesAsRests(live, ids);
  useScoreStore.getState().applyScore(next);
  return true;
}

/** Next-frame delete so selection and score stay aligned after flush (matches transpose helpers). */
export function scheduleDeleteSelectionAsRests(
  session: RiffScoreSessionHandles | null | undefined,
  fallbackNoteIds?: ReadonlySet<string> | null,
  onApplied?: () => void,
): void {
  session?.flushToZustand();
  requestAnimationFrame(() => {
    if (applyDeleteSelectionAsRests(session, fallbackNoteIds)) {
      onApplied?.();
    }
  });
}

/** True when the editor reports at least one deletable note target after flush. */
export function hasDeletableEditorSelection(
  session: RiffScoreSessionHandles | null | undefined,
  fallbackNoteIds?: ReadonlySet<string> | null,
): boolean {
  session?.flushToZustand();
  if (session && session.getTransposeTargetNoteIds().size > 0) return true;
  return Boolean(fallbackNoteIds && fallbackNoteIds.size > 0);
}
