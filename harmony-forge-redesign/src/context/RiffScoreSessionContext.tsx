"use client";

import { createContext, useContext } from "react";

export type RiffScoreSessionHandles = {
  flushToZustand: () => void;
  editorUndo: () => void;
  editorRedo: () => void;
};

export const RiffScoreSessionContext = createContext<RiffScoreSessionHandles | null>(null);

export function useRiffScoreSession(): RiffScoreSessionHandles | null {
  return useContext(RiffScoreSessionContext);
}
