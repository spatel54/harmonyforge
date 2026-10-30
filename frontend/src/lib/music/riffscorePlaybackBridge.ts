/**
 * Patched RiffScore reads this on toolbar Play, **Space** (plain play), and **P**
 * (see `patch-package` on `riffscore`) so playback starts at HarmonyForge’s scrub
 * target even though internal React state is separate.
 */

export type HfRiffScorePlayFrom = { measureIndex: number; quant: number };

type G = typeof globalThis & {
  __HF_RIFFSCORE_PLAY_FROM?: HfRiffScorePlayFrom | null;
};

export function setPendingRiffScorePlayFrom(
  measureIndex: number,
  quant: number,
): void {
  (globalThis as G).__HF_RIFFSCORE_PLAY_FROM = { measureIndex, quant };
}

/** Park Play-from without starting audio. Timeline UI listens for `hf-playback-park`. */
export const HF_PLAYBACK_PARK_EVENT = "hf-playback-park";

export function parkPlaybackStart(measureIndex: number, quant: number): void {
  const m = Math.max(0, Math.floor(measureIndex));
  const q = Math.max(0, Math.floor(quant));
  setPendingRiffScorePlayFrom(m, q);
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(HF_PLAYBACK_PARK_EVENT, { detail: { measureIndex: m, quant: q } }),
  );
}

/** Pause toolbar/`playScore` transport (keeps the Play button in sync). */
export const HF_RIFFSCORE_PAUSE_EVENT = "hf-riffscore-pause";

export function pauseRiffScoreTransport(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HF_RIFFSCORE_PAUSE_EVENT));
}

export function clearPendingRiffScorePlayFrom(): void {
  (globalThis as G).__HF_RIFFSCORE_PLAY_FROM = null;
}

export { installPlaybackMetronomeBridge } from "./playbackMetronome";
export {
  clearHfPlaybackPosition,
  getHfPlaybackPositionTick,
  installPlaybackPositionBridge,
  isHfPlaybackTickActive,
  isPlaybackPositionBridgeInstalled,
} from "./playbackPositionBridge";
export type { HfPlaybackPositionTick } from "./playbackPositionBridge";
