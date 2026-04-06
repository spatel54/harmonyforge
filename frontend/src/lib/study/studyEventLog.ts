/**
 * Opt-in append-only study event log (client-only). No PII; include only interaction metadata.
 */

import {
  getStudyCondition,
  getSuggestionExplanationMode,
} from "@/lib/study/studyConfig";

const CONSENT_KEY = "hf-study-logging-opt-in";

export type StudyEventName =
  | "generate_harmonies_clicked"
  | "skipped_generation_reviewer_arm"
  | "suggestion_accepted"
  | "suggestion_rejected"
  | "suggestion_accept_all"
  | "suggestion_reject_all"
  | "theory_inspector_note_click"
  | "run_audit"
  | "explain_more"
  | "suggest_fix"
  | "study_logging_opt_in"
  | "study_logging_opt_out";

export interface StudyEvent {
  t: number;
  name: StudyEventName;
  payload?: Record<string, unknown>;
}

const buffer: StudyEvent[] = [];

export function isStudyLoggingOptedIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setStudyLoggingOptIn(optIn: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (optIn) {
      localStorage.setItem(CONSENT_KEY, "1");
      buffer.push({
        t: Date.now(),
        name: "study_logging_opt_in",
        payload: enrichPayload({}),
      });
    } else {
      const was = localStorage.getItem(CONSENT_KEY) === "1";
      if (was) {
        buffer.push({
          t: Date.now(),
          name: "study_logging_opt_out",
          payload: enrichPayload({}),
        });
      }
      localStorage.removeItem(CONSENT_KEY);
    }
  } catch {
    // ignore
  }
}

function enrichPayload(
  payload?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...payload,
    studyCondition: getStudyCondition(),
    suggestionExplanationMode: getSuggestionExplanationMode(),
  };
}

/** Records an event if the user opted in to study logging. */
export function logStudyEvent(
  name: StudyEventName,
  payload?: Record<string, unknown>,
): void {
  if (!isStudyLoggingOptedIn()) return;
  buffer.push({
    t: Date.now(),
    name,
    payload: enrichPayload(payload),
  });
}

export function getStudyEventLog(): readonly StudyEvent[] {
  return buffer;
}

export function exportStudyEventLogJson(): string {
  return JSON.stringify(buffer, null, 2);
}

export function clearStudyEventLog(): void {
  buffer.length = 0;
}
