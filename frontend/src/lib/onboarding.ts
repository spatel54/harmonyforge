const ONBOARDING_KEY = "harmonyforge-onboarding-v1-complete";

/** First-run sandbox overlay (distinct from coachmark tour). */
export const HF_ONBOARDING_SEEN_KEY = "hf_onboarding_seen";

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function completeOnboarding(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDING_KEY, "1");
}

export function resetOnboarding(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ONBOARDING_KEY);
}

export function isSandboxFirstVisitDone(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(HF_ONBOARDING_SEEN_KEY) === "1";
}

export function markSandboxFirstVisitDone(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HF_ONBOARDING_SEEN_KEY, "1");
}
