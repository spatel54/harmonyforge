import type { EditableScore } from "./scoreTypes";

/** RiffScore session or any object exposing flush into Zustand. */
export type RiffFlushable = { flushToZustand: () => void };

/**
 * Pull latest editor state into Zustand, then read the canonical score.
 * Call before any export, copy, save, or validation that must match the tactile canvas.
 */
export function getLiveScoreAfterFlush(
  session: RiffFlushable | null | undefined,
  getScore: () => EditableScore | null,
): EditableScore | null {
  session?.flushToZustand();
  return getScore();
}
