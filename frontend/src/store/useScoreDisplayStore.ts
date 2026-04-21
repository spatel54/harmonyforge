/**
 * Read-only / learner display preferences for the score canvas (persisted locally).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ScoreDisplayState {
  /** Letter + accidental labels (e.g. C, F#, Bb) above each notehead — for learners still building staff literacy. */
  showNoteNameLabels: boolean;
  setShowNoteNameLabels: (value: boolean) => void;
}

export const useScoreDisplayStore = create<ScoreDisplayState>()(
  persist(
    (set) => ({
      showNoteNameLabels: false,
      setShowNoteNameLabels: (showNoteNameLabels) => set({ showNoteNameLabels }),
    }),
    { name: "harmonyforge-score-display" },
  ),
);
