/**
 * Patched RiffScore notifies HarmonyForge on each playback segment (notes and rests)
 * so the scrub overlay can advance through silence without relying on SVG cursor motion.
 */

export type HfPlaybackPositionTick = {
  measureIndex: number;
  quant: number;
  /** Segment length in seconds (note or rest). */
  durationSec: number;
  at: number;
};

type G = typeof globalThis & {
  __HF_ON_PLAYBACK_POSITION?: (
    measureIndex: number,
    quant: number,
    durationSec: number,
  ) => void;
  __HF_CLEAR_PLAYBACK_POSITION?: () => void;
};

let lastTick: HfPlaybackPositionTick | null = null;

function onPlaybackPosition(
  measureIndex: number,
  quant: number,
  durationSec: number,
): void {
  lastTick = {
    measureIndex,
    quant,
    durationSec,
    at: typeof performance !== "undefined" ? performance.now() : Date.now(),
  };
}

function clearPlaybackPosition(): void {
  lastTick = null;
}

export function getHfPlaybackPositionTick(): HfPlaybackPositionTick | null {
  return lastTick;
}

export function installPlaybackPositionBridge(): void {
  const g = globalThis as G;
  g.__HF_ON_PLAYBACK_POSITION = onPlaybackPosition;
  g.__HF_CLEAR_PLAYBACK_POSITION = clearPlaybackPosition;
}

export function isPlaybackPositionBridgeInstalled(): boolean {
  const g = globalThis as G;
  return (
    typeof g.__HF_ON_PLAYBACK_POSITION === "function" &&
    typeof g.__HF_CLEAR_PLAYBACK_POSITION === "function"
  );
}

export function clearHfPlaybackPosition(): void {
  clearPlaybackPosition();
}
