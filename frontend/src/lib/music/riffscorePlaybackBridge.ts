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

export function clearPendingRiffScorePlayFrom(): void {
  (globalThis as G).__HF_RIFFSCORE_PLAY_FROM = null;
}
