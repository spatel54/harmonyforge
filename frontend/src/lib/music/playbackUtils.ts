/**
 * Utilities for audio playback from score.
 * Converts EditableScore to scheduled note events for Tone.js.
 */

import type { EditableScore, Note } from "./scoreTypes";

/** Duration type → beats (quarter = 1) */
const DURATION_BEATS: Record<string, number> = {
  w: 4,
  h: 2,
  q: 1,
  "8": 0.5,
  "16": 0.25,
  "32": 0.125,
};

export interface ScheduledNote {
  startBeat: number;
  pitch: string;
  durationBeats: number;
}

const PITCH_RE = /^[A-G](?:#{1,2}|b{1,2})?\d+$/;

function parseBeatsPerMeasure(timeSignature?: string, fallback = 4): number {
  if (!timeSignature) return fallback;
  const match = timeSignature.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) return fallback;
  const numerator = Number.parseInt(match[1], 10);
  const denominator = Number.parseInt(match[2], 10);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return fallback;
  }
  // quarter note = 1 beat in this app's beat model
  return numerator * (4 / denominator);
}

function noteDurationInBeats(note: Note): number {
  let durationBeats = DURATION_BEATS[note.duration] ?? 1;
  if (note.dots) {
    durationBeats *= 1.5;
  }
  return durationBeats;
}

/**
 * Extract all notes from score with timing (startBeat, durationBeats).
 * Merges all parts; notes from different parts at same beat play together.
 */
export function scoreToScheduledNotes(
  score: EditableScore,
  beatsPerMeasure = 4
): ScheduledNote[] {
  const events: ScheduledNote[] = [];

  for (const part of score.parts) {
    let partBeatCursor = 0;
    part.measures.forEach((measure) => {
      const measureBeats = parseBeatsPerMeasure(measure.timeSignature, beatsPerMeasure);
      const measureStartBeat = partBeatCursor;
      let currentBeat = measureStartBeat;
      for (const note of measure.notes) {
        const durationBeats = noteDurationInBeats(note);

        if (!note.isRest && PITCH_RE.test(note.pitch)) {
          events.push({
            startBeat: currentBeat,
            pitch: note.pitch,
            durationBeats,
          });
        }
        currentBeat += durationBeats;
      }
      partBeatCursor = Math.max(measureStartBeat + measureBeats, currentBeat);
    });
  }

  return events;
}

/**
 * Convert scheduled notes to seconds for Tone.js.
 * Ensures strictly increasing times (Tone.Part requires this for chords/simultaneous notes).
 * @param events Scheduled notes in beats
 * @param bpm Tempo (beats per minute)
 */
export function scheduledNotesToSeconds(
  events: ScheduledNote[],
  bpm: number
): Array<{ time: number; pitch: string; duration: number }> {
  const secondsPerBeat = 60 / bpm;
  const raw = events
    .map((e) => ({
      time: e.startBeat * secondsPerBeat,
      pitch: e.pitch,
      duration: e.durationBeats * secondsPerBeat,
    }))
    .sort((a, b) => a.time - b.time);

  // Tone.Part requires strictly increasing time; add offset for simultaneous notes (chords)
  const MIN_STEP = 0.001; // 1ms — Tone's scheduler resolution
  let lastTime = -Infinity;
  return raw.map((ev) => {
    if (ev.time <= lastTime) {
      lastTime += MIN_STEP;
      return { ...ev, time: lastTime };
    }
    lastTime = ev.time;
    return ev;
  });
}
