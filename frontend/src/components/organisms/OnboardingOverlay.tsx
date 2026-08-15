"use client";

import React from "react";
import { markSandboxFirstVisitDone } from "@/lib/onboarding";
import { HfModal } from "@/components/molecules/HfModal";

export interface OnboardingOverlayProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  primaryCta?: string;
}

/**
 * Lightweight first-run overlay for the sandbox; persists `hf_onboarding_seen`.
 */
export function OnboardingOverlay({
  open,
  onClose,
  title = "Welcome to the sandbox",
  description = "Edit on the staff. Open Theory Inspector from the gold button at the bottom-right (a one-time hint may appear just above it). Notation: F9 · Export: top right.",
  primaryCta = "Got it",
}: OnboardingOverlayProps) {
  const dismiss = () => {
    markSandboxFirstVisitDone();
    onClose();
  };

  return (
    <HfModal
      isOpen={open}
      onClose={dismiss}
      zIndex={200}
      panelClassName="max-w-md w-full rounded-xl border p-6 shadow-xl bg-[var(--hf-panel-bg)] border-[var(--hf-detail)]"
      labelledBy="hf-onboarding-title"
    >
      <h2
        id="hf-onboarding-title"
        className="font-brand text-xl font-normal m-0 mb-3"
        style={{ color: "var(--hf-text-primary)" }}
      >
        {title}
      </h2>
      <p
        className="font-body text-sm leading-relaxed m-0 mb-6"
        style={{ color: "var(--hf-text-secondary)" }}
      >
        {description}
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="hf-pressable w-full rounded-lg py-3 font-mono text-sm font-semibold transition-[transform,opacity] duration-200"
        style={{
          backgroundColor: "var(--hf-accent)",
          color: "#1a0f0c",
        }}
      >
        {primaryCta}
      </button>
    </HfModal>
  );
}
