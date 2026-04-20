/**
 * Generation config (mood, genre, instruments, rhythm density) persisted across
 * Playground ⇄ Document ⇄ Sandbox navigation. Lifting the Ensemble Builder's
 * local useState into a shared, sessionStorage-backed Zustand store fixes
 * Iter2 §1: "the system drops user parameters when navigating between screens".
 */

import { create } from "zustand";

import type { VoiceType } from "@/components/atoms/PartChip";

export type GenerationMood = "major" | "minor";
export type GenerationGenre = "classical" | "jazz" | "pop";
export type RhythmDensity = "chordal" | "mixed" | "flowing";

export interface GenerationConfigShape {
  mood: GenerationMood;
  genre: GenerationGenre;
  rhythmDensity: RhythmDensity;
  instruments: Record<VoiceType, string[]>;
  /** Detected tonic from the uploaded score (e.g. "C"). Displayed + persisted. */
  detectedTonic: string | null;
  /** Detected key mode from the uploaded score; distinct from chosen mood. */
  detectedMode: GenerationMood | null;
  /** Anacrusis / pickup beats the user wants the engine to honor (Iter2 §1). */
  pickupBeats: number | null;
}

export interface GenerationConfigState extends GenerationConfigShape {
  setMood: (mood: GenerationMood) => void;
  setGenre: (genre: GenerationGenre) => void;
  setRhythmDensity: (value: RhythmDensity) => void;
  setInstruments: (instruments: Record<VoiceType, string[]>) => void;
  toggleInstrument: (voice: VoiceType, instrument: string) => void;
  removeInstrument: (instrument: string) => void;
  setDetectedKey: (tonic: string | null, mode: GenerationMood | null) => void;
  setPickupBeats: (beats: number | null) => void;
  /** Wipe all config back to defaults (used after Upload → change source). */
  reset: () => void;
  /** Hydrate from sessionStorage; safe to call from effects. */
  restoreFromStorage: () => void;
}

const STORAGE_KEY = "harmonyforge-generation-config";

const DEFAULT_STATE: GenerationConfigShape = {
  mood: "major",
  genre: "classical",
  rhythmDensity: "mixed",
  instruments: { soprano: [], alto: [], tenor: [], bass: [] },
  detectedTonic: null,
  detectedMode: null,
  pickupBeats: null,
};

function loadFromStorage(): GenerationConfigShape {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<GenerationConfigShape>;
    return {
      mood: parsed.mood === "minor" ? "minor" : "major",
      genre:
        parsed.genre === "jazz" || parsed.genre === "pop" ? parsed.genre : "classical",
      rhythmDensity:
        parsed.rhythmDensity === "chordal" || parsed.rhythmDensity === "flowing"
          ? parsed.rhythmDensity
          : "mixed",
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
          ? parsed.pickupBeats
          : null,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveToStorage(state: GenerationConfigShape): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        mood: state.mood,
        genre: state.genre,
        rhythmDensity: state.rhythmDensity,
        instruments: state.instruments,
        detectedTonic: state.detectedTonic,
        detectedMode: state.detectedMode,
        pickupBeats: state.pickupBeats,
      }),
    );
  } catch {
    // Private-mode / quota errors — silently ignore; in-memory state still works.
  }
}

function persistingUpdate(
  set: (fn: (s: GenerationConfigState) => Partial<GenerationConfigState>) => void,
  get: () => GenerationConfigState,
  patch: Partial<GenerationConfigShape>,
): void {
  set(() => patch);
  queueMicrotask(() => {
    const s = get();
    saveToStorage({
      mood: s.mood,
      genre: s.genre,
      rhythmDensity: s.rhythmDensity,
      instruments: s.instruments,
      detectedTonic: s.detectedTonic,
      detectedMode: s.detectedMode,
      pickupBeats: s.pickupBeats,
    });
  });
}

export const useGenerationConfigStore = create<GenerationConfigState>((set, get) => ({
  ...DEFAULT_STATE,
  setMood: (mood) => persistingUpdate(set, get, { mood }),
  setGenre: (genre) => persistingUpdate(set, get, { genre }),
  setRhythmDensity: (rhythmDensity) => persistingUpdate(set, get, { rhythmDensity }),
  setInstruments: (instruments) => persistingUpdate(set, get, { instruments }),
  toggleInstrument: (voice, instrument) => {
    const prev = get().instruments;
    const current = prev[voice];
    const next: Record<VoiceType, string[]> = {
      ...prev,
      [voice]: current.includes(instrument)
        ? current.filter((i) => i !== instrument)
        : [...current, instrument],
    };
    persistingUpdate(set, get, { instruments: next });
  },
  removeInstrument: (instrument) => {
    const prev = get().instruments;
    const next: Record<VoiceType, string[]> = {
      soprano: prev.soprano.filter((i) => i !== instrument),
      alto: prev.alto.filter((i) => i !== instrument),
      tenor: prev.tenor.filter((i) => i !== instrument),
      bass: prev.bass.filter((i) => i !== instrument),
    };
    persistingUpdate(set, get, { instruments: next });
  },
  setDetectedKey: (tonic, mode) =>
    persistingUpdate(set, get, { detectedTonic: tonic, detectedMode: mode }),
  setPickupBeats: (beats) =>
    persistingUpdate(set, get, { pickupBeats: beats }),
  reset: () => {
    set(() => ({ ...DEFAULT_STATE }));
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  },
  restoreFromStorage: () => {
    const loaded = loadFromStorage();
    set(() => loaded);
  },
}));
