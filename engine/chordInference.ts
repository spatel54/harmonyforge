/**
 * Chord inference: when no chords in file, infer diatonic progression.
 * Genre affects candidates and transition preferences (HFLitReview: classical vs jazz vs pop).
 */

import type { ParsedScore, ChordSlot, MelodyNote, Genre } from "./types.js";
import { parseChord } from "./chordParser.js";

const MAJOR_TRIADS = ["I", "ii", "iii", "IV", "V", "vi", "vii°"] as const;
const MINOR_TRIADS = ["i", "ii°", "III", "iv", "v", "VI", "VII"] as const;
/** Jazz: 7th chords as foundational unit */
const MAJOR_JAZZ = ["I", "ii7", "iii7", "IV", "V7", "vi7", "viiø7"] as const;
const MINOR_JAZZ = ["i7", "iiø7", "III7", "iv7", "v7", "VI7", "VII7"] as const;
/** Pop: cyclical schemas, plagal motion, modal borrowing (bVII, bVI) */
const MAJOR_POP = ["I", "ii", "iii", "IV", "V", "vi", "vii°", "bVII"] as const;
const MINOR_POP = ["i", "ii°", "III", "iv", "v", "VI", "VII", "bVI"] as const;

const TRANSITION_BONUS: Record<string, string[]> = {
  I: ["ii", "iii", "IV", "V", "vi"],
  ii: ["V", "vii°"],
  iii: ["vi", "IV"],
  IV: ["I", "ii", "V", "vii°"],
  V: ["I", "vi"],
  vi: ["ii", "IV", "V"],
  "vii°": ["I", "iii"],
  i: ["ii°", "III", "iv", "v", "VI", "VII"],
  "ii°": ["v", "VII"],
  III: ["VI", "iv"],
  iv: ["i", "ii°", "v", "VII"],
  v: ["i", "VI"],
  VI: ["ii°", "iv", "v"],
  VII: ["i", "III"],
};

/** Jazz ii–V–I and pop cyclical schemas (I–vi–IV–V, vi–IV–I–V) */
const JAZZ_TRANSITION_BONUS: Record<string, string[]> = {
  ...TRANSITION_BONUS,
  ii7: ["V7", "viiø7"],
  V7: ["I", "vi7"],
};
const POP_TRANSITION_BONUS: Record<string, string[]> = {
  ...TRANSITION_BONUS,
  I: ["vi", "IV", "V"],
  vi: ["IV", "I", "V"],
  IV: ["I", "V", "vi"],
  V: ["I", "vi"],
  bVII: ["I", "IV"],
  bVI: ["i", "V"],
};

function pitchToPc(pitch: string): number {
  const match = pitch.match(/^([A-G])(#?)/);
  if (!match) return 0;
  const step = match[1];
  const sharp = match[2] === "#" ? 1 : 0;
  const base = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  }[step] ?? 0;
  return (base + sharp) % 12;
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

function getChordStepSize(parsed: ParsedScore): number {
  const beatsPerMeasure = parsed.timeSignature?.beats ?? 4;
  if (beatsPerMeasure >= 4) return 2;
  if (beatsPerMeasure === 3) return 1.5;
  return Math.max(1, beatsPerMeasure);
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
  const transitionBonus = genre === "jazz" ? JAZZ_TRANSITION_BONUS : genre === "pop" ? POP_TRANSITION_BONUS : TRANSITION_BONUS;
  const chords: ChordSlot[] = [];
  const beatsPerChord = getChordStepSize(parsed);
  let beat = 0;
  let previousRoman: string | undefined;

  while (beat < lastBeat || chords.length === 0) {
    const endBeat = Math.min(beat + beatsPerChord, lastBeat || beat + beatsPerChord);
    const activeNote = getActiveMelodyNote(melody, beat);
    const activePc = activeNote ? pitchToPc(activeNote.pitch) : undefined;
    const windowPitchClasses = new Set(
      getMelodySlice(melody, beat, endBeat).map((note) => pitchToPc(note.pitch))
    );

    const ranked = candidates
      .map((roman) => {
        const parsedChord = parseChord(roman, {
          tonic: parsed.key.tonic,
          mode: useMinor ? "minor" : "major",
        });
        const chordTones = new Set(parsedChord.chordTones);
        const containsActive = activePc === undefined || chordTones.has(activePc);
        let score = containsActive ? 20 : -100;

        for (const pitchClass of windowPitchClasses) {
          score += chordTones.has(pitchClass) ? 4 : -2;
        }

        if (previousRoman) {
          if (roman === previousRoman) score += 2;
          if (transitionBonus[previousRoman]?.includes(roman)) score += 3;
        } else if (roman === (useMinor ? "i" : "I")) {
          score += 2;
        }

        return { roman, score };
      })
      .sort((a, b) => b.score - a.score);

    const selected = ranked[0]?.roman ?? (useMinor ? "i" : "I");
    chords.push({ roman: selected, beat });
    previousRoman = selected;
    beat += beatsPerChord;
  }

  return chords;
}

/** Ensure ParsedScore has chords (use inferred if missing). Mood and genre affect inference. */
export function ensureChords(
  parsed: ParsedScore,
  mood?: "major" | "minor",
  genre?: Genre
): ParsedScore & { chords: ChordSlot[] } {
  if (parsed.chords && parsed.chords.length > 0) {
    return parsed as ParsedScore & { chords: ChordSlot[] };
  }
  const chords = inferChords(parsed, mood, genre);
  const key = mood !== undefined
    ? { ...parsed.key, mode: mood }
    : parsed.key;
  return { ...parsed, key, chords };
}
