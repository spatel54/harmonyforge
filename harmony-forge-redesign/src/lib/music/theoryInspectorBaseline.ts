/**
 * One-time snapshot of harmony pitches (and optional SATB trace) when generated
 * MusicXML is first loaded into the sandbox. Used to separate “engine origin”
 * from user-edited pitch in the Theory Inspector.
 *
 * Provenance is keyed by note id; inserts/splits that drop ids fall back to guide-only.
 */

import type { EditableScore } from "./scoreTypes";
import type { VoiceKey } from "./theoryRules";
import {
  scoreToAuditedSlots,
  type AuditedSlot,
  type VoiceMap,
} from "./theoryInspectorSlots";

export interface TraceFinding {
  rule:
    | "range"
    | "spacing"
    | "voiceOrder"
    | "parallelFifth"
    | "parallelOctave"
    | "voiceOverlap";
  severity: "error" | "warning";
  voices: VoiceKey[];
  message: string;
}

export interface SlotTraceEntry {
  slotIndex: number;
  findings: TraceFinding[];
}

/**
 * Stamp each harmony note with `originalGeneratedPitch` from the baseline map (immutable).
 * Melody part (index 0) is unchanged.
 */
export function applyOriginalGeneratedPitches(
  score: EditableScore,
  harmonyNotePitches: Record<string, string>,
): EditableScore {
  if (score.parts.length <= 1) return score;
  const parts = score.parts.map((part, pi) => {
    if (pi === 0) return part;
    return {
      ...part,
      measures: part.measures.map((m) => ({
        ...m,
        notes: m.notes.map((n) => {
          if (n.isRest || !n.pitch) return n;
          const orig = harmonyNotePitches[n.id];
          if (orig === undefined) return n;
          return { ...n, originalGeneratedPitch: orig };
        }),
      })),
    };
  });
  return { ...score, parts };
}

/** Map harmony part note ids → pitch as emitted at generation load (non-rest only). */
export function collectHarmonyBaselinePitches(score: EditableScore): Record<string, string> {
  const out: Record<string, string> = {};
  if (score.parts.length <= 1) return out;
  for (const part of score.parts.slice(1)) {
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        if (!note.isRest && note.pitch) {
          out[note.id] = note.pitch;
        }
      }
    }
  }
  return out;
}

export async function fetchBaselineSatbTrace(
  engineUrl: string,
  apiSlots: Array<{ voices: Record<VoiceKey, string> }>,
): Promise<SlotTraceEntry[] | null> {
  try {
    const res = await fetch(`${engineUrl}/api/validate-satb-trace`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: apiSlots }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { trace?: SlotTraceEntry[] };
    return data.trace ?? null;
  } catch {
    return null;
  }
}

export interface GenerationBaselinePayload {
  harmonyNotePitches: Record<string, string>;
  satbTrace: SlotTraceEntry[] | null;
  /** Copy of audited slots at capture time (same geometry as live score). */
  baselineAuditedSlots: AuditedSlot[] | null;
}

/**
 * Capture harmony pitch map and, when the score is 4-part SATB-shaped, prefetch validate-satb-trace once.
 */
export async function captureGenerationBaseline(
  score: EditableScore,
  engineUrl: string,
): Promise<GenerationBaselinePayload> {
  const harmonyNotePitches = collectHarmonyBaselinePitches(score);
  const slotData = scoreToAuditedSlots(score);
  let satbTrace: SlotTraceEntry[] | null = null;
  if (slotData) {
    satbTrace = await fetchBaselineSatbTrace(engineUrl, slotData.apiSlots);
  }
  return {
    harmonyNotePitches,
    satbTrace,
    baselineAuditedSlots: slotData?.auditedSlots ?? null,
  };
}

/**
 * Rebuild slot voice pitches as they were at generation (per-voice baseline by note id).
 */
export function voicesAtGenerationForSlot(
  slot: AuditedSlot,
  baseline: Record<string, string>,
): VoiceMap {
  const keys: VoiceKey[] = ["soprano", "alto", "tenor", "bass"];
  const out = { ...slot.voices };
  for (const v of keys) {
    const nid = slot.noteIds[v];
    if (nid && baseline[nid]) {
      out[v] = baseline[nid]!;
    }
  }
  return out;
}
