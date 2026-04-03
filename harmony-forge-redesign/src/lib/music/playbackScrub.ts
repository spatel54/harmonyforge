/**
 * Map horizontal pointer position to RiffScore play(startMeasure, startQuant).
 * RiffScore uses 16 quants per quarter note; typical 4/4 = 64 quants per measure.
 */

import type { EditableScore, NotePosition } from "./scoreTypes";

/** Mirrors riffscore TIME_SIGNATURES (quants per full measure). */
const TIME_SIG_QUANTS: Record<string, number> = {
  "4/4": 64,
  "3/4": 48,
  "2/4": 32,
  "6/8": 48,
};

export interface MeasurePlaybackSpan {
  measureIndex: number;
  startX: number;
  endX: number;
}

export function riffQuantsForMeasure(
  score: EditableScore,
  measureIndex: number,
): number {
  const part0 = score.parts[0];
  if (!part0) return 64;
  const m = part0.measures[measureIndex];
  const ts =
    m?.timeSignature ?? part0.measures[0]?.timeSignature ?? "4/4";
  return TIME_SIG_QUANTS[ts] ?? 64;
}

/**
 * Build horizontal spans per measure from rendered note geometry.
 * Boundaries between measures use the midpoint between adjacent content.
 */
export function buildMeasurePlaybackSpans(
  positions: NotePosition[],
  measureCount: number,
  contentRightFallback: number,
): MeasurePlaybackSpan[] {
  if (measureCount <= 0) return [];

  const agg = new Map<number, { minX: number; maxX: number }>();
  for (const p of positions) {
    const m = p.selection.measureIndex;
    if (m < 0 || m >= measureCount) continue;
    const minX = p.x;
    const maxX = p.x + p.w;
    const cur = agg.get(m);
    if (!cur) agg.set(m, { minX, maxX });
    else {
      cur.minX = Math.min(cur.minX, minX);
      cur.maxX = Math.max(cur.maxX, maxX);
    }
  }

  const slice = Math.max(contentRightFallback / measureCount, 48);
  const spans: MeasurePlaybackSpan[] = [];

  for (let m = 0; m < measureCount; m++) {
    const box = agg.get(m);
    const minX = box?.minX ?? m * slice;
    const maxX = box?.maxX ?? minX + slice * 0.6;
    spans.push({ measureIndex: m, startX: minX, endX: maxX });
  }

  for (let i = 0; i < spans.length - 1; i++) {
    const a = spans[i]!;
    const b = spans[i + 1]!;
    const mid = (a.endX + b.startX) / 2;
    a.endX = mid;
    b.startX = mid;
  }

  if (spans.length > 0) {
    spans[0]!.startX = Math.min(spans[0]!.startX, 24);
    const last = spans[spans.length - 1]!;
    last.endX = Math.max(last.endX, contentRightFallback - 8, last.startX + 40);
  }

  return spans;
}

function measureQuantInSpan(
  span: MeasurePlaybackSpan,
  contentX: number,
  score: EditableScore,
): { measureIndex: number; quant: number } {
  const { startX, endX, measureIndex } = span;
  const width = Math.max(endX - startX, 1);
  const t = Math.min(1, Math.max(0, (contentX - startX) / width));
  const maxQ = riffQuantsForMeasure(score, measureIndex);
  const quant = Math.min(Math.floor(t * maxQ), Math.max(0, maxQ - 1));
  return { measureIndex, quant };
}

export function contentXToMeasureQuant(
  contentX: number,
  spans: MeasurePlaybackSpan[],
  score: EditableScore,
): { measureIndex: number; quant: number } {
  if (spans.length === 0) {
    return { measureIndex: 0, quant: 0 };
  }

  const first = spans[0]!;
  const last = spans[spans.length - 1]!;

  if (contentX <= first.startX) {
    return measureQuantInSpan(first, first.startX, score);
  }
  if (contentX >= last.endX) {
    return measureQuantInSpan(last, last.endX - 1e-3, score);
  }

  let span = first;
  for (const s of spans) {
    if (contentX < s.endX) {
      span = s;
      break;
    }
    span = s;
  }

  return measureQuantInSpan(span, contentX, score);
}

/** Which measure the pointer is in + X snapped to that measure’s left (playback from bar start, quant 0). */
export function contentXToNearestMeasureStart(
  contentX: number,
  spans: MeasurePlaybackSpan[],
  score: EditableScore,
): { measureIndex: number; snapContentX: number } {
  const { measureIndex } = contentXToMeasureQuant(contentX, spans, score);
  const span = spans.find((s) => s.measureIndex === measureIndex);
  const rawX = span?.startX ?? contentX;
  const snapContentX = clampContentX(rawX, spans);
  return { measureIndex, snapContentX };
}

export function clampContentX(
  x: number,
  spans: MeasurePlaybackSpan[],
): number {
  if (spans.length === 0) return Math.max(0, x);
  const lo = spans[0]!.startX;
  const hi = spans[spans.length - 1]!.endX;
  return Math.min(hi, Math.max(lo, x));
}
