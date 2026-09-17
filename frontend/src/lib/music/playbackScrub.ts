/**
 * Map horizontal pointer position to RiffScore play(startMeasure, startQuant).
 * RiffScore uses 16 quants per quarter note; typical 4/4 = 64 quants per measure.
 */

import type { EditableScore, NotePosition } from "./scoreTypes";
import { noteBeats } from "./scoreUtils";

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

/** Map RiffScore measure + quant back to horizontal content X for the scrub overlay. */
/** Seconds per RiffScore quant (16 quants per quarter) at the live playback BPM. */
export function secondsPerQuantForScore(score: EditableScore, liveBpm?: number): number {
  const bpm =
    liveBpm != null && liveBpm > 0
      ? liveBpm
      : score.bpm != null && score.bpm > 0
        ? score.bpm
        : 120;
  return 60 / bpm / 16;
}

/**
 * Horizontal playhead X during an active note/rest segment, advancing by elapsed time.
 */
export function contentXForPlaybackTick(
  score: EditableScore,
  spans: MeasurePlaybackSpan[],
  measureIndex: number,
  quant: number,
  segmentDurationSec: number,
  elapsedSecSinceTick: number,
  liveBpm?: number,
): number {
  const spq = secondsPerQuantForScore(score, liveBpm);
  let measureNow = Math.max(0, measureIndex);
  let quantNow =
    segmentDurationSec > 0 && spq > 0
      ? quant + Math.max(0, Math.floor(elapsedSecSinceTick / spq))
      : quant;
  while (measureNow < spans.length) {
    const maxQ = riffQuantsForMeasure(score, measureNow);
    if (quantNow < maxQ) break;
    quantNow -= maxQ;
    measureNow += 1;
  }
  if (measureNow >= spans.length) {
    const last = Math.max(0, spans.length - 1);
    return contentXForMeasureQuant(
      last,
      Math.max(0, riffQuantsForMeasure(score, last) - 1),
      spans,
      score,
    );
  }
  return contentXForMeasureQuant(measureNow, Math.max(0, quantNow), spans, score);
}

export function contentXForMeasureQuant(
  measureIndex: number,
  quant: number,
  spans: MeasurePlaybackSpan[],
  score: EditableScore,
): number {
  const span = spans.find((s) => s.measureIndex === measureIndex);
  if (!span) return clampContentX(0, spans);
  const maxQ = riffQuantsForMeasure(score, measureIndex);
  const t = maxQ <= 0 ? 0 : Math.min(1, Math.max(0, quant / maxQ));
  const width = Math.max(span.endX - span.startX, 1);
  return clampContentX(span.startX + t * width, spans);
}

/** Human-readable beat index within a measure (1-based quarter beats for 4/4). */
export function quantToBeatLabel(
  quant: number,
  score: EditableScore,
  measureIndex: number,
): string {
  const maxQ = riffQuantsForMeasure(score, measureIndex);
  const quantsPerQuarter = Math.max(1, Math.floor(maxQ / 4));
  const beat = Math.min(4, Math.floor(quant / quantsPerQuarter) + 1);
  return `Bar ${measureIndex + 1} · beat ${beat}`;
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

export type PlaybackMeasureQuant = { measureIndex: number; quant: number };

/** Total RiffScore quants across every measure (16 per quarter). */
export function totalPlaybackQuants(score: EditableScore): number {
  const n = score.parts[0]?.measures.length ?? 0;
  let total = 0;
  for (let i = 0; i < n; i++) total += riffQuantsForMeasure(score, i);
  return Math.max(1, total);
}

export function measureQuantToAbsQuant(
  score: EditableScore,
  measureIndex: number,
  quant: number,
): number {
  let abs = 0;
  const n = score.parts[0]?.measures.length ?? 0;
  const m = Math.max(0, Math.min(measureIndex, Math.max(0, n - 1)));
  for (let i = 0; i < m; i++) abs += riffQuantsForMeasure(score, i);
  const maxQ = riffQuantsForMeasure(score, m);
  return abs + Math.max(0, Math.min(quant, Math.max(0, maxQ - 1)));
}

export function absQuantToMeasureQuant(
  score: EditableScore,
  absQuant: number,
): PlaybackMeasureQuant {
  const n = score.parts[0]?.measures.length ?? 0;
  if (n <= 0) return { measureIndex: 0, quant: 0 };
  let remaining = Math.max(0, absQuant);
  for (let i = 0; i < n; i++) {
    const maxQ = riffQuantsForMeasure(score, i);
    if (i === n - 1 || remaining < maxQ) {
      return { measureIndex: i, quant: Math.min(Math.floor(remaining), Math.max(0, maxQ - 1)) };
    }
    remaining -= maxQ;
  }
  const last = n - 1;
  return { measureIndex: last, quant: Math.max(0, riffQuantsForMeasure(score, last) - 1) };
}

/** 0–1 position along the whole piece for a measure + quant. */
export function measureQuantToFraction(
  score: EditableScore,
  measureIndex: number,
  quant: number,
): number {
  const total = totalPlaybackQuants(score);
  return Math.min(1, Math.max(0, measureQuantToAbsQuant(score, measureIndex, quant) / total));
}

export function fractionToMeasureQuant(
  score: EditableScore,
  fraction: number,
): PlaybackMeasureQuant {
  const total = totalPlaybackQuants(score);
  return absQuantToMeasureQuant(score, fraction * total);
}

/** Advance a parked/playing tick by elapsed wall time at the live BPM. */
export function advancePlaybackTick(
  score: EditableScore,
  measureIndex: number,
  quant: number,
  segmentDurationSec: number,
  elapsedSecSinceTick: number,
  liveBpm?: number,
): PlaybackMeasureQuant {
  const spq = secondsPerQuantForScore(score, liveBpm);
  const n = score.parts[0]?.measures.length ?? 0;
  let measureNow = Math.max(0, measureIndex);
  let quantNow =
    segmentDurationSec > 0 && spq > 0
      ? quant + Math.max(0, Math.floor(elapsedSecSinceTick / spq))
      : quant;
  while (measureNow < n) {
    const maxQ = riffQuantsForMeasure(score, measureNow);
    if (quantNow < maxQ) break;
    quantNow -= maxQ;
    measureNow += 1;
  }
  if (measureNow >= n) {
    const last = Math.max(0, n - 1);
    return { measureIndex: last, quant: Math.max(0, riffQuantsForMeasure(score, last) - 1) };
  }
  return { measureIndex: measureNow, quant: Math.max(0, quantNow) };
}

/** Start quant of a note inside its measure (16 quants per quarter). */
export function noteStartQuantInMeasure(
  score: EditableScore,
  partId: string,
  measureIndex: number,
  noteIndex: number,
): number {
  const part = score.parts.find((p) => p.id === partId) ?? score.parts[0];
  const measure = part?.measures[measureIndex];
  if (!measure) return 0;
  let beats = 0;
  const last = Math.max(0, Math.min(noteIndex, measure.notes.length));
  for (let i = 0; i < last; i++) beats += noteBeats(measure.notes[i]!);
  const maxQ = riffQuantsForMeasure(score, measureIndex);
  return Math.max(0, Math.min(Math.round(beats * 16), Math.max(0, maxQ - 1)));
}
