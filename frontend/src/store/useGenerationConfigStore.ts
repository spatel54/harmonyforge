/**
 * Generation config (mood, genre, instruments, rhythm density, pickup) persisted
 * across Playground ⇄ Document ⇄ Sandbox via Zustand `persist` (localStorage).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { VoiceType } from "@/components/atoms/PartChip";

export type GenerationMood = "major" | "minor";
export type GenerationGenre = "classical" | "jazz" | "pop";
export type RhythmDensity = "chordal" | "mixed" | "flowing";
export type BassRhythmMode = "follow" | "pedal";

export interface GenerationConfigShape {
  mood: GenerationMood;
  genre: GenerationGenre;
  rhythmDensity: RhythmDensity;
  /** Bass holds chord tones per slot vs following melody subdivisions (engine). */
  bassRhythmMode: BassRhythmMode;
  instruments: Record<VoiceType, string[]>;
  /** Detected tonic from the uploaded score (e.g. "C"). Displayed + persisted. */
  detectedTonic: string | null;
  /** Detected key mode from the uploaded score; distinct from chosen mood. */
  detectedMode: GenerationMood | null;
  /** Anacrusis / pickup beats the user wants the engine to honor (Iter2 §1). */
  pickupBeats: number | null;
  /**
   * When true, engine infers chords from melody + mood/genre instead of using
   * chord symbols embedded in the uploaded file (Iteration 3).
   */
  preferInferredChords: boolean;
}

export interface GenerationConfigState extends GenerationConfigShape {
  setMood: (mood: GenerationMood) => void;
  setGenre: (genre: GenerationGenre) => void;
  setRhythmDensity: (value: RhythmDensity) => void;
  setBassRhythmMode: (value: BassRhythmMode) => void;
  setInstruments: (instruments: Record<VoiceType, string[]>) => void;
  toggleInstrument: (voice: VoiceType, instrument: string) => void;
  removeInstrument: (instrument: string) => void;
  setDetectedKey: (tonic: string | null, mode: GenerationMood | null) => void;
  setPickupBeats: (beats: number | null) => void;
  setPreferInferredChords: (value: boolean) => void;
  /** Wipe all config back to defaults (used after Upload → change source). */
  reset: () => void;
  /** Re-read from localStorage; safe to call from effects after navigation. */
  restoreFromStorage: () => void;
}

const STORAGE_KEY = "harmonyforge-generation-config";

const DEFAULT_STATE: GenerationConfigShape = {
  mood: "major",
  genre: "classical",
  rhythmDensity: "mixed",
  bassRhythmMode: "follow",
  instruments: { soprano: [], alto: [], tenor: [], bass: [] },
  detectedTonic: null,
  detectedMode: null,
  pickupBeats: null,
  preferInferredChords: false,
};

function sanitizeFromPersist(data: unknown): Partial<GenerationConfigShape> {
  if (!data || typeof data !== "object") return {};
  const parsed = data as Partial<GenerationConfigShape>;
  return {
    mood: parsed.mood === "minor" ? "minor" : "major",
    genre:
      parsed.genre === "jazz" || parsed.genre === "pop" ? parsed.genre : "classical",
    rhythmDensity:
      parsed.rhythmDensity === "chordal" || parsed.rhythmDensity === "flowing"
        ? parsed.rhythmDensity
        : "mixed",
    bassRhythmMode: parsed.bassRhythmMode === "pedal" ? "pedal" : "follow",
    instruments: {
      soprano: Array.isArray(parsed.instruments?.soprano) ? parsed.instruments!.soprano : [],
      alto: Array.isArray(parsed.instruments?.alto) ? parsed.instruments!.alto : [],
      tenor: Array.isArray(parsed.instruments?.tenor) ? parsed.instruments!.tenor : [],
      bass: Array.isArray(parsed.instruments?.bass) ? parsed.instruments!.bass : [],
    },
    detectedTonic:
      typeof parsed.detectedTonic === "string" && parsed.detectedTonic.length > 0
        ? parsed.detectedTonic
        : null,
    detectedMode:
      parsed.detectedMode === "minor" || parsed.detectedMode === "major"
        ? parsed.detectedMode
        : null,
    pickupBeats:
      typeof parsed.pickupBeats === "number" && Number.isFinite(parsed.pickupBeats)
        ? (() => {
            const r = Math.round(parsed.pickupBeats!);
            return r >= 0 && r <= 3 ? r : null;
          })()
        : null,
    preferInferredChords: parsed.preferInferredChords === true,
  };
}

export const useGenerationConfigStore = create<GenerationConfigState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      setMood: (mood) => set({ mood }),
      setGenre: (genre) => set({ genre }),
      setRhythmDensity: (rhythmDensity) => set({ rhythmDensity }),
      setBassRhythmMode: (bassRhythmMode) => set({ bassRhythmMode }),
      setInstruments: (instruments) => set({ instruments }),
      toggleInstrument: (voice, instrument) => {
        const prev = get().instruments;
        const current = prev[voice];
        const next: Record<VoiceType, string[]> = {
          ...prev,
          [voice]: current.includes(instrument)
            ? current.filter((i) => i !== instrument)
            : [...current, instrument],
        };
        set({ instruments: next });
      },
      removeInstrument: (instrument) => {
        const prev = get().instruments;
        const next: Record<VoiceType, string[]> = {
          soprano: prev.soprano.filter((i) => i !== instrument),
          alto: prev.alto.filter((i) => i !== instrument),
          tenor: prev.tenor.filter((i) => i !== instrument),
          bass: prev.bass.filter((i) => i !== instrument),
        };
        set({ instruments: next });
      },
      setDetectedKey: (tonic, mode) =>
        set({ detectedTonic: tonic, detectedMode: mode }),
      setPickupBeats: (pickupBeats) => set({ pickupBeats }),
      setPreferInferredChords: (preferInferredChords) => set({ preferInferredChords }),
      reset: () => {
        set({ ...DEFAULT_STATE });
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      },
      restoreFromStorage: () => {
        void useGenerationConfigStore.persist.rehydrate();
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        mood: s.mood,
        genre: s.genre,
        rhythmDensity: s.rhythmDensity,
        bassRhythmMode: s.bassRhythmMode,
        instruments: s.instruments,
        detectedTonic: s.detectedTonic,
        detectedMode: s.detectedMode,
        pickupBeats: s.pickupBeats,
        preferInferredChords: s.preferInferredChords,
      }),
      merge: (persisted, current) => {
        const shape = sanitizeFromPersist(persisted);
        return { ...current, ...shape };
      },
    },
  ),
);
