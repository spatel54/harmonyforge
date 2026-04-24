"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { COACHMARKS_ENABLED, useCoachmarkStore } from "@/store/useCoachmarkStore";
import { ActionTooltip } from "@/components/atoms/ActionTooltip";

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
    <ActionTooltip content="Start the guided product tour. Navigates to the home screen so step 1 can highlight the upload area.">
      <button
        type="button"
        onClick={() => {
          startTour();
          router.push("/");
        }}
        className="hf-pressable flex items-center justify-center w-8 h-8 rounded-md border shadow-sm hover:shadow-md hover:bg-[color-mix(in_srgb,var(--hf-surface)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--hf-surface)_16%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-bg)]"
        style={{
          borderColor: "var(--hf-detail)",
          color: "var(--hf-text-primary)",
          backgroundColor: "transparent",
        }}
        aria-label="Restart onboarding tour"
      >
        <HelpCircle className="w-[14px] h-[14px] opacity-80" aria-hidden />
      </button>
    </ActionTooltip>
  );
}
