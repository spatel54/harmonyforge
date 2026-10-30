/**
 * Bridges HF expression playback (dynamics, articulations, tempo map) into patched RiffScore Tone.Part triggers.
 * RiffScoreEditor calls {@link syncPlaybackExpressionCache} when the score changes.
 */
import type { EditableScore } from "./scoreTypes";
import { pitchLetterOctave, pitchStringToMidi } from "./pitchMidi";
import {
  bpmAtBeat,
  buildLiveTempoMap,
  buildTempoMap,
  measureStartBeats,
  midiVelocityToSamplerGain,
  remapPlaybackTimeline,
  secondsToBeat,
  type RemapPlaybackTimelineEvent,
  type TempoMapEntry,
} from "./playbackTempoMap";
import { realizeSoundingTimeline, type SoundingEvent } from "./realizeSoundingTimeline";

type G = typeof globalThis & {
  __HF_LOOKUP_PLAYBACK_VELOCITY?: (
    pitch: string,
    timeSec: number,
    measureIndex?: number,
    quant?: number,
  ) => number | undefined;
  __HF_LOOKUP_PLAYBACK_GAIN?: (
    pitch: string,
    timeSec: number,
    measureIndex?: number,
    quant?: number,
  ) => number | undefined;
  __HF_LOOKUP_PLAYBACK_DURATION?: (
    pitch: string,
    timeSec: number,
    measureIndex?: number,
    quant?: number,
  ) => number | undefined;
  __HF_LOOKUP_PLAYBACK_LOCAL_BPM?: (
    pitch: string,
    timeSec: number,
    measureIndex?: number,
    quant?: number,
  ) => number | undefined;
  __HF_REMAP_PLAYBACK_TIMELINE?: (
    timeline: RemapPlaybackTimelineEvent[],
    assumedBpm: number,
    startTimeOffset: number,
  ) => { timeline: RemapPlaybackTimelineEvent[]; startTimeOffset: number };
};

type CachedEvent = SoundingEvent;

let events: CachedEvent[] = [];
let tempoMap: TempoMapEntry[] = [];
let barStarts: number[] = [];
let lastScore: EditableScore | null = null;
let playbackScheduleGen = 0;

function pitchesMatch(query: string, ev: CachedEvent): boolean {
  if (!query) return true;
  if (query === ev.pitch || query === ev.rsPitch) return true;
  const letter = pitchLetterOctave(query);
  if (letter === ev.rsPitch || letter === pitchLetterOctave(ev.pitch)) return true;
  const qMidi = pitchStringToMidi(query);
  const eMidi = pitchStringToMidi(ev.pitch);
  return qMidi != null && eMidi != null && qMidi === eMidi;
}

function beatFromArgs(timeSec: number, measureIndex?: number, quant?: number): number {
  if (typeof measureIndex === "number" && Number.isFinite(measureIndex) && measureIndex >= 0) {
    const start = barStarts[measureIndex];
    if (typeof start === "number") {
      const q = typeof quant === "number" && Number.isFinite(quant) ? quant : 0;
      return start + q / 16;
    }
  }
  return secondsToBeat(timeSec, tempoMap);
}

function lookupEvent(
  pitch: string,
  timeSec: number,
  measureIndex?: number,
  quant?: number,
): CachedEvent | undefined {
  if (events.length === 0) return undefined;
  const beat = beatFromArgs(timeSec, measureIndex, quant);
  const windows = [0.12, 0.28, 0.55];

  for (const window of windows) {
    let best: { dist: number; ev: CachedEvent } | null = null;
    for (const ev of events) {
      if (!pitchesMatch(pitch, ev)) continue;
      const dist = Math.abs(ev.startBeat - beat);
      if (dist > window) continue;
      if (!best || dist < best.dist) best = { dist, ev };
    }
    if (best) return best.ev;
  }

  let nearest: { dist: number; ev: CachedEvent } | null = null;
  for (const ev of events) {
    if (ev.startBeat - beat > 0.08) continue;
    const dist = beat - ev.startBeat;
    if (!nearest || dist < nearest.dist) nearest = { dist, ev };
  }
  return nearest?.ev;
}

/** Rebuild lookup tables from the current EditableScore (call after score edits). */
export function syncPlaybackExpressionCache(score: EditableScore): void {
  lastScore = score;
  events = realizeSoundingTimeline(score);
  tempoMap = buildTempoMap(score);
  barStarts = measureStartBeats(score);
}

export function resetPlaybackExpressionCache(): void {
  events = [];
  tempoMap = [];
  barStarts = [];
  lastScore = null;
}

export function getPlaybackScheduleGeneration(): number {
  return playbackScheduleGen;
}

export function getCachedTempoMap(): TempoMapEntry[] {
  return tempoMap;
}

/** Live toolbar/map BPM for playhead interpolation (falls back to undefined if unsynced). */
export function getLivePlaybackBpm(measureIndex = 0, quant = 0): number | undefined {
  if (tempoMap.length === 0) return undefined;
  const start = barStarts[measureIndex] ?? 0;
  const beat = start + Math.max(0, quant) / 16;
  return bpmAtBeat(beat, tempoMap);
}

export function installPlaybackExpressionBridge(): void {
  const g = globalThis as G;
  g.__HF_LOOKUP_PLAYBACK_VELOCITY = (pitch, timeSec, measureIndex, quant) =>
    lookupEvent(pitch, timeSec, measureIndex, quant)?.velocity;
  g.__HF_LOOKUP_PLAYBACK_GAIN = (pitch, timeSec, measureIndex, quant) => {
    const ev = lookupEvent(pitch, timeSec, measureIndex, quant);
    if (!ev) return undefined;
    return midiVelocityToSamplerGain(ev.velocity);
  };
  g.__HF_LOOKUP_PLAYBACK_DURATION = (pitch, timeSec, measureIndex, quant) =>
    lookupEvent(pitch, timeSec, measureIndex, quant)?.durationBeats;
  g.__HF_LOOKUP_PLAYBACK_LOCAL_BPM = (pitch, timeSec, measureIndex, quant) => {
    const beat = beatFromArgs(timeSec, measureIndex, quant);
    return bpmAtBeat(beat, tempoMap);
  };
  g.__HF_REMAP_PLAYBACK_TIMELINE = (timeline, assumedBpm, startTimeOffset) => {
    if (lastScore) {
      tempoMap = buildLiveTempoMap(lastScore, assumedBpm);
    }
    playbackScheduleGen += 1;
    return remapPlaybackTimeline(timeline, assumedBpm, startTimeOffset, tempoMap);
  };
}

export function isPlaybackExpressionBridgeInstalled(): boolean {
  const g = globalThis as G;
  return (
    typeof g.__HF_LOOKUP_PLAYBACK_VELOCITY === "function" &&
    typeof g.__HF_LOOKUP_PLAYBACK_DURATION === "function" &&
    typeof g.__HF_REMAP_PLAYBACK_TIMELINE === "function"
  );
}
