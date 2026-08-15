/** Rubber-band overshoot for gesture boundaries (Apple fluid interfaces). */

export function rubberbandOvershoot(
  overshoot: number,
  dimension: number,
  constant = 0.55,
): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export function clampWithRubberband(
  value: number,
  min: number,
  max: number,
  dimension: number,
): number {
  if (value < min) {
    return min - rubberbandOvershoot(min - value, dimension);
  }
  if (value > max) {
    return max + rubberbandOvershoot(value - max, dimension);
  }
  return value;
}

export type PointerVelocitySample = { x: number; y: number; t: number };

export function pointerVelocityPxPerSec(
  samples: PointerVelocitySample[],
): { vx: number; vy: number } {
  if (samples.length < 2) return { vx: 0, vy: 0 };
  const a = samples[samples.length - 2]!;
  const b = samples[samples.length - 1]!;
  const dt = (b.t - a.t) / 1000;
  if (dt <= 0) return { vx: 0, vy: 0 };
  return { vx: (b.x - a.x) / dt, vy: (b.y - a.y) / dt };
}

export function clampFloatInspectorPosition(
  left: number,
  top: number,
  width: number,
  height: number,
  pad = 8,
): { left: number; top: number } {
  return {
    left: Math.max(pad, Math.min(left, window.innerWidth - width - pad)),
    top: Math.max(pad, Math.min(top, window.innerHeight - height - pad)),
  };
}
