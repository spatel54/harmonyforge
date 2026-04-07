"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { COACHMARKS_ENABLED, useCoachmarkStore } from "@/store/useCoachmarkStore";

/**
 * Starts the product tour (CoachmarkOverlay). Hidden while tour is active.
 * Always navigates to `/` so step 1 targets the Playground dropzone.
 */
export function CoachmarkTourButton() {
  const router = useRouter();
  const startTour = useCoachmarkStore((s) => s.startTour);
  const isActive = useCoachmarkStore((s) => s.isActive);

  if (!COACHMARKS_ENABLED || isActive) return null;

  return (
    <button
      type="button"
      onClick={() => {
        startTour();
        router.push("/");
      }}
      className="flex items-center justify-center w-8 h-8 rounded-md border transition-opacity hover:opacity-90"
      style={{
        borderColor: "var(--hf-detail)",
        color: "var(--hf-text-primary)",
        backgroundColor: "transparent",
      }}
      aria-label="Restart onboarding tour"
      title="Tour"
    >
      <HelpCircle className="w-[14px] h-[14px] opacity-80" aria-hidden />
    </button>
  );
}
