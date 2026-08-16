/**
 * Bridges HF expression playback (dynamics, articulations) into patched RiffScore Tone.Part triggers.
 * RiffScoreEditor calls {@link syncPlaybackExpressionCache} when the score changes.
 */
import type { EditableScore } from "./scoreTypes";
import { realizeSoundingTimeline } from "./realizeSoundingTimeline";

type G = typeof globalThis & {
  __HF_LOOKUP_PLAYBACK_VELOCITY?: (pitch: string, timeSec: number) => number | undefined;
  __HF_LOOKUP_PLAYBACK_DURATION?: (pitch: string, timeSec: number) => number | undefined;
};

let velocityByKey = new Map<string, number>();
let durationByKey = new Map<string, number>();
let lastBpm = 120;

function beatKey(partIndex: number, pitch: string, startBeat: number): string {
  return `${partIndex}:${pitch}:${startBeat.toFixed(5)}`;
}

/** Rebuild lookup tables from the current EditableScore (call after score edits). */
export function syncPlaybackExpressionCache(score: EditableScore, bpm = score.bpm ?? 120): void {
  lastBpm = bpm;
  const nextVel = new Map<string, number>();
  const nextDur = new Map<string, number>();
  const timeline = realizeSoundingTimeline(score);
  for (const ev of timeline) {
    const key = beatKey(ev.partIndex, ev.pitch, ev.startBeat);
    nextVel.set(key, ev.velocity);
    nextDur.set(key, ev.durationBeats);
  }
  velocityByKey = nextVel;
  durationByKey = nextDur;
}

function lookupByPitchTime(
  map: Map<string, number>,
  pitch: string,
  timeSec: number,
): number | undefined {
  const beat = (timeSec * lastBpm) / 60;
  let best: { dist: number; value: number } | null = null;
  for (const [key, value] of map) {
    const [, p, beatStr] = key.split(":");
    if (p !== pitch) continue;
    const startBeat = Number.parseFloat(beatStr ?? "");
    if (!Number.isFinite(startBeat)) continue;
    const dist = Math.abs(startBeat - beat);
    if (dist > 0.05) continue;
    if (!best || dist < best.dist) best = { dist, value };
  }
  return best?.value;
}

export function installPlaybackExpressionBridge(): void {
  const g = globalThis as G;
  g.__HF_LOOKUP_PLAYBACK_VELOCITY = (pitch, timeSec) =>
    lookupByPitchTime(velocityByKey, pitch, timeSec);
  g.__HF_LOOKUP_PLAYBACK_DURATION = (pitch, timeSec) =>
    lookupByPitchTime(durationByKey, pitch, timeSec);
}

export function isPlaybackExpressionBridgeInstalled(): boolean {
  const g = globalThis as G;
  return (
    typeof g.__HF_LOOKUP_PLAYBACK_VELOCITY === "function" &&
    typeof g.__HF_LOOKUP_PLAYBACK_DURATION === "function"
  );
}
