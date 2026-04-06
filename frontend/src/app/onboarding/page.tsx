import type { Metadata } from "next";
import { HomeViewOnboarding } from "@/components/organisms/HomeViewOnboarding";

export const metadata: Metadata = {
  title: "HarmonyForge — Onboarding",
};

/**
 * Standalone onboarding + upload demo. Not linked from main nav; use `/onboarding` directly.
 */
export default function OnboardingPage() {
  return <HomeViewOnboarding />;
}
