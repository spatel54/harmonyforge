/**
 * Like scoreToScheduledNotes, but tags each event with the source part name for timbre mapping.
 */
import type { EditableScore } from "./scoreTypes";
import { ensureStrictlyIncreasingPartTimes } from "./playbackPartSchedule";
import { realizeSoundingTimeline } from "./realizeSoundingTimeline";
import type { ScheduledNote } from "./playbackUtils";
import { beatsToSeconds, bpmAtBeat, type TempoMapEntry } from "./playbackTempoMap";

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
  tempo: number | TempoMapEntry[],
): Array<{ time: number; pitch: string; duration: number; partName: string; velocity?: number }> {
  const map: TempoMapEntry[] = typeof tempo === "number" ? [{ startBeat: 0, bpm: tempo }] : tempo;
  const raw = events
    .map((e) => ({
      time: beatsToSeconds(e.startBeat, map),
      pitch: e.pitch,
      duration: (e.durationBeats * 60) / bpmAtBeat(e.startBeat, map),
      partName: e.partName,
      velocity: e.velocity,
    }))
    .sort((a, b) => a.time - b.time);
  return ensureStrictlyIncreasingPartTimes(raw);
}
