/**
 * Extract a cantus-style melody for SATB generation from OMR / piano reductions.
 *
 * Audiveris often emits a single Piano part with both hands interleaved. Locking
 * the SATB soprano to bass-register notes makes the solver fail even when the
 * same chord progression is solvable without a melody lock.
 */

import type { MelodyNote } from "./types";
import { getVoiceRange, pitchToMidi } from "./types";

const SOPRANO_FLOOR = getVoiceRange("Soprano").min; // C4
/** Pitch span (semitones) that suggests a multi-register / two-hand reduction. */
const WIDE_SPAN_SEMITONES = 19;

function collapseHighestPerOnset(notes: MelodyNote[]): MelodyNote[] {
  const byBeat = new Map<number, MelodyNote>();
  for (const note of notes) {
    const beatKey = Math.round(note.beat * 1000) / 1000;
    const prev = byBeat.get(beatKey);
    if (!prev || pitchToMidi(note.pitch) > pitchToMidi(prev.pitch)) {
      byBeat.set(beatKey, note);
    }
  }
  return [...byBeat.values()].sort((a, b) => a.beat - b.beat);
}

/**
 * Prefer upper-register notes for the cantus. Falls back to the upper half of the
 * observed pitch range when almost nothing reaches the soprano floor.
 */
export function extractCantusMelody(melody: MelodyNote[]): MelodyNote[] {
  if (melody.length === 0) return melody;

  const withMidi = melody.map((note) => ({ note, midi: pitchToMidi(note.pitch) }));
  const maxMidi = Math.max(...withMidi.map((x) => x.midi));
  const minMidi = Math.min(...withMidi.map((x) => x.midi));
  const wide = maxMidi - minMidi >= WIDE_SPAN_SEMITONES;

  let kept = withMidi.filter((x) => x.midi >= SOPRANO_FLOOR).map((x) => x.note);
  if (!wide && kept.length === melody.length) {
    return collapseHighestPerOnset(melody);
  }

  if (kept.length < Math.max(4, Math.floor(melody.length * 0.12))) {
    const mid = (maxMidi + minMidi) / 2;
    kept = withMidi.filter((x) => x.midi >= mid).map((x) => x.note);
  }
  if (kept.length === 0) kept = melody;

  return collapseHighestPerOnset(kept);
}
