/**
 * Mirrors patched RiffScore `createTimeline` per-staff rawEvents sort (time-first).
 */

export type TimelineRawEvent = {
  time: number;
  pitch?: string | null;
  isRest?: boolean;
  staffIndex?: number;
};

export function compareTimelineRawEvents(
  a: TimelineRawEvent,
  b: TimelineRawEvent,
): number {
  const dt = a.time - b.time;
  if (Math.abs(dt) > 1e-9) return dt;
  if (a.isRest && b.isRest) return 0;
  if (a.isRest) return -1;
  if (b.isRest) return 1;
  if (a.pitch !== b.pitch) {
    return String(a.pitch ?? "").localeCompare(String(b.pitch ?? ""));
  }
  return (a.staffIndex ?? 0) - (b.staffIndex ?? 0);
}

export function sortTimelineRawEvents(events: TimelineRawEvent[]): TimelineRawEvent[] {
  return [...events].sort(compareTimelineRawEvents);
}
