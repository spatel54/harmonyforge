/**
 * Per-measure tempo map for playback / export.
 * Palette markings live on the measure (`tempoBpm` / `tempoText`); `score.bpm` is only the
 * starting (measure-0 or toolbar) tempo.
 */
import type { EditableScore, Measure } from "./scoreTypes";
import { measureLengthBeats } from "./scoreUtils";

export const DEFAULT_PLAYBACK_BPM = 120;

export type TempoMapEntry = { startBeat: number; bpm: number };

const NAMED_TEMPO_BPM: Record<string, number> = {
  largo: 40,
  adagio: 66,
  andante: 76,
  moderato: 108,
  allegro: 132,
  presto: 168,
};

export function parseTempoBpmFromText(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const numeric = text.match(/=\s*(\d{2,3})/);
  if (numeric) {
    const bpm = Number.parseInt(numeric[1] ?? "", 10);
    if (Number.isFinite(bpm) && bpm > 0) return bpm;
  }
  const lower = text.toLowerCase();
  for (const [name, bpm] of Object.entries(NAMED_TEMPO_BPM)) {
    if (lower.includes(name)) return bpm;
  }
  return undefined;
}

export function resolveMeasureTempoBpm(measure: Measure | undefined): number | undefined {
  if (!measure) return undefined;
  if (typeof measure.tempoBpm === "number" && measure.tempoBpm > 0) return measure.tempoBpm;
  return parseTempoBpmFromText(measure.tempoText);
}

export function buildTempoMap(score: EditableScore, fallback = DEFAULT_PLAYBACK_BPM): TempoMapEntry[] {
  const startBpm = score.bpm != null && score.bpm > 0 ? score.bpm : fallback;
  const ref = score.parts[0];
  if (!ref || ref.measures.length === 0) return [{ startBeat: 0, bpm: startBpm }];

  const entries: TempoMapEntry[] = [];
  let beat = 0;
  let current: number | null = null;

  for (let i = 0; i < ref.measures.length; i++) {
    const marked = resolveMeasureTempoBpm(ref.measures[i]);
    if (marked != null && marked > 0 && marked !== current) {
      entries.push({ startBeat: beat, bpm: marked });
      current = marked;
    }
    beat += measureLengthBeats(score, i);
  }

  if (entries.length === 0) return [{ startBeat: 0, bpm: startBpm }];
  if (entries[0]!.startBeat > 0) {
    entries.unshift({ startBeat: 0, bpm: startBpm });
  }
  return entries;
}

/**
 * Playback map whose unmarked start is the live toolbar BPM (RiffScore assumed tempo).
 * Measure markings still override from that bar onward.
 */
export function buildLiveTempoMap(score: EditableScore, liveBpm: number): TempoMapEntry[] {
  const bpm = liveBpm > 0 ? liveBpm : DEFAULT_PLAYBACK_BPM;
  return buildTempoMap({ ...score, bpm });
}

export function bpmAtBeat(beat: number, map: TempoMapEntry[]): number {
  let bpm = map[0]?.bpm ?? DEFAULT_PLAYBACK_BPM;
  for (const entry of map) {
    if (beat + 1e-9 >= entry.startBeat) bpm = entry.bpm;
    else break;
  }
  return bpm;
}

export function beatsToSeconds(beat: number, map: TempoMapEntry[]): number {
  if (beat <= 0) return 0;
  let sec = 0;
  for (let i = 0; i < map.length; i++) {
    const start = map[i]!.startBeat;
    const bpm = map[i]!.bpm;
    const end = i + 1 < map.length ? map[i + 1]!.startBeat : Infinity;
    if (beat <= start) break;
    const span = Math.min(beat, end) - start;
    if (span > 0) sec += (span * 60) / bpm;
  }
  return sec;
}

export function secondsToBeat(sec: number, map: TempoMapEntry[]): number {
  if (sec <= 0) return 0;
  let remaining = sec;
  for (let i = 0; i < map.length; i++) {
    const start = map[i]!.startBeat;
    const bpm = map[i]!.bpm;
    const end = i + 1 < map.length ? map[i + 1]!.startBeat : start + 1e9;
    const spanBeats = Math.max(0, end - start);
    const spanSec = (spanBeats * 60) / bpm;
    if (remaining <= spanSec + 1e-9 || i === map.length - 1) {
      return start + (remaining * bpm) / 60;
    }
    remaining -= spanSec;
  }
  return 0;
}

export function measureStartBeats(score: EditableScore): number[] {
  const n = score.parts[0]?.measures.length ?? 0;
  const starts: number[] = [];
  let beat = 0;
  for (let i = 0; i < n; i++) {
    starts.push(beat);
    beat += measureLengthBeats(score, i);
  }
  return starts;
}

export type RemapPlaybackTimelineEvent = {
  time: number;
  duration: number;
  [key: string]: unknown;
};

export type RemapPlaybackTimelineResult = {
  timeline: RemapPlaybackTimelineEvent[];
  startTimeOffset: number;
};

/** Convert a constant-BPM RiffScore timeline into wall-clock seconds using the live tempo map. */
export function remapPlaybackTimeline(
  timeline: RemapPlaybackTimelineEvent[],
  assumedBpm: number,
  startTimeOffset: number,
  map: TempoMapEntry[],
): RemapPlaybackTimelineResult {
  const bpm = assumedBpm > 0 ? assumedBpm : DEFAULT_PLAYBACK_BPM;
  const remapTime = (t: number) => beatsToSeconds((t * bpm) / 60, map);
  const remapDur = (t: number, d: number) => {
    const beat = (t * bpm) / 60;
    const durBeats = (d * bpm) / 60;
    const local = bpmAtBeat(beat, map);
    return (durBeats * 60) / local;
  };
  return {
    timeline: timeline.map((e) => ({
      ...e,
      duration: remapDur(e.time, e.duration),
      time: remapTime(e.time),
    })),
    startTimeOffset: remapTime(startTimeOffset),
  };
}

/** Perceptual gain so single-layer piano samples actually get quieter/louder with dynamics. */
export function midiVelocityToSamplerGain(midiVelocity: number): number {
  const t = Math.max(0, Math.min(1, midiVelocity / 127));
  const db = -20 + 20 * Math.pow(t, 0.75);
  return Math.pow(10, db / 20);
}
