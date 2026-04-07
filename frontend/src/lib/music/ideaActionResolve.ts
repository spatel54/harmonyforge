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

  /** Part names mentioned in summary; if several match as substrings, prefer the longest name (e.g. Violin II over Violin). */
  const nameMatches = score.parts
    .map((part) => {
      const name = part.name?.trim();
      if (!name) return null;
      const nl = name.toLowerCase();
      if (!summaryLower.includes(nl)) return null;
      return { part, name, nl };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (nameMatches.length === 0) return null;
  nameMatches.sort((a, b) => b.name.length - a.name.length);
  const topLen = nameMatches[0]!.name.length;
  const longestOnly = nameMatches.filter((m) => m.name.length === topLen);
  if (longestOnly.length !== 1) return null;

  const { part: targetPart } = longestOnly[0]!;
  const meas = targetPart.measures[mIdx];
  if (!meas) return null;
  const sn = soundingNoteAtBeatStart(meas, beat);
  if (sn.kind === "hit" && !sn.note.isRest) return sn.note.id;
  return null;
}
