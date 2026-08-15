/**
 * Like scoreToScheduledNotes, but tags each event with the source part name for timbre mapping.
 */
import type { EditableScore } from "./scoreTypes";
import { ensureStrictlyIncreasingPartTimes } from "./playbackPartSchedule";
import { realizeSoundingTimeline } from "./realizeSoundingTimeline";
import type { ScheduledNote } from "./playbackUtils";

export interface ScheduledPartNote extends ScheduledNote {
  partName: string;
}

/**
 * Build timed note events with expression realization, each tagged with `partName`.
 */
export function scoreToScheduledPartNotes(
  score: EditableScore,
  beatsPerMeasure = 4,
): ScheduledPartNote[] {
  return realizeSoundingTimeline(score, beatsPerMeasure).map((e) => ({
    startBeat: e.startBeat,
    pitch: e.pitch,
    durationBeats: e.durationBeats,
    velocity: e.velocity,
    partName: e.partName,
  }));
}

/**
 * Map part-tagged events to seconds, preserving `partName` (same offset rules as scheduledNotesToSeconds).
 */
export function scheduledPartNotesToSeconds(
  events: ScheduledPartNote[],
  bpm: number,
): Array<{ time: number; pitch: string; duration: number; partName: string; velocity?: number }> {
  const secondsPerBeat = 60 / bpm;
  const raw = events
    .map((e) => ({
      time: e.startBeat * secondsPerBeat,
      pitch: e.pitch,
      duration: e.durationBeats * secondsPerBeat,
      partName: e.partName,
      velocity: e.velocity,
    }))
    .sort((a, b) => a.time - b.time);
  return ensureStrictlyIncreasingPartTimes(raw);
}
