/**
 * SATB slot alignment for Theory Inspector (audit, trace, note explain).
 * Shared between useTheoryInspector and generation baseline capture.
 */

import type { EditableScore } from "./scoreTypes";
import type { VoiceKey } from "./theoryRules";

export type VoiceMap = Record<VoiceKey, string>;
export type VoiceNoteMap = Record<VoiceKey, string | null>;

export interface AuditedSlot {
  voices: VoiceMap;
  noteIds: VoiceNoteMap;
}

/** Maps SATB roles to score part indices and display names (first matching part name wins per role). */
export function resolveSatbPartIndices(score: EditableScore): {
  si: number;
  ai: number;
  ti: number;
  bi: number;
  names: Record<VoiceKey, string>;
} | null {
  if (score.parts.length < 4) return null;

  const nameMap: Partial<Record<VoiceKey, number>> = {};
  score.parts.forEach((part, i) => {
    const lower = part.name.toLowerCase();
    if (lower.includes("soprano") || lower === "s") nameMap.soprano = i;
    else if (lower.includes("alto") || lower === "a") nameMap.alto = i;
    else if (lower.includes("tenor") || lower === "t") nameMap.tenor = i;
    else if (lower.includes("bass") || lower === "b") nameMap.bass = i;
  });

  const si = nameMap.soprano ?? 0;
  const ai = nameMap.alto ?? 1;
  const ti = nameMap.tenor ?? 2;
  const bi = nameMap.bass ?? 3;

  const sPart = score.parts[si];
  const aPart = score.parts[ai];
  const tPart = score.parts[ti];
  const bPart = score.parts[bi];

  if (!sPart || !aPart || !tPart || !bPart) return null;

  return {
    si,
    ai,
    ti,
    bi,
    names: {
      soprano: sPart.name,
      alto: aPart.name,
      tenor: tPart.name,
      bass: bPart.name,
    },
  };
}

export interface ScoreToAuditedSlotsOptions {
  /** When true, only build slots if the score has exactly four parts (note explain: avoid hiding staves 5+). */
  requireExactlyFourParts?: boolean;
}

/**
 * Convert an EditableScore with SATB parts into API slots and local slots with note IDs.
 */
export function scoreToAuditedSlots(
  score: EditableScore,
  opts?: ScoreToAuditedSlotsOptions,
): { apiSlots: Array<{ voices: VoiceMap }>; auditedSlots: AuditedSlot[] } | null {
  if (opts?.requireExactlyFourParts && score.parts.length !== 4) return null;
  if (score.parts.length < 4) return null;

  const resolved = resolveSatbPartIndices(score);
  if (!resolved) return null;

  const { si, ai, ti, bi } = resolved;
  const sPart = score.parts[si]!;
  const aPart = score.parts[ai]!;
  const tPart = score.parts[ti]!;
  const bPart = score.parts[bi]!;

  const measureCount = Math.min(
    sPart.measures.length,
    aPart.measures.length,
    tPart.measures.length,
    bPart.measures.length,
  );

  const apiSlots: Array<{ voices: VoiceMap }> = [];
  const auditedSlots: AuditedSlot[] = [];

  for (let m = 0; m < measureCount; m++) {
    const sNotes = sPart.measures[m]?.notes ?? [];
    const aNotes = aPart.measures[m]?.notes ?? [];
    const tNotes = tPart.measures[m]?.notes ?? [];
    const bNotes = bPart.measures[m]?.notes ?? [];

    const noteCount = Math.max(
      sNotes.length,
      aNotes.length,
      tNotes.length,
      bNotes.length,
    );

    for (let n = 0; n < noteCount; n++) {
      const sRef = sNotes[n] ?? sNotes[sNotes.length - 1];
      const aRef = aNotes[n] ?? aNotes[aNotes.length - 1];
      const tRef = tNotes[n] ?? tNotes[tNotes.length - 1];
      const bRef = bNotes[n] ?? bNotes[bNotes.length - 1];

      const soprano = sRef?.pitch;
      const alto = aRef?.pitch;
      const tenor = tRef?.pitch;
      const bass = bRef?.pitch;

      if (soprano && alto && tenor && bass) {
        const voices: VoiceMap = { soprano, alto, tenor, bass };
        const noteIds: VoiceNoteMap = {
          soprano: sRef?.id ?? null,
          alto: aRef?.id ?? null,
          tenor: tRef?.id ?? null,
          bass: bRef?.id ?? null,
        };
        apiSlots.push({ voices });
        auditedSlots.push({ voices, noteIds });
      }
    }
  }

  return apiSlots.length > 0 ? { apiSlots, auditedSlots } : null;
}
