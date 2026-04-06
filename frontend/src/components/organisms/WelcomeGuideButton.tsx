"use client";

import React from "react";
import { OnboardingModal } from "@/components/organisms/OnboardingModal";

/**
 * Re-opens the 4-slide welcome modal from the header (any step of the app).
 */
export function WelcomeGuideButton() {
  const [open, setOpen] = React.useState(false);

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
