export type ExplanationLevel = "beginner" | "intermediate" | "professional";

export const EXPLANATION_LEVELS: readonly ExplanationLevel[] = [
  "beginner",
  "intermediate",
  "professional",
] as const;

export function isExplanationLevel(v: unknown): v is ExplanationLevel {
  return (
    typeof v === "string" &&
    (EXPLANATION_LEVELS as readonly string[]).includes(v)
  );
}

export const EXPLANATION_LEVEL_STORAGE_KEY =
  "hf-theory-inspector-explanation-level";

export function readStoredExplanationLevel(): ExplanationLevel | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EXPLANATION_LEVEL_STORAGE_KEY);
    return isExplanationLevel(raw) ? raw : null;
  } catch {
    return null;
  }
}
