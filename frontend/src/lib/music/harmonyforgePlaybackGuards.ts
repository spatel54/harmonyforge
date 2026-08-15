/**
 * Installed once at app boot (`layout.tsx`) so patched RiffScore never auditions chord symbols
 * (score play, symbol select, or keyboard navigation).
 * `RiffScoreEditor` re-installs metronome/position bridges on mount for editor lifecycle order;
 * all installs are idempotent.
 */
import { installPlaybackDebugBridge } from "./playbackDebugLog";
import { installPlaybackMetronomeBridge } from "./playbackMetronome";
import { installPlaybackPositionBridge } from "./playbackPositionBridge";
import { installPlaybackPartScheduleBridge } from "./playbackPartSchedule";
import { installPlaybackExpressionBridge } from "./playbackExpressionBridge";

let installed = false;

export function ensureHarmonyForgePlaybackGuards(): void {
  if (installed) return;
  installPlaybackMetronomeBridge();
  installPlaybackPositionBridge();
  installPlaybackDebugBridge();
  installPlaybackPartScheduleBridge();
  installPlaybackExpressionBridge();
  installed = true;
}

ensureHarmonyForgePlaybackGuards();
