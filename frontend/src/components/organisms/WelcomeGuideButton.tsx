"use client";

import React from "react";
import { OnboardingModal } from "@/components/organisms/OnboardingModal";
import { COACHMARKS_ENABLED } from "@/store/useCoachmarkStore";
import { ActionTooltip } from "@/components/atoms/ActionTooltip";

/**
 * Re-opens the 4-slide welcome modal. Hidden when the coachmark tour is enabled (tour replaces this entry point).
 */
export function WelcomeGuideButton() {
  const [open, setOpen] = React.useState(false);

  if (COACHMARKS_ENABLED) return null;

  return (
    <>
      <ActionTooltip content="Open the welcome guide: four short slides on import, harmony setup, editing, and export.">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hf-pressable font-mono text-[11px] font-medium px-3 py-1.5 rounded-md border shadow-sm hover:shadow-md hover:bg-[color-mix(in_srgb,var(--hf-surface)_8%,transparent)] active:bg-[color-mix(in_srgb,var(--hf-surface)_14%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-bg)]"
          style={{
            borderColor: "var(--hf-detail)",
            color: "var(--hf-text-primary)",
            backgroundColor: "transparent",
          }}
          aria-label="Welcome guide"
        >
          Welcome
        </button>
      </ActionTooltip>
      {open && <OnboardingModal onDismiss={() => setOpen(false)} />}
    </>
  );
}
