"use client";

import React from "react";
import { OnboardingModal } from "@/components/organisms/OnboardingModal";
import { COACHMARKS_ENABLED } from "@/store/useCoachmarkStore";

/**
 * Re-opens the 4-slide welcome modal. Hidden when the coachmark tour is enabled (tour replaces this entry point).
 */
export function WelcomeGuideButton() {
  const [open, setOpen] = React.useState(false);

  if (COACHMARKS_ENABLED) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-[11px] font-medium px-3 py-1.5 rounded-md border transition-opacity hover:opacity-90"
        style={{
          borderColor: "var(--hf-detail)",
          color: "var(--hf-text-primary)",
          backgroundColor: "transparent",
        }}
      >
        Welcome
      </button>
      {open && <OnboardingModal onDismiss={() => setOpen(false)} />}
    </>
  );
}
