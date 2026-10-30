/**
 * Chord inference: when no chords in file, infer diatonic progression.
 * Genre affects candidates and transition preferences (HFLitReview: classical vs jazz vs pop).
 */

import type { ParsedScore, ChordSlot, MelodyNote, Genre } from "./types";
import { parseChord } from "./chordParser";
import { coerceChordRoman, normalizeKeyContext } from "./chordRomanCoerce";
import { pitchStringToMidi } from "../../lib/music/pitchMidi";

const MAJOR_TRIADS = ["I", "ii", "iii", "IV", "V", "V7", "vi", "vii°"] as const;
/** Harmonic minor: V / V7 (not only modal v) so cadences resolve. */
const MINOR_TRIADS = ["i", "ii°", "III", "iv", "V", "V7", "v", "VI", "VII"] as const;
/** Jazz: 7th chords as foundational unit */
const MAJOR_JAZZ = ["I", "ii7", "iii7", "IV", "V7", "vi7", "viiø7"] as const;
const MINOR_JAZZ = ["i7", "iiø7", "III7", "iv7", "V7", "v7", "VI7", "VII7"] as const;
/** Pop: cyclical schemas, plagal motion, modal borrowing (bVII, bVI) */
const MAJOR_POP = ["I", "ii", "iii", "IV", "V", "V7", "vi", "bVII"] as const;
const MINOR_POP = ["i", "ii°", "III", "iv", "V", "V7", "VI", "VII", "bVI"] as const;

const TRANSITION_BONUS: Record<string, string[]> = {
  I: ["ii", "IV", "V", "V7", "vi"],
  ii: ["V", "V7"],
  iii: ["vi", "IV"],
  IV: ["I", "ii", "V", "V7"],
  V: ["I", "vi"],
  V7: ["I", "vi"],
  vi: ["ii", "IV", "V", "V7"],
  "vii°": ["I"],
  i: ["ii°", "iv", "V", "V7", "VI"],
  "ii°": ["V", "V7"],
  III: ["VI", "iv"],
  iv: ["i", "ii°", "V", "V7"],
  v: ["i", "VI"],
  VI: ["ii°", "iv", "V", "V7"],
  VII: ["i", "III"],
};

/** Jazz ii–V–I and pop cyclical schemas (I–V–vi–IV, I–vi–IV–V) */
const JAZZ_TRANSITION_BONUS: Record<string, string[]> = {
  ...TRANSITION_BONUS,
  I: ["ii7", "IV", "vi7", "V7"],
  ii7: ["V7"],
  iii7: ["vi7", "IV"],
  IV: ["V7", "I", "ii7"],
  V7: ["I", "vi7"],
  vi7: ["ii7", "IV", "V7"],
  "viiø7": ["I"],
  i7: ["iiø7", "iv7", "V7"],
  "iiø7": ["V7"],
};
const POP_TRANSITION_BONUS: Record<string, string[]> = {
  ...TRANSITION_BONUS,
  I: ["V", "vi", "IV"],
  vi: ["IV", "I", "V"],
  IV: ["I", "V", "vi"],
  V: ["I", "vi"],
  V7: ["I", "vi"],
  bVII: ["I", "IV"],
  bVI: ["V", "i"],
};

const FUNCTION_WEIGHT: Record<string, number> = {
  I: 4,
  i: 4,
  i7: 3,
  V: 4,
  V7: 5,
  IV: 3,
  iv: 3,
  iv7: 2,
  ii: 3,
  ii7: 4,
  "ii°": 2,
  "iiø7": 3,
  vi: 2,
  vi7: 2,
  VI: 2,
  VI7: 1,
  iii: 0,
  iii7: 0,
  III: 1,
  III7: 1,
  v: -1,
  v7: 0,
  "vii°": -2,
  "viiø7": -1,
  VII: 1,
  VII7: 1,
  bVII: 1,
  bVI: 1,
};

function schemaCycle(genre: Genre | undefined, useMinor: boolean): string[] {
  if (genre === "jazz") return useMinor ? ["i7", "iiø7", "V7", "i7"] : ["I", "ii7", "V7", "I"];
  if (genre === "pop") return useMinor ? ["i", "VI", "III", "VII"] : ["I", "V", "vi", "IV"];
  return useMinor ? ["i", "iv", "V", "i"] : ["I", "IV", "V", "I"];
}

function pitchToPc(pitch: string): number {
  const midi = pitchStringToMidi(pitch);
  if (midi !== null) return ((midi % 12) + 12) % 12;
  const match = pitch.match(/^([A-G])(#{1,2}|b{1,2})?/);
  if (!match) return 0;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[match[1] ?? "C"] ?? 0;
  const acc = match[2] ?? "";
  const alter = acc === "#" || acc === "##" ? acc.length : acc === "b" || acc === "bb" ? -acc.length : 0;
  return ((base + alter) % 12 + 12) % 12;
}

function isTonicRoman(roman: string, useMinor: boolean): boolean {
  if (useMinor) return roman === "i" || roman === "i7";
  return roman === "I";
}

function isDominantRoman(roman: string): boolean {
  return roman === "V" || roman === "V7" || roman === "vii°" || roman === "viiø7";
}

function getActiveMelodyNote(melody: MelodyNote[], beat: number): MelodyNote | undefined {
  const sorted = [...melody].sort((a, b) => a.beat - b.beat);
  for (let i = 0; i < sorted.length; i++) {
    const note = sorted[i];
    const nextBeat = sorted[i + 1]?.beat;
    const endBeat = note.duration !== undefined
      ? note.beat + note.duration
      : nextBeat ?? Number.POSITIVE_INFINITY;
    if (beat >= note.beat && beat < endBeat) return note;
  }
  return [...sorted].reverse().find((note) => note.beat <= beat);
}

function getMelodySlice(melody: MelodyNote[], startBeat: number, endBeat: number): MelodyNote[] {
  return melody.filter((note) => {
    const noteEnd = note.duration !== undefined ? note.beat + note.duration : note.beat;
    return (note.beat >= startBeat && note.beat < endBeat) || (note.beat <= startBeat && noteEnd > startBeat);
  });
}

function getWindowPitchClassesFromParsed(
  parsed: ParsedScore,
  startBeat: number,
  endBeat: number,
): Set<number> {
  const parts = parsed.inputParts;
  if (parts && parts.length > 1) {
    const pcs = new Set<number>();
    for (const part of parts) {
      for (const note of getMelodySlice(part.notes, startBeat, endBeat)) {
        pcs.add(pitchToPc(note.pitch));
      }
    }
    if (pcs.size > 0) return pcs;
  }
  return new Set(
    getMelodySlice(parsed.melody, startBeat, endBeat).map((note) => pitchToPc(note.pitch)),
  );
}

function getChordStepSize(parsed: ParsedScore): number {
  const beatsPerMeasure = parsed.timeSignature?.beats ?? 4;
  if (beatsPerMeasure >= 4) return 2;
  if (beatsPerMeasure === 3) return 1.5;
  return Math.max(1, beatsPerMeasure);
}

/** Default cap on inferred chord slots (long scores widen the grid). Override with HF_MAX_CHORD_SLOTS. */
export const DEFAULT_MAX_CHORD_SLOTS = 128;

/** Minimum beats per chord when widening the grid (floor at one beat). */
const MIN_BEATS_PER_CHORD_WHEN_ADAPTIVE = 1;

export function resolveMaxChordSlots(): number {
  const raw = process.env.HF_MAX_CHORD_SLOTS;
  if (raw == null || raw === "") return DEFAULT_MAX_CHORD_SLOTS;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 8) return DEFAULT_MAX_CHORD_SLOTS;
  return Math.min(n, 512);
}

/**
 * Base grid step from meter, then widen if the score would exceed max chord slots (keeps SATB solver tractable).
 */
export function resolveAdaptiveBeatsPerChord(
  parsed: ParsedScore,
  lastBeat: number,
  maxSlots = resolveMaxChordSlots(),
): number {
  const beatsPerChord = getChordStepSize(parsed);
  if (lastBeat <= 0) return beatsPerChord;
  const estimatedSlots = Math.ceil(lastBeat / beatsPerChord);
  if (estimatedSlots <= maxSlots) return beatsPerChord;
  return Math.max(lastBeat / maxSlots, MIN_BEATS_PER_CHORD_WHEN_ADAPTIVE);
}

/** Infer chords from melody with melody-compatible diatonic selection. Genre affects candidates and transitions. */
export function inferChords(
  parsed: ParsedScore,
  mood?: "major" | "minor",
  genre?: Genre
): ChordSlot[] {
  const melody = parsed.melody;
  if (melody.length === 0) return [{ roman: "I", beat: 0 }];

  const lastBeat = parsed.totalBeats ?? Math.max(...melody.map((n: MelodyNote) => {
    const end = n.beat + (n.duration ?? 0);
    return end > n.beat ? end : n.beat;
  }), 0);
  const useMinor = mood !== undefined ? mood === "minor" : parsed.key.mode === "minor";
  const candidates = (() => {
    if (genre === "jazz") return useMinor ? [...MINOR_JAZZ] : [...MAJOR_JAZZ];
    if (genre === "pop") return useMinor ? [...MINOR_POP] : [...MAJOR_POP];
    return useMinor ? [...MINOR_TRIADS] : [...MAJOR_TRIADS];
  })();
  const transitionBonus =
    genre === "jazz" ? JAZZ_TRANSITION_BONUS : genre === "pop" ? POP_TRANSITION_BONUS : TRANSITION_BONUS;
  const schema = schemaCycle(genre, useMinor);
  const tonicRoman = useMinor ? "i" : "I";
  const tonicTones = new Set(
    parseChord(tonicRoman, {
      tonic: parsed.key.tonic,
      mode: useMinor ? "minor" : "major",
    }).chordTones,
  );
  const windowFitsTonic = (window: Set<number>) =>
    window.size > 0 && [...window].every((pc) => tonicTones.has(pc));
  const chords: ChordSlot[] = [];
  const beatsPerChord = resolveAdaptiveBeatsPerChord(parsed, lastBeat);
  const pickupBeats = Math.max(0, parsed.pickupBeats ?? 0);
  let beat = pickupBeats;
  let previousRoman: string | undefined;
  let slotIndex = 0;
  const estimatedSlots = Math.max(1, Math.ceil((lastBeat - pickupBeats) / beatsPerChord));

  while (beat < lastBeat || chords.length === 0) {
    const endBeat = Math.min(beat + beatsPerChord, lastBeat || beat + beatsPerChord);
    const activeNote = getActiveMelodyNote(melody, beat);
    const activePc = activeNote ? pitchToPc(activeNote.pitch) : undefined;
    const windowPitchClasses = getWindowPitchClassesFromParsed(parsed, beat, endBeat);
    const isLast = slotIndex >= estimatedSlots - 1;
    const isPenult = slotIndex === estimatedSlots - 2;

    const ranked = candidates
      .map((roman) => {
        const parsedChord = parseChord(roman, {
          tonic: parsed.key.tonic,
          mode: useMinor ? "minor" : "major",
        });
        const chordTones = new Set(parsedChord.chordTones);
        let score = FUNCTION_WEIGHT[roman] ?? 0;

        if (activePc !== undefined) {
          score += chordTones.has(activePc) ? 12 : -6;
        }

        for (const pitchClass of windowPitchClasses) {
          score += chordTones.has(pitchClass) ? 5 : -1;
        }

        if (previousRoman) {
          if (roman === previousRoman) {
            const allFit =
              windowPitchClasses.size > 0 &&
              [...windowPitchClasses].every((pc) => chordTones.has(pc));
            score += allFit ? 8 : -5;
          }
          if (transitionBonus[previousRoman]?.includes(roman)) {
            score += isDominantRoman(previousRoman) && isTonicRoman(roman, useMinor) ? 12 : 8;
          }
        } else if (isTonicRoman(roman, useMinor)) {
          score += 8;
        }

        if (windowFitsTonic(windowPitchClasses)) {
          score += isTonicRoman(roman, useMinor) ? 10 : -8;
        }

        if (schema[slotIndex % schema.length] === roman) score += 4;
        if (isLast && isTonicRoman(roman, useMinor)) score += 10;
        if (isPenult && isDominantRoman(roman) && !windowFitsTonic(windowPitchClasses)) score += 8;
        if (roman === "v" && useMinor) score -= 3;

        return { roman, score };
      })
      .sort((a, b) => b.score - a.score);

    const selected = ranked[0]?.roman ?? (useMinor ? "i" : "I");
    chords.push({ roman: selected, beat });
    previousRoman = selected;
    beat += beatsPerChord;
    slotIndex += 1;
  }

  return chords;
}

/**
 * When MusicXML embeds more harmony symbols than the solver cap, keep an evenly spaced subset
 * in beat order (always includes first and last slots) so SATB search stays tractable.
 */
export function downsampleChordSlotsToMax(chords: ChordSlot[], maxSlots: number): ChordSlot[] {
  if (chords.length <= maxSlots) return chords;
  const indexed = chords.map((c, i) => ({ c, i }));
  indexed.sort((a, b) => {
    const ba = a.c.beat ?? a.i;
    const bb = b.c.beat ?? b.i;
    if (ba !== bb) return ba - bb;
    return a.i - b.i;
  });
  const sorted = indexed.map((x) => x.c);
  const idxSet = new Set<number>();
  const denom = Math.max(1, maxSlots - 1);
  for (let j = 0; j < maxSlots; j++) {
    const idx = Math.round((j / denom) * (sorted.length - 1));
    idxSet.add(idx);
  }
  return Array.from(idxSet)
    .sort((a, b) => a - b)
    .map((i) => sorted[i]!);
}

export interface EnsureChordsOptions {
  /** Infer from melody instead of using chord symbols from the file. */
  preferInferredChords?: boolean;
}

/**
 * Keep file-provided chord slots only when each label coerces to a parseable Roman.
 * Lead-sheet symbols ("C", "Am", "G7") are mapped into Romans; unusable labels force reinfer.
 */
export function sanitizeFileChordSlots(
  chords: ChordSlot[],
  key: ParsedScore["key"],
): ChordSlot[] | null {
  const normKey = normalizeKeyContext(key);
  const out: ChordSlot[] = [];
  for (const slot of chords) {
    const roman = coerceChordRoman(slot.roman, normKey);
    if (!roman) return null;
    out.push({ ...slot, roman });
  }
  return out.length > 0 ? out : null;
}

/** Ensure ParsedScore has chords (use inferred if missing). Mood and genre affect inference. */
export function ensureChords(
  parsed: ParsedScore,
  mood?: "major" | "minor",
  genre?: Genre,
  opts?: EnsureChordsOptions,
): ParsedScore & { chords: ChordSlot[] } {
  const keyBase =
    mood !== undefined
      ? normalizeKeyContext({ ...parsed.key, mode: mood })
      : normalizeKeyContext(parsed.key);
  const hasFileChords = !!(parsed.chords && parsed.chords.length > 0);
  const modeConflict =
    mood !== undefined && parsed.key.mode !== mood;
  const reinferFromMelody =
    !hasFileChords ||
    opts?.preferInferredChords === true ||
    modeConflict;

  if (!reinferFromMelody && hasFileChords) {
    const sanitized = sanitizeFileChordSlots(parsed.chords!, keyBase);
    if (sanitized) {
      const maxSlots = resolveMaxChordSlots();
      const chords =
        sanitized.length > maxSlots
          ? downsampleChordSlotsToMax(sanitized, maxSlots)
          : sanitized;
      return { ...parsed, key: keyBase, chords } as ParsedScore & {
        chords: ChordSlot[];
      };
    }
    // Fall through: embedded labels were not usable as SATB Romans.
  }

  const forInfer = { ...parsed, key: keyBase };
  const chords = inferChords(forInfer, mood, genre);
  return { ...parsed, key: keyBase, chords };
}
