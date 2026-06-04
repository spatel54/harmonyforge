/**
 * Tone.Part requires strictly increasing event times. Patched RiffScore calls
 * {@link installPlaybackPartScheduleBridge} so simultaneous multi-voice attacks
 * get micro-offsets without changing musical order.
 */

export type PartScheduleEvent = { time: number; [key: string]: unknown };

const MIN_STEP = 0.001;

export function countNonMonotonicPartTimes(events: PartScheduleEvent[]): number {
  let n = 0;
  for (let i = 1; i < events.length; i++) {
    if (events[i]!.time <= events[i - 1]!.time + 1e-9) n++;
  }
  return n;
}

export function ensureStrictlyIncreasingPartTimes<T extends PartScheduleEvent>(
  events: T[],
): T[] {
  let lastTime = -Infinity;
  return events.map((ev) => {
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

type G = typeof globalThis & {
  __HF_ENSURE_MONOTONIC_PART_TIMES?: <T extends PartScheduleEvent>(events: T[]) => T[];
};

export function installPlaybackPartScheduleBridge(): void {
  const g = globalThis as G;
  g.__HF_ENSURE_MONOTONIC_PART_TIMES = (events) =>
    ensureStrictlyIncreasingPartTimes(events);
}

export function isPlaybackPartScheduleBridgeInstalled(): boolean {
  return typeof (globalThis as G).__HF_ENSURE_MONOTONIC_PART_TIMES === "function";
}
