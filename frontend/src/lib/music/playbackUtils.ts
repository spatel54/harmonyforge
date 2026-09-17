/**
 * Utilities for audio playback from score.
 * Converts EditableScore to scheduled note events for Tone.js.
 */

import type { EditableScore, Note } from "./scoreTypes";
import { noteBeats, parseMeasureBeats } from "./scoreUtils";
import { ensureStrictlyIncreasingPartTimes } from "./playbackPartSchedule";
import { realizeSoundingTimeline } from "./realizeSoundingTimeline";
import { beatsToSeconds, bpmAtBeat, type TempoMapEntry } from "./playbackTempoMap";

export interface ScheduledNote {
  startBeat: number;
  pitch: string;
  durationBeats: number;
  velocity?: number;
}

const PITCH_RE = /^[A-G](?:#{1,2}|b{1,2})?\d+$/;

export { parseMeasureBeats, parseMeasureBeats as parseBeatsPerMeasure };

export function noteDurationInBeats(note: Note): number {
  return noteBeats(note);
}

/**
 * Extract sounding notes (dynamics, articulations, ornaments, repeats) for playback/export.
 */
export function scoreToScheduledNotes(
  score: EditableScore,
  beatsPerMeasure = 4,
): ScheduledNote[] {
  return realizeSoundingTimeline(score, beatsPerMeasure).map((e) => ({
    startBeat: e.startBeat,
    pitch: e.pitch,
    durationBeats: e.durationBeats,
    velocity: e.velocity,
  }));
}

/**
 * Legacy flat scheduler (no expression) — kept for tests that need simple timing.
 */
export function scoreToScheduledNotesFlat(
  score: EditableScore,
  beatsPerMeasure = 4,
): ScheduledNote[] {
  const events: ScheduledNote[] = [];

  for (const part of score.parts) {
    let partBeatCursor = 0;
    part.measures.forEach((measure) => {
      const measureBeats = parseMeasureBeats(measure.timeSignature, beatsPerMeasure);
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
 */
export function scheduledNotesToSeconds(
  events: ScheduledNote[],
  tempo: number | TempoMapEntry[],
): Array<{ time: number; pitch: string; duration: number; velocity?: number }> {
  const map: TempoMapEntry[] = typeof tempo === "number" ? [{ startBeat: 0, bpm: tempo }] : tempo;
  const raw = events
    .map((e) => ({
      time: beatsToSeconds(e.startBeat, map),
      pitch: e.pitch,
      duration: (e.durationBeats * 60) / bpmAtBeat(e.startBeat, map),
      velocity: e.velocity,
    }))
    .sort((a, b) => a.time - b.time);

  return ensureStrictlyIncreasingPartTimes(raw);
}
