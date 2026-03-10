/**
 * HarmonyForge Logic Core — SATB constraint checks
 * Per Taxonomy.md §1.6: range, spacing, parallel fifths/octaves, voice crossing/overlap
 */

import {
  type SATBVoices,
  type Voice,
  pitchToMidi,
  inRange,
} from "./types.js";

const VOICES: Voice[] = ["Soprano", "Alto", "Tenor", "Bass"];

/** Interval in semitones between two MIDI notes (mod 12 for pitch class) */
function intervalSemitones(a: number, b: number): number {
  return Math.abs(a - b) % 12;
}

/** Perfect fifth = 7 semitones, perfect octave = 0 (mod 12), unison = 0 */
function isPerfectFifth(a: number, b: number): boolean {
  return intervalSemitones(a, b) === 7;
}

function isPerfectOctaveOrUnison(a: number, b: number): boolean {
  return intervalSemitones(a, b) === 0;
}

/** Direction of motion: 1 = up, -1 = down, 0 = same */
function direction(from: number, to: number): number {
  if (to > from) return 1;
  if (to < from) return -1;
  return 0;
}

const VOICE_KEYS: (keyof SATBVoices)[] = ["soprano", "alto", "tenor", "bass"];

/** Check all voices are in range */
export function checkRange(voices: SATBVoices): boolean {
  for (let i = 0; i < VOICES.length; i++) {
    const pitch = voices[VOICE_KEYS[i]];
    if (!inRange(VOICES[i], pitch)) return false;
  }
  return true;
}

/** Spacing: S–A ≤ octave (12), A–T ≤ octave, T–B ≤ twelfth (19) */
export function checkSpacing(voices: SATBVoices): boolean {
  const s = pitchToMidi(voices.soprano);
  const a = pitchToMidi(voices.alto);
  const t = pitchToMidi(voices.tenor);
  const b = pitchToMidi(voices.bass);

  if (s - a > 12) return false;
  if (a - t > 12) return false;
  if (t - b > 19) return false;
  return true;
}

/** No voice crossing: S ≥ A ≥ T ≥ B */
export function checkVoiceOrder(voices: SATBVoices): boolean {
  const s = pitchToMidi(voices.soprano);
  const a = pitchToMidi(voices.alto);
  const t = pitchToMidi(voices.tenor);
  const b = pitchToMidi(voices.bass);
  return s >= a && a >= t && t >= b;
}

/** Parallel fifths between prev and curr */
export function hasParallelFifth(
  prev: SATBVoices,
  curr: SATBVoices
): boolean {
  const pairs: [keyof SATBVoices, keyof SATBVoices][] = [
    ["soprano", "alto"],
    ["soprano", "tenor"],
    ["soprano", "bass"],
    ["alto", "tenor"],
    ["alto", "bass"],
    ["tenor", "bass"],
  ];
  for (const [v1, v2] of pairs) {
    const p1a = pitchToMidi(prev[v1]);
    const p1b = pitchToMidi(prev[v2]);
    const p2a = pitchToMidi(curr[v1]);
    const p2b = pitchToMidi(curr[v2]);
    if (
      isPerfectFifth(p1a, p1b) &&
      isPerfectFifth(p2a, p2b) &&
      direction(p1a, p2a) === direction(p1b, p2b) &&
      direction(p1a, p2a) !== 0
    ) {
      return true;
    }
  }
  return false;
}

/** Parallel octaves/unisons between prev and curr */
export function hasParallelOctave(
  prev: SATBVoices,
  curr: SATBVoices
): boolean {
  const pairs: [keyof SATBVoices, keyof SATBVoices][] = [
    ["soprano", "alto"],
    ["soprano", "tenor"],
    ["soprano", "bass"],
    ["alto", "tenor"],
    ["alto", "bass"],
    ["tenor", "bass"],
  ];
  for (const [v1, v2] of pairs) {
    const p1a = pitchToMidi(prev[v1]);
    const p1b = pitchToMidi(prev[v2]);
    const p2a = pitchToMidi(curr[v1]);
    const p2b = pitchToMidi(curr[v2]);
    if (
      isPerfectOctaveOrUnison(p1a, p1b) &&
      isPerfectOctaveOrUnison(p2a, p2b) &&
      direction(p1a, p2a) === direction(p1b, p2b) &&
      direction(p1a, p2a) !== 0
    ) {
      return true;
    }
  }
  return false;
}

/** Voice overlap: lower voice moves above prior upper-voice note */
export function hasVoiceOverlap(
  prev: SATBVoices,
  curr: SATBVoices
): boolean {
  const prevMidi = VOICE_KEYS.map((k) => pitchToMidi(prev[k]));
  const currMidi = VOICE_KEYS.map((k) => pitchToMidi(curr[k]));

  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      // i is upper voice, j is lower
      if (currMidi[j] > prevMidi[i]) return true;
      if (currMidi[i] < prevMidi[j]) return true;
    }
  }
  return false;
}

/** All constraints for a single chord (no prev) */
export function checkChordConstraints(voices: SATBVoices): boolean {
  return checkRange(voices) && checkSpacing(voices) && checkVoiceOrder(voices);
}

/**
 * All constraints including voice-leading from prev.
 * Validation ordering (HFLitReview): run hard checks first, short-circuit before soft.
 * Order: (1) intra-chord range/spacing/order, (2) parallel fifths, (3) parallel octaves, (4) voice overlap.
 */
export function checkVoiceLeading(
  prev: SATBVoices | null,
  curr: SATBVoices
): boolean {
  if (!checkChordConstraints(curr)) return false;
  if (prev === null) return true;
  if (hasParallelFifth(prev, curr)) return false;
  if (hasParallelOctave(prev, curr)) return false;
  if (hasVoiceOverlap(prev, curr)) return false;
  return true;
}

/** Relaxed voice-leading: allow parallel fifths/octaves, only check range and order */
export function checkVoiceLeadingRelaxed(
  prev: SATBVoices | null,
  curr: SATBVoices
): boolean {
  if (!checkChordConstraints(curr)) return false;
  if (prev === null) return true;
  if (hasVoiceOverlap(prev, curr)) return false;
  return true;
}
