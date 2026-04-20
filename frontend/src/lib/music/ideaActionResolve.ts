import type { IdeaAction } from "@/lib/ai/ideaActionSchema";
import type { NoteInsight } from "@/store/useTheoryInspectorStore";
import type { EditableScore, Measure, Part, Note } from "./scoreTypes";
import { getNoteById } from "./scoreUtils";
import {
  soundingNoteAtBeatStart,
  startBeatOfNoteIndex,
} from "./noteExplainContext";

/**
 * Resolves which score note an `<<<IDEA_ACTIONS>>>` row targets.
 *
 * Priority order:
 * 1. Exact `noteId` match (happy path).
 * 2. `staffIndex` hint — if the tutor emitted `STAFF_HINT:` evidence, use that
 *    part at the clicked measure/beat.
 * 3. Unique part-name substring in `summary` at the clicked measure/beat.
 * 4. Nearest sounding note in the clicked measure by beat distance (last-resort
 *    fallback so users at least see *some* note highlight instead of a silent
 *    no-op).
 */
export function resolveIdeaActionNoteId(
  score: EditableScore,
  action: IdeaAction,
  insight: NoteInsight | null,
): string | null {
  if (getNoteById(score, action.noteId)) return action.noteId;
  if (!insight?.noteId) return null;
  const clicked = getNoteById(score, insight.noteId);
  if (!clicked) return null;
  const beat = startBeatOfNoteIndex(clicked.measure, clicked.noteIdx);
  const mIdx = clicked.measureIdx;

  // (2) staff-index hint wins when present.
  if (typeof action.staffIndex === "number") {
    const part = score.parts[action.staffIndex];
    if (part) {
      const resolved = resolveFromPartMeasure(part, mIdx, beat);
      if (resolved) return resolved;
    }
  }

  // (3) summary → unique part-name substring.
  const summaryLower = action.summary.toLowerCase();
  const nameMatches = score.parts
    .map((part, idx) => {
      const name = part.name?.trim();
      if (!name) return null;
      const nl = name.toLowerCase();
      if (!summaryLower.includes(nl)) return null;
      return { part, name, nl, idx };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (nameMatches.length > 0) {
    nameMatches.sort((a, b) => b.name.length - a.name.length);
    const topLen = nameMatches[0]!.name.length;
    const longestOnly = nameMatches.filter((m) => m.name.length === topLen);
    if (longestOnly.length === 1) {
      const resolved = resolveFromPartMeasure(longestOnly[0]!.part, mIdx, beat);
      if (resolved) return resolved;
    }
  }

  // (4) Nearest-in-measure fallback inside the clicked part so an otherwise
  // ambiguous suggestion still lands on a plausible note (user can Reject if wrong).
  const clickedPart = score.parts.find((p) =>
    p.measures.some((m) => m.notes.some((n) => n.id === insight.noteId)),
  );
  if (clickedPart) {
    const fallback = nearestSoundingNoteInMeasure(clickedPart, mIdx, beat);
    if (fallback) return fallback;
  }

  return null;
}

function resolveFromPartMeasure(part: Part, measureIdx: number, beat: number): string | null {
  const meas = part.measures[measureIdx];
  if (!meas) return null;
  const sn = soundingNoteAtBeatStart(meas, beat);
  if (sn.kind === "hit" && !sn.note.isRest) return sn.note.id;
  const fallback = nearestSoundingInMeasure(meas, beat);
  return fallback ?? null;
}

function nearestSoundingNoteInMeasure(
  part: Part,
  measureIdx: number,
  beat: number,
): string | null {
  const meas = part.measures[measureIdx];
  if (!meas) return null;
  return nearestSoundingInMeasure(meas, beat);
}

function nearestSoundingInMeasure(measure: Measure, beat: number): string | null {
  let best: { note: Note; dist: number } | null = null;
  for (let i = 0; i < measure.notes.length; i++) {
    const note = measure.notes[i]!;
    if (note.isRest) continue;
    const start = startBeatOfNoteIndex(measure, i);
    const dist = Math.abs(start - beat);
    if (!best || dist < best.dist) best = { note, dist };
  }
  return best?.note.id ?? null;
}
