"use client";

import React from "react";

export interface TheoryInspectorFabHintProps {
  onDismiss: () => void;
}

/**
 * One-time callout above the Theory Inspector FAB — not a full-screen coachmark.
 */
export function TheoryInspectorFabHint({ onDismiss }: TheoryInspectorFabHintProps) {
  return (
    <div className="hf-print-hide relative w-[min(19rem,calc(100vw-3rem))] mb-3">
      <div
        className="relative rounded-xl border px-4 py-3 shadow-xl"
        style={{
          backgroundColor: "var(--hf-panel-bg)",
          borderColor: "var(--hf-detail)",
          boxShadow: "0 12px 40px color-mix(in srgb, var(--hf-surface) 25%, transparent)",
        }}
        role="dialog"
        aria-labelledby="hf-inspector-fab-hint-title"
        aria-describedby="hf-inspector-fab-hint-desc"
      >
        <p
          id="hf-inspector-fab-hint-title"
          className="font-brand text-[15px] font-normal m-0 mb-1.5"
          style={{ color: "var(--hf-text-primary)" }}
        >
          Theory Inspector lives here
        </p>
        <p
          id="hf-inspector-fab-hint-desc"
          className="font-body text-[13px] leading-snug m-0 mb-3"
          style={{ color: "var(--hf-text-secondary)" }}
        >
          Open the gold button below to explain notes, audit harmony, and chat with the tutor. You won’t see this
          again after you dismiss it or open the panel once.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="w-full rounded-lg py-2.5 font-mono text-[12px] font-semibold transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "var(--hf-accent)",
            color: "#1a0f0c",
          }}
        >
          Got it
        </button>

        {/* Caret toward FAB */}
        <div
          className="absolute -bottom-[7px] right-[28px] w-3 h-3 rotate-45 border-r border-b rounded-[1px]"
          style={{
            backgroundColor: "var(--hf-panel-bg)",
            borderColor: "var(--hf-detail)",
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
