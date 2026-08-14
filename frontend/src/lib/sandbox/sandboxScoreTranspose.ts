import type { RiffScoreSessionHandles } from "@/context/RiffScoreSessionContext";
import type { EditableScore } from "@/lib/music/scoreTypes";
import {
  collectPitchesForNoteIds,
  naturalDiatonicStepNotes,
  transposeNotes,
  transposeNotesForceNaturalLetters,
} from "@/lib/music/scoreUtils";
import { previewSandboxPitches } from "@/lib/sandbox/sandboxPitchPreview";
import { useScoreStore } from "@/store/useScoreStore";

function resolveTransposeNoteIds(
  session: RiffScoreSessionHandles | null | undefined,
  fallbackNoteIds?: ReadonlySet<string> | null,
): Set<string> {
  let ids = session?.peekTransposeTargetNoteIds() ?? new Set<string>();
  if (ids.size === 0 && fallbackNoteIds && fallbackNoteIds.size > 0) {
    ids = new Set(fallbackNoteIds);
  }
  return ids;
}

function resolveLiveScoreForEdit(
  session: RiffScoreSessionHandles | null | undefined,
): EditableScore | null {
  return session?.readLiveScore() ?? useScoreStore.getState().score;
}

/**
 * Synchronously transpose selected notes (whole step ±2, octave ±12).
 * Peeks note ids and reads the live editor score without flush→loadScore,
 * so toolbar Octave ↓/↑ apply on the first click.
 */
export function applyTransposeSelectedNotes(
  session: RiffScoreSessionHandles | null | undefined,
  semitones: number,
  fallbackNoteIds?: ReadonlySet<string> | null,
): boolean {
  const ids = resolveTransposeNoteIds(session, fallbackNoteIds);
  if (ids.size === 0) return false;

  const live = resolveLiveScoreForEdit(session);
  if (!live) return false;

  const next = transposeNotes(live, ids, semitones);
  const toPlay = collectPitchesForNoteIds(next, ids);
  useScoreStore.getState().applyScore(next);
  previewSandboxPitches(toPlay);
  return true;
}

/** @deprecated Prefer {@link applyTransposeSelectedNotes}; kept as alias for call sites. */
export function scheduleTransposeSelectedNotes(
  session: RiffScoreSessionHandles | null | undefined,
  semitones: number,
  fallbackNoteIds?: ReadonlySet<string> | null,
): void {
  applyTransposeSelectedNotes(session, semitones, fallbackNoteIds);
}

/** Arrow keys: move along white keys only; pitch strings are natural letters (no #/b). */
export function applyNaturalDiatonicStep(
  session: RiffScoreSessionHandles | null | undefined,
  direction: 1 | -1,
  fallbackNoteIds?: ReadonlySet<string> | null,
): boolean {
  const ids = resolveTransposeNoteIds(session, fallbackNoteIds);
  if (ids.size === 0) return false;

  const live = resolveLiveScoreForEdit(session);
  if (!live) return false;

  const next = naturalDiatonicStepNotes(live, ids, direction);
  const toPlay = collectPitchesForNoteIds(next, ids);
  useScoreStore.getState().applyScore(next);
  previewSandboxPitches(toPlay);
  return true;
}

export function scheduleNaturalDiatonicStep(
  session: RiffScoreSessionHandles | null | undefined,
  direction: 1 | -1,
  fallbackNoteIds?: ReadonlySet<string> | null,
): void {
  applyNaturalDiatonicStep(session, direction, fallbackNoteIds);
}

/** ⌘/Ctrl + arrows: octave by chromatic ±12, then coerce spelling to natural letters. */
export function applyTransposeNaturalLetters(
  session: RiffScoreSessionHandles | null | undefined,
  semitones: number,
  fallbackNoteIds?: ReadonlySet<string> | null,
): boolean {
  const ids = resolveTransposeNoteIds(session, fallbackNoteIds);
  if (ids.size === 0) return false;

  const live = resolveLiveScoreForEdit(session);
  if (!live) return false;

  const next = transposeNotesForceNaturalLetters(live, ids, semitones);
  const toPlay = collectPitchesForNoteIds(next, ids);
  useScoreStore.getState().applyScore(next);
  previewSandboxPitches(toPlay);
  return true;
}

export function scheduleTransposeNaturalLetters(
  session: RiffScoreSessionHandles | null | undefined,
  semitones: number,
  fallbackNoteIds?: ReadonlySet<string> | null,
): void {
  applyTransposeNaturalLetters(session, semitones, fallbackNoteIds);
}
