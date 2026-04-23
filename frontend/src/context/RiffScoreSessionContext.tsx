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
};

export const RiffScoreSessionContext = createContext<RiffScoreSessionHandles | null>(null);

export function useRiffScoreSession(): RiffScoreSessionHandles | null {
  return useContext(RiffScoreSessionContext);
}
