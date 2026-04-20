/**
 * HarmonyForge Logic Core — SATB validation and harmony metrics
 * Per HFLitReview: HER (Harmonic Error Rate), parallel fifths/octaves, voice-leading rules.
 * Taxonomy.md §1.6: range, spacing, parallel fifths/octaves, voice crossing/overlap.
 */

import type { SATBVoices, Voice } from "./types";
import {
  checkRange,
  checkSpacing,
  checkVoiceOrder,
  hasParallelFifth,
  hasParallelOctave,
  hasVoiceOverlap,
} from "./constraints";
import { inRange, pitchToMidi } from "./types";

export interface ValidationViolations {
  parallelFifths: number;
  parallelOctaves: number;
  rangeViolations: number;
  spacingViolations: number;
  voiceOrderViolations: number;
  voiceOverlapViolations: number;
}

export interface ValidationResult {
  violations: ValidationViolations;
  totalSlots: number;
  /** Harmonic Error Rate: fraction of chord slots with at least one violation (0 = perfect) */
  her: number;
  valid: boolean;
}

type TraceVoiceKey = keyof SATBVoices;

export interface SlotFinding {
  rule:
    | "range"
    | "spacing"
    | "voiceOrder"
    | "parallelFifth"
    | "parallelOctave"
    | "voiceOverlap";
  severity: "error" | "warning";
  voices: TraceVoiceKey[];
  message: string;
}

export interface SlotTrace {
  slotIndex: number;
  findings: SlotFinding[];
}

export interface ValidationTraceResult extends ValidationResult {
  trace: SlotTrace[];
}

const VOICE_KEYS: TraceVoiceKey[] = ["soprano", "alto", "tenor", "bass"];
const VOICE_NAMES: Voice[] = ["Soprano", "Alto", "Tenor", "Bass"];
const PAIRS: Array<[TraceVoiceKey, TraceVoiceKey]> = [
  ["soprano", "alto"],
  ["soprano", "tenor"],
  ["soprano", "bass"],
  ["alto", "tenor"],
  ["alto", "bass"],
  ["tenor", "bass"],
];

function direction(from: number, to: number): number {
  if (to > from) return 1;
  if (to < from) return -1;
  return 0;
}

function intervalSemitones(a: number, b: number): number {
  return Math.abs(a - b) % 12;
}

function perfectIntervalPairs(
  prev: SATBVoices,
  curr: SATBVoices,
  targetSemitones: 0 | 7,
): Array<[TraceVoiceKey, TraceVoiceKey]> {
  const matches: Array<[TraceVoiceKey, TraceVoiceKey]> = [];
  for (const [v1, v2] of PAIRS) {
    const p1a = pitchToMidi(prev[v1]);
    const p1b = pitchToMidi(prev[v2]);
    const p2a = pitchToMidi(curr[v1]);
    const p2b = pitchToMidi(curr[v2]);
    const sameDirection = direction(p1a, p2a) === direction(p1b, p2b);
    const moving = direction(p1a, p2a) !== 0;
    if (
      intervalSemitones(p1a, p1b) === targetSemitones &&
      intervalSemitones(p2a, p2b) === targetSemitones &&
      sameDirection &&
      moving
    ) {
      matches.push([v1, v2]);
    }
  }
  return matches;
}

function overlapPairs(
  prev: SATBVoices,
  curr: SATBVoices,
): Array<[TraceVoiceKey, TraceVoiceKey]> {
  const prevMidi = VOICE_KEYS.map((k) => pitchToMidi(prev[k]));
  const currMidi = VOICE_KEYS.map((k) => pitchToMidi(curr[k]));
  const pairs: Array<[TraceVoiceKey, TraceVoiceKey]> = [];
  for (let upper = 0; upper < 4; upper++) {
    for (let lower = upper + 1; lower < 4; lower++) {
      if (currMidi[lower] > prevMidi[upper] || currMidi[upper] < prevMidi[lower]) {
        pairs.push([VOICE_KEYS[upper], VOICE_KEYS[lower]]);
      }
    }
  }
  return pairs;
}

/**
 * Validate a sequence of SATB voices and return violation counts.
 * HER = slotsWithAnyViolation / totalSlots (per HFLitReview: frequency of theoretically invalid notes).
 */
export function validateSATBSequence(slots: SATBVoices[]): ValidationResult {
  const withTrace = validateSATBSequenceWithTrace(slots);
  return {
    violations: withTrace.violations,
    totalSlots: withTrace.totalSlots,
    her: withTrace.her,
    valid: withTrace.valid,
  };
}

export function validateSATBSequenceWithTrace(slots: SATBVoices[]): ValidationTraceResult {
  const violations: ValidationViolations = {
    parallelFifths: 0,
    parallelOctaves: 0,
    rangeViolations: 0,
    spacingViolations: 0,
    voiceOrderViolations: 0,
    voiceOverlapViolations: 0,
  };

  let slotsWithViolations = 0;
  const trace: SlotTrace[] = [];

  for (let i = 0; i < slots.length; i++) {
    const curr = slots[i];
    const prev = i > 0 ? slots[i - 1] : null;
    let slotHasViolation = false;
    const findings: SlotFinding[] = [];

    if (!checkRange(curr)) {
      violations.rangeViolations++;
      slotHasViolation = true;
      for (let v = 0; v < VOICE_KEYS.length; v++) {
        const key = VOICE_KEYS[v];
        const voiceName = VOICE_NAMES[v];
        if (!inRange(voiceName, curr[key])) {
          findings.push({
            rule: "range",
            severity: "error",
            voices: [key],
            message: `${key} out of SATB range`,
          });
        }
      }
    }
    if (!checkSpacing(curr)) {
      violations.spacingViolations++;
      slotHasViolation = true;
      const s = pitchToMidi(curr.soprano);
      const a = pitchToMidi(curr.alto);
      const t = pitchToMidi(curr.tenor);
      const b = pitchToMidi(curr.bass);
      if (s - a > 12) {
        findings.push({
          rule: "spacing",
          severity: "warning",
          voices: ["soprano", "alto"],
          message: "S-A spacing exceeds octave",
        });
      }
      if (a - t > 12) {
        findings.push({
          rule: "spacing",
          severity: "warning",
          voices: ["alto", "tenor"],
          message: "A-T spacing exceeds octave",
        });
      }
      if (t - b > 19) {
        findings.push({
          rule: "spacing",
          severity: "warning",
          voices: ["tenor", "bass"],
          message: "T-B spacing exceeds twelfth",
        });
      }
    }
    if (!checkVoiceOrder(curr)) {
      violations.voiceOrderViolations++;
      slotHasViolation = true;
      findings.push({
        rule: "voiceOrder",
        severity: "error",
        voices: ["soprano", "alto", "tenor", "bass"],
        message: "Voice crossing/order violated",
      });
    }
    if (prev) {
      if (hasParallelFifth(prev, curr)) {
        violations.parallelFifths++;
        slotHasViolation = true;
        for (const [v1, v2] of perfectIntervalPairs(prev, curr, 7)) {
          findings.push({
            rule: "parallelFifth",
            severity: "error",
            voices: [v1, v2],
            message: `Parallel fifth between ${v1} and ${v2}`,
          });
        }
      }
      if (hasParallelOctave(prev, curr)) {
        violations.parallelOctaves++;
        slotHasViolation = true;
        for (const [v1, v2] of perfectIntervalPairs(prev, curr, 0)) {
          findings.push({
            rule: "parallelOctave",
            severity: "error",
            voices: [v1, v2],
            message: `Parallel octave/unison between ${v1} and ${v2}`,
          });
        }
      }
      if (hasVoiceOverlap(prev, curr)) {
        violations.voiceOverlapViolations++;
        slotHasViolation = true;
        for (const [v1, v2] of overlapPairs(prev, curr)) {
          findings.push({
            rule: "voiceOverlap",
            severity: "warning",
            voices: [v1, v2],
            message: `Voice overlap between ${v1} and ${v2}`,
          });
        }
      }
    }
    if (slotHasViolation) slotsWithViolations++;
    trace.push({ slotIndex: i, findings });
  }

  const totalSlots = slots.length;
  const her = totalSlots > 0 ? slotsWithViolations / totalSlots : 0;
  const totalViolations =
    violations.parallelFifths +
    violations.parallelOctaves +
    violations.rangeViolations +
    violations.spacingViolations +
    violations.voiceOrderViolations +
    violations.voiceOverlapViolations;

  return {
    violations,
    totalSlots,
    her,
    valid: totalViolations === 0,
    trace,
  };
}
