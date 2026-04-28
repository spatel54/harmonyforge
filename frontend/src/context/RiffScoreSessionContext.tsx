"use client";

import { createContext, useContext } from "react";

export type RiffScoreSessionHandles = {
  flushToZustand: () => void;
  editorUndo: () => void;
  editorRedo: () => void;
  /** Native select-all in the notation editor (keeps HF selection in sync via selection events). */
  editorSelectAll: () => void;
  /** Clear native editor selection (e.g. Esc). */
  editorDeselectAll: () => void;
  /**
   * Batch pitch-edit target ids: when RiffScore collapses multi-select to one primary note during drag,
   * this still returns every note in the last multi-selection so hotkeys and pull propagation stay aligned.
   */
  getPitchGroupNoteIds: () => Set<string>;
  /**
   * Flush editor → Zustand, then resolve target note ids the same way as toolbar transpose (whole step / octave).
   * Used by sandbox arrow handling so chromatic transpose wins even when HF selection is briefly out of sync with RiffScore.
   */
  getTransposeTargetNoteIds: () => Set<string>;
};

export const RiffScoreSessionContext = createContext<RiffScoreSessionHandles | null>(null);

export function useRiffScoreSession(): RiffScoreSessionHandles | null {
  return useContext(RiffScoreSessionContext);
}
