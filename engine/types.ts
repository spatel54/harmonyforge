/**
 * HarmonyForge Logic Core — Shared types and pitch helpers
 * SATB ranges: conventional choral clamps (Aldwell & Schachter / Open Music Theory pedagogy); see Taxonomy.md §1.6.
 */

export type PitchClass =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";

export type Voice = "Soprano" | "Alto" | "Tenor" | "Bass";

/** Genre affects harmony theory only (chord inference, voice-leading strictness). Per HFLitReview. */
export type Genre = "classical" | "jazz" | "pop";

/** Config for generation: mood + genre affect chord inference/voice-leading; instruments used for MusicXML part names */
export interface GenerationConfig {
  mood?: "major" | "minor";
  genre?: Genre;
  instruments?: Record<Voice, string[]>;
}

export interface KeyContext {
  tonic: PitchClass;
  mode: "major" | "minor";
}

export interface ChordSlot {
  roman: string;
  duration?: string;
  beat?: number;
}

export interface MelodyNote {
  pitch: string;
  beat: number;
  duration?: number;
  measure?: number;
}

export interface LeadSheet {
  key: KeyContext;
  chords: ChordSlot[];
  melody?: MelodyNote[];
}

/** Canonical format from file parsers (XML/MIDI) before solver */
export interface ParsedScore {
  key: KeyContext;
  melody: MelodyNote[];
  chords?: ChordSlot[];
  timeSignature?: {
    beats: number;
    beatType: number;
  };
  totalBeats?: number;
  totalMeasures?: number;
  /** Original melody part name from input (e.g. "Violin") for additive output */
  melodyPartName?: string;
}

export interface SATBVoices {
  soprano: string;
  alto: string;
  tenor: string;
  bass: string;
}

/** Parsed chord with pitch classes (0–11) */
export interface ParsedChord {
  rootPc: number;
  thirdPc: number;
  fifthPc: number;
  seventhPc?: number;
  bassPc: number;
  /** Chord tones as pitch classes for voice assignment */
  chordTones: number[];
}

// ─── SATB Ranges (MIDI note numbers) per Taxonomy.md §1.6 ─────────────────────
const RANGES: Record<Voice, { min: number; max: number }> = {
  Soprano: { min: 60, max: 79 }, // C4–G5
  Alto: { min: 55, max: 74 }, // G3–D5
  Tenor: { min: 48, max: 67 }, // C3–G4
  Bass: { min: 41, max: 62 }, // F2–D4
};

const PITCH_CLASSES: PitchClass[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

/** Parse "C4" or "G#3" → MIDI note number */
export function pitchToMidi(pitch: string): number {
  const match = pitch.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) throw new Error(`Invalid pitch: ${pitch}`);
  const [, pc, oct] = match;
  const pcIndex = PITCH_CLASSES.indexOf(pc as PitchClass);
  if (pcIndex < 0) throw new Error(`Unknown pitch class: ${pc}`);
  const octave = parseInt(oct, 10);
  return 12 * (octave + 1) + pcIndex;
}

/** MIDI note number → "C4" or "G#3" */
export function midiToPitch(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const pcIndex = ((midi % 12) + 12) % 12;
  return `${PITCH_CLASSES[pcIndex]}${octave}`;
}

/** Check if pitch (as "C4" or MIDI) is within voice range */
export function inRange(voice: Voice, pitch: string | number): boolean {
  const midi = typeof pitch === "string" ? pitchToMidi(pitch) : pitch;
  const range = RANGES[voice];
  return midi >= range.min && midi <= range.max;
}

/** Get valid MIDI range for a voice */
export function getVoiceRange(voice: Voice): { min: number; max: number } {
  return { ...RANGES[voice] };
}

/** Get pitch class (0–11) from pitch string */
export function pitchToPc(pitch: string): number {
  const match = pitch.match(/^([A-G]#?)/);
  if (!match) throw new Error(`Invalid pitch: ${pitch}`);
  const pc = match[1];
  const idx = PITCH_CLASSES.indexOf(pc as PitchClass);
  if (idx < 0) throw new Error(`Unknown pitch class: ${pc}`);
  return idx;
}
