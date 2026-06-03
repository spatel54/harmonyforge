import type { RiffScoreSessionHandles } from "@/context/RiffScoreSessionContext";
import type { DurationType } from "@/lib/music/scoreTypes";
import { rsDurationToHf } from "@/lib/music/riffscoreAdapter";
import { cloneScore, setNoteDurations } from "@/lib/music/scoreUtils";
import { useScoreStore } from "@/store/useScoreStore";

const TOOL_TO_DURATION: Record<string, DurationType> = {
  "duration-whole": "w",
  "duration-half": "h",
  "duration-quarter": "q",
  "duration-eighth": "8",
  "duration-16th": "16",
  "duration-32nd": "32",
};

export function durationTypeFromToolId(toolId: string): DurationType | null {
  return TOOL_TO_DURATION[toolId] ?? null;
}

export function applySetNoteDurations(
  session: RiffScoreSessionHandles | null | undefined,
  duration: DurationType,
  fallbackNoteIds?: ReadonlySet<string> | null,
  options?: { dotted?: boolean; noteIds?: ReadonlySet<string> },
): boolean {
  let ids = new Set<string>();
  if (options?.noteIds && options.noteIds.size > 0) {
    ids = new Set(options.noteIds);
  } else if (fallbackNoteIds && fallbackNoteIds.size > 0) {
    ids = new Set(fallbackNoteIds);
  } else if (session) {
    session.flushToZustand();
    ids = session.getDurationTargetNoteIds();
  }
  if (ids.size === 0) return false;

  const live = useScoreStore.getState().score;
  if (!live) return false;

  let next = setNoteDurations(live, ids, duration);
  if (options?.dotted !== undefined) {
    next = cloneScore(next);
    const wantDot = options.dotted;
    for (const part of next.parts) {
      for (const measure of part.measures) {
        for (const note of measure.notes) {
          if (!ids.has(note.id)) continue;
          if (wantDot) note.dots = 1;
          else delete note.dots;
        }
      }
    }
  }
  useScoreStore.getState().applyScore(next);
  return true;
}

/** Apply duration from a RiffScore `setDuration` operation (after undo). */
export function applySetNoteDurationsFromRs(
  session: RiffScoreSessionHandles | null | undefined,
  rsDuration: string,
  dotted: boolean,
  fallbackNoteIds?: ReadonlySet<string> | null,
): boolean {
  return applySetNoteDurations(session, rsDurationToHf(rsDuration), fallbackNoteIds, {
    dotted,
    noteIds: fallbackNoteIds ?? undefined,
  });
}

export function scheduleSetNoteDurations(
  session: RiffScoreSessionHandles | null | undefined,
  duration: DurationType,
  fallbackNoteIds?: ReadonlySet<string> | null,
): void {
  session?.flushToZustand();
  requestAnimationFrame(() => {
    applySetNoteDurations(session, duration, fallbackNoteIds);
  });
}

export function hasDurationEditableSelection(
  session: RiffScoreSessionHandles | null | undefined,
  fallbackNoteIds?: ReadonlySet<string> | null,
): boolean {
  session?.flushToZustand();
  if (session && session.getDurationTargetNoteIds().size > 0) return true;
  return Boolean(fallbackNoteIds && fallbackNoteIds.size > 0);
}
