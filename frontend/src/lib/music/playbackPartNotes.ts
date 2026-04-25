/**
 * Like scoreToScheduledNotes, but tags each event with the source part name for timbre mapping.
 */
import type { EditableScore, Note } from "./scoreTypes";
import { noteDurationInBeats, parseBeatsPerMeasure, type ScheduledNote } from "./playbackUtils";

const PITCH_RE = /^[A-G](?:#{1,2}|b{1,2})?\d+$/;

export interface ScheduledPartNote extends ScheduledNote {
  partName: string;
}

/**
 * Build timed note events, each with `partName` for playback orchestration.
 */
export function scoreToScheduledPartNotes(
  score: EditableScore,
  beatsPerMeasure = 4,
): ScheduledPartNote[] {
  const events: ScheduledPartNote[] = [];

  for (const part of score.parts) {
    let partBeatCursor = 0;
    const name = part.name?.trim() || "Part";
    part.measures.forEach((measure) => {
      const measureBeats = parseBeatsPerMeasure(measure.timeSignature, beatsPerMeasure);
      const measureStartBeat = partBeatCursor;
      let currentBeat = measureStartBeat;
      for (const note of measure.notes) {
        const durationBeats = noteDurationInBeats(note);
        if (!note.isRest && isPlayablePitch(note, PITCH_RE)) {
          events.push({
            startBeat: currentBeat,
            pitch: note.pitch,
            durationBeats,
            partName: name,
          });
        }
        currentBeat += durationBeats;
      }
      partBeatCursor = Math.max(measureStartBeat + measureBeats, currentBeat);
    });
  }

  return events;
}

function isPlayablePitch(note: Note, re: RegExp): boolean {
  return re.test(note.pitch);
}

/**
 * Map part-tagged events to seconds, preserving `partName` (same offset rules as scheduledNotesToSeconds).
 */
export function scheduledPartNotesToSeconds(
  events: ScheduledPartNote[],
  bpm: number,
): Array<{ time: number; pitch: string; duration: number; partName: string }> {
  const secondsPerBeat = 60 / bpm;
  const raw = events
    .map((e) => ({
      time: e.startBeat * secondsPerBeat,
      pitch: e.pitch,
      duration: e.durationBeats * secondsPerBeat,
      partName: e.partName,
    }))
    .sort((a, b) => a.time - b.time);
  const MIN_STEP = 0.001;
  let lastTime = -Infinity;
  return raw.map((ev) => {
    let t = ev.time;
    if (t <= lastTime) {
      lastTime += MIN_STEP;
      t = lastTime;
    } else {
      lastTime = t;
    }
    return { ...ev, time: t };
  });
}
