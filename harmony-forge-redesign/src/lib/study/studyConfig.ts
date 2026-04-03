/**
 * M5 user-study configuration (RQ1: generator vs reviewer arm; RQ2: explanation depth for suggestions).
 * URL params (once per tab) override env defaults and persist in sessionStorage.
 */

export const STUDY_CONDITION_STORAGE_KEY = "hf-study-condition";
export const SUGGESTION_EXPLANATION_STORAGE_KEY = "hf-suggestion-explanation-mode";

export type StudyCondition = "generator_primary" | "reviewer_primary";

export type SuggestionExplanationMode = "full" | "minimal";

const VALID_STUDY: readonly StudyCondition[] = [
  "generator_primary",
  "reviewer_primary",
] as const;

const VALID_EXPLAIN: readonly SuggestionExplanationMode[] = [
  "full",
  "minimal",
] as const;

export function isStudyCondition(v: unknown): v is StudyCondition {
  return typeof v === "string" && (VALID_STUDY as readonly string[]).includes(v);
}

export function isSuggestionExplanationMode(
  v: unknown,
): v is SuggestionExplanationMode {
  return typeof v === "string" && (VALID_EXPLAIN as readonly string[]).includes(v);
}

/** Safe access for browser, tests (stub), and SSR (absent). */
function getSessionStorage(): Storage | null {
  if (typeof globalThis === "undefined") return null;
  try {
    const s = globalThis.sessionStorage;
    if (s && typeof s.getItem === "function") return s;
  } catch {
    // SSR or privacy mode
  }
  return null;
}

/**
 * Parse `study` and `hfExplain` from a query string and persist valid values.
 * Call on client during initial load (e.g. root provider).
 */
export function syncStudySessionFromUrl(search: string): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    const params = new URLSearchParams(
      search.startsWith("?") ? search : `?${search}`,
    );
    const study = params.get("study");
    if (isStudyCondition(study)) {
      storage.setItem(STUDY_CONDITION_STORAGE_KEY, study);
    }
    const hfExplain = params.get("hfExplain");
    if (isSuggestionExplanationMode(hfExplain)) {
      storage.setItem(SUGGESTION_EXPLANATION_STORAGE_KEY, hfExplain);
    }
  } catch {
    // ignore
  }
}

function readStoredStudyCondition(): StudyCondition | null {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STUDY_CONDITION_STORAGE_KEY);
    return isStudyCondition(raw) ? raw : null;
  } catch {
    return null;
  }
}

function readStoredExplanationMode(): SuggestionExplanationMode | null {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(SUGGESTION_EXPLANATION_STORAGE_KEY);
    return isSuggestionExplanationMode(raw) ? raw : null;
  } catch {
    return null;
  }
}

function envStudyCondition(): StudyCondition | null {
  const v = process.env.NEXT_PUBLIC_HF_STUDY_CONDITION;
  return isStudyCondition(v) ? v : null;
}

function envSuggestionExplanationMode(): SuggestionExplanationMode | null {
  const v = process.env.NEXT_PUBLIC_HF_SUGGESTION_EXPLANATION_MODE;
  return isSuggestionExplanationMode(v) ? v : null;
}

/**
 * Active RQ1 arm. Defaults to generator_primary when unset (normal app behavior).
 */
export function getStudyCondition(): StudyCondition {
  const stored = readStoredStudyCondition();
  if (stored) return stored;
  const fromEnv = envStudyCondition();
  const storage = getSessionStorage();
  if (fromEnv && storage) {
    try {
      storage.setItem(STUDY_CONDITION_STORAGE_KEY, fromEnv);
    } catch {
      // ignore
    }
    return fromEnv;
  }
  return "generator_primary";
}

/**
 * RQ2: whether stylist suggestions include prose rationale/summary in the UI/API.
 */
export function getSuggestionExplanationMode(): SuggestionExplanationMode {
  const stored = readStoredExplanationMode();
  if (stored) return stored;
  const fromEnv = envSuggestionExplanationMode();
  const storage = getSessionStorage();
  if (fromEnv && storage) {
    try {
      storage.setItem(SUGGESTION_EXPLANATION_STORAGE_KEY, fromEnv);
    } catch {
      // ignore
    }
    return fromEnv;
  }
  return "full";
}

export function isReviewerPrimaryStudy(): boolean {
  return getStudyCondition() === "reviewer_primary";
}

export function isMinimalSuggestionExplanation(): boolean {
  return getSuggestionExplanationMode() === "minimal";
}

/** True when any study env or stored session indicates a non-default study session. */
export function isStudySessionActive(): boolean {
  if (!getSessionStorage()) {
    return envStudyCondition() != null || envSuggestionExplanationMode() === "minimal";
  }
  return (
    readStoredStudyCondition() != null ||
    envStudyCondition() != null ||
    readStoredExplanationMode() === "minimal" ||
    envSuggestionExplanationMode() === "minimal"
  );
}
