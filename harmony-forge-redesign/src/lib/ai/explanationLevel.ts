export type ExplanationLevel = "beginner" | "intermediate" | "professional";

const LEVELS = ["beginner", "intermediate", "professional"] as const satisfies readonly ExplanationLevel[];

export function isExplanationLevel(v: unknown): v is ExplanationLevel {
  return typeof v === "string" && (LEVELS as readonly string[]).includes(v);
}

/** Audience depth when the client omits or sends an invalid level. */
export const DEFAULT_EXPLANATION_LEVEL: ExplanationLevel = "intermediate";

export function resolveExplanationLevel(v: unknown): ExplanationLevel {
  return isExplanationLevel(v) ? v : DEFAULT_EXPLANATION_LEVEL;
}
