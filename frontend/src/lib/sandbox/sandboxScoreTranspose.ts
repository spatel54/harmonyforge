import type { RiffScoreSessionHandles } from "@/context/RiffScoreSessionContext";
import {
  collectPitchesForNoteIds,
  naturalDiatonicStepNotes,
  transposeNotes,
  transposeNotesForceNaturalLetters,
} from "@/lib/music/scoreUtils";
import { previewSandboxPitches } from "@/lib/sandbox/sandboxPitchPreview";
import { useScoreStore } from "@/store/useScoreStore";

/**
 * Flush RiffScore → Zustand, then transpose the same note set the toolbar uses
 * (whole step ±2, octave ±12), on the next frame so selection and score stay aligned.
 *
 * When the editor session is missing or `getTransposeTargetNoteIds()` is empty (sync lag),
 * `fallbackNoteIds` from the tool-store selection is used so toolbar/keys still apply.
 */
export function scheduleTransposeSelectedNotes(
  session: RiffScoreSessionHandles | null | undefined,
  semitones: number,
  fallbackNoteIds?: ReadonlySet<string> | null,
): void {
  session?.flushToZustand();
  requestAnimationFrame(() => {
    const live = useScoreStore.getState().score;
    if (!live) return;
    let ids = new Set<string>();
    if (session) {
      ids = session.getTransposeTargetNoteIds();
    }
    if (ids.size === 0 && fallbackNoteIds && fallbackNoteIds.size > 0) {
      ids = new Set(fallbackNoteIds);
    }
    if (ids.size === 0) return;
    const next = transposeNotes(live, ids, semitones);
    const toPlay = collectPitchesForNoteIds(next, ids);
    useScoreStore.getState().applyScore(next);
    previewSandboxPitches(toPlay);
  });
}

/** Arrow keys: move along white keys only; pitch strings are natural letters (no #/b). */
export function scheduleNaturalDiatonicStep(
  session: RiffScoreSessionHandles | null | undefined,
  direction: 1 | -1,
  fallbackNoteIds?: ReadonlySet<string> | null,
): void {
  session?.flushToZustand();
  requestAnimationFrame(() => {
    const live = useScoreStore.getState().score;
    if (!live) return;
    let ids = new Set<string>();
    if (session) ids = session.getTransposeTargetNoteIds();
    if (ids.size === 0 && fallbackNoteIds && fallbackNoteIds.size > 0) {
      ids = new Set(fallbackNoteIds);
    }
    if (ids.size === 0) return;
    const next = naturalDiatonicStepNotes(live, ids, direction);
    const toPlay = collectPitchesForNoteIds(next, ids);
    useScoreStore.getState().applyScore(next);
    previewSandboxPitches(toPlay);
  });
}

/** ⌘/Ctrl + arrows: octave by chromatic ±12, then coerce spelling to natural letters. */
export function scheduleTransposeNaturalLetters(
  session: RiffScoreSessionHandles | null | undefined,
  semitones: number,
  fallbackNoteIds?: ReadonlySet<string> | null,
): void {
  session?.flushToZustand();
  requestAnimationFrame(() => {
    const live = useScoreStore.getState().score;
    if (!live) return;
    let ids = new Set<string>();
    if (session) ids = session.getTransposeTargetNoteIds();
    if (ids.size === 0 && fallbackNoteIds && fallbackNoteIds.size > 0) {
      ids = new Set(fallbackNoteIds);
    }
    if (ids.size === 0) return;
    const next = transposeNotesForceNaturalLetters(live, ids, semitones);
    const toPlay = collectPitchesForNoteIds(next, ids);
    useScoreStore.getState().applyScore(next);
    previewSandboxPitches(toPlay);
  });
}
