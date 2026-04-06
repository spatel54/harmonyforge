/**
 * Deterministic FACT lines for Theory Inspector measure- and part-level focus (chat + LLM).
 */

import type { DurationType, EditableScore, Note, Part } from "./scoreTypes";

const MAX_NOTES_PER_PART_IN_MEASURE = 20;
const MAX_MEASURES_IN_PART_SUMMARY = 28;
const MAX_NOTES_PER_MEASURE_IN_PART = 12;

function formatDuration(note: Note): string {
  const d = note.duration as DurationType;
  const dot = note.dots && note.dots > 0 ? ".".repeat(note.dots) : "";
  return `${d}${dot}`;
}

function formatNoteToken(note: Note): string {
  if (note.isRest) return `r${formatDuration(note)}`;
  return `${note.pitch} ${formatDuration(note)}`;
}

function collectNoteIdsFromMeasure(measure: Part["measures"][0]): string[] {
  return measure.notes.filter((n) => !n.isRest).map((n) => n.id);
}

/** All non-rest note ids in one measure across every part. */
export function collectNoteIdsInMeasure(score: EditableScore, measureIndex: number): string[] {
  const ids: string[] = [];
  for (const part of score.parts) {
    const m = part.measures[measureIndex];
    if (m) ids.push(...collectNoteIdsFromMeasure(m));
  }
  return ids;
}

/** All non-rest note ids in a part (entire score). */
export function collectNoteIdsInPart(score: EditableScore, partId: string): string[] {
  const part = score.parts.find((p) => p.id === partId);
  if (!part) return [];
  const ids: string[] = [];
  for (const m of part.measures) {
    ids.push(...collectNoteIdsFromMeasure(m));
  }
  return ids;
}

/**
 * FACT lines for a single measure (all parts). Pitches and durations; rests shown as r+q etc.
 */
export function buildMeasureFocusFacts(
  score: EditableScore,
  measureIndex: number,
): { lines: string[]; noteIds: string[] } {
  const lines: string[] = [];
  if (!score.parts.length) {
    lines.push("MEASURE FOCUS: (empty score)");
    return { lines, noteIds: [] };
  }
  if (measureIndex < 0 || measureIndex >= score.parts[0]!.measures.length) {
    lines.push(`MEASURE FOCUS: invalid measure index ${measureIndex + 1}`);
    return { lines, noteIds: [] };
  }

  const ref = score.parts[0]!.measures[measureIndex]!;
  const ts = ref.timeSignature ?? "(unknown meter)";
  const ks =
    ref.keySignature !== undefined
      ? `keySignature fifths=${ref.keySignature}`
      : "keySignature (not set on measure)";

  lines.push(`MEASURE FOCUS: measure ${measureIndex + 1} (user-facing bar number)`);
  lines.push(`FACT: timeSignature ${ts}; ${ks}`);

  const noteIds = collectNoteIdsInMeasure(score, measureIndex);

  for (const part of score.parts) {
    const m = part.measures[measureIndex];
    if (!m) continue;
    const tokens: string[] = [];
    let truncated = false;
    for (let i = 0; i < m.notes.length; i++) {
      if (tokens.length >= MAX_NOTES_PER_PART_IN_MEASURE) {
        truncated = true;
        break;
      }
      tokens.push(formatNoteToken(m.notes[i]!));
    }
    const body = tokens.join(", ");
    const suffix = truncated ? " … (truncated: more events in this staff)" : "";
    lines.push(`Part "${part.name}" m${measureIndex + 1}: ${body || "(empty)"}${suffix}`);
  }

  return { lines, noteIds };
}

/**
 * Condensed part-wide summary for LLM (capped measures and notes per measure).
 */
export function buildPartFocusFacts(
  score: EditableScore,
  partId: string,
): { lines: string[]; noteIds: string[] } {
  const part = score.parts.find((p) => p.id === partId);
  const lines: string[] = [];
  if (!part) {
    lines.push(`PART FOCUS: unknown partId ${partId}`);
    return { lines, noteIds: [] };
  }

  lines.push(`PART FOCUS: "${part.name}" (whole part; no single-note engine origin)`);
  lines.push(`FACT: ${part.measures.length} measure(s) in this part.`);

  const noteIds = collectNoteIdsInPart(score, partId);

  const maxM = Math.min(part.measures.length, MAX_MEASURES_IN_PART_SUMMARY);
  const truncatedMeasures = part.measures.length > MAX_MEASURES_IN_PART_SUMMARY;

  for (let mi = 0; mi < maxM; mi++) {
    const m = part.measures[mi]!;
    const tokens: string[] = [];
    let noteTrunc = false;
    for (let i = 0; i < m.notes.length && tokens.length < MAX_NOTES_PER_MEASURE_IN_PART; i++) {
      tokens.push(formatNoteToken(m.notes[i]!));
    }
    if (m.notes.length > MAX_NOTES_PER_MEASURE_IN_PART) noteTrunc = true;
    const tail = noteTrunc ? " …" : "";
    lines.push(`m${mi + 1}: ${tokens.join(", ") || "(empty)"}${tail}`);
  }

  if (truncatedMeasures) {
    lines.push(
      `FACT: Part summary truncated to first ${MAX_MEASURES_IN_PART_SUMMARY} measures (${part.measures.length} total).`,
    );
  }

  return { lines, noteIds };
}
