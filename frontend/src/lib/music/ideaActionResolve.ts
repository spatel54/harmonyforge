import type { IdeaAction } from "@/lib/ai/ideaActionSchema";
import type { NoteInsight } from "@/store/useTheoryInspectorStore";
import type { EditableScore } from "./scoreTypes";
import { getNoteById } from "./scoreUtils";
import {
  soundingNoteAtBeatStart,
  startBeatOfNoteIndex,
} from "./noteExplainContext";

/**
 * Resolves which score note an <<<IDEA_ACTIONS>>> row targets.
 * Prefer exact noteId match; if the model hallucinated an id, try matching a unique
 * staff named in `summary` at the same measure+beat as the inspector click.
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
  const summaryLower = action.summary.toLowerCase();
  const candidates: string[] = [];
  for (const part of score.parts) {
    const name = part.name?.trim();
    if (!name) continue;
    if (!summaryLower.includes(name.toLowerCase())) continue;
    const meas = part.measures[mIdx];
    if (!meas) continue;
    const sn = soundingNoteAtBeatStart(meas, beat);
    if (sn.kind === "hit" && !sn.note.isRest) candidates.push(sn.note.id);
  }
  if (candidates.length === 1) return candidates[0]!;
  return null;
}
