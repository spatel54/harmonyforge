"use client";

import React from "react";

export interface OnboardingCoachmarkProps {
  title: string;
  description: string;
  stepLabel: string;
  primaryCta: string;
  onPrimary: () => void;
  secondaryCta?: string;
  onSecondary?: () => void;
}

export function OnboardingCoachmark({
  title,
  description,
  stepLabel,
  primaryCta,
  onPrimary,
  secondaryCta = "Skip tour",
  onSecondary,
}: OnboardingCoachmarkProps) {
  return (
    <div className="fixed inset-0 z-[10050]">
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50"
        aria-hidden
      />
      <div
        className="absolute top-4 right-4 w-[360px] max-w-[calc(100vw-2rem)] rounded-lg p-4 border shadow-2xl"
        style={{
          backgroundColor: "var(--hf-panel-bg)",
          borderColor: "var(--hf-detail)",
        }}
        role="dialog"
        aria-label="Onboarding guide"
      >
        <div className="text-[11px] font-mono mb-2" style={{ color: "var(--hf-text-secondary)" }}>
          {stepLabel}
        </div>
        <h2 className="text-[16px] font-semibold mb-2" style={{ color: "var(--hf-text-primary)" }}>
          {title}
        </h2>
        <p className="text-[13px] leading-5 mb-4" style={{ color: "var(--hf-text-primary)" }}>
          {description}
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded text-[12px] border"
            style={{
              borderColor: "var(--hf-detail)",
              color: "var(--hf-text-primary)",
            }}
            onClick={onSecondary}
          >
            {secondaryCta}
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded text-[12px] font-semibold"
            style={{
              backgroundColor: "var(--hf-surface)",
              color: "var(--neutral-50)",
            }}
            onClick={onPrimary}
          >
            {primaryCta}
          </button>
        </div>
      </div>
    </div>
  );
}
