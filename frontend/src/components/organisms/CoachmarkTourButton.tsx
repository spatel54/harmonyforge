"use client";

import React from "react";
import { COACHMARKS_ENABLED, useCoachmarkStore } from "@/store/useCoachmarkStore";

/**
 * Starts the persisted product tour (CoachmarkOverlay). Hidden while tour is active.
 */
export function CoachmarkTourButton() {
  if (!COACHMARKS_ENABLED) return null;
  const startTour = useCoachmarkStore((s) => s.startTour);
  const isActive = useCoachmarkStore((s) => s.isActive);

  if (isActive) return null;

  return (
    <button
      type="button"
      onClick={() => startTour()}
      className="font-mono text-[11px] font-medium px-3 py-1.5 rounded-md border transition-opacity hover:opacity-90"
      style={{
        borderColor: "var(--hf-detail)",
        color: "var(--hf-text-primary)",
        backgroundColor: "transparent",
      }}
    >
      Tour
    </button>
  );
}
