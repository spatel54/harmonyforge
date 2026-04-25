"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * "piano" — RiffScore’s Salamander piano (default, familiar reference).
 * "byPart" — coarse Tone.js timbre groups from part names (Iteration 7 audition).
 */
export type AuditionTimbreMode = "piano" | "byPart";

interface State {
  timbreMode: AuditionTimbreMode;
  setTimbreMode: (m: AuditionTimbreMode) => void;
}

export const useAuditionTimbreStore = create<State>()(
  persist(
    (set) => ({
      timbreMode: "piano",
      setTimbreMode: (m) => set({ timbreMode: m }),
    }),
    { name: "hf-audition-timbre-v1" },
  ),
);
