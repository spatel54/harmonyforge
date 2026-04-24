"use client";

import React from "react";

export interface WorkspaceResetModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function WorkspaceResetModal({ open, onCancel, onConfirm }: WorkspaceResetModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="hf-backdrop-animate hf-overlay-backdrop fixed inset-0 z-[190] flex items-center justify-center px-6 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hf-reset-workspace-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="hf-modal-animate max-w-md w-full rounded-xl border p-6 shadow-[0_20px_50px_rgba(45,24,23,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
        style={{
          backgroundColor: "var(--hf-panel-bg)",
          borderColor: "color-mix(in srgb, var(--hf-detail) 72%, transparent)",
        }}
      >
        <h2
          id="hf-reset-workspace-title"
          className="font-brand text-xl font-normal m-0 mb-3"
          style={{ color: "var(--hf-text-primary)" }}
        >
          Reset workspace?
        </h2>
        <p
          className="font-body text-sm leading-relaxed m-0 mb-6"
          style={{ color: "var(--hf-text-secondary)" }}
        >
          This reloads the score from your last generated harmony output. Edits since then will be
          discarded.
        </p>
        <div className="flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="hf-pressable rounded-lg px-4 py-2 font-mono text-xs font-medium border shadow-sm hover:bg-[color-mix(in_srgb,var(--hf-surface)_8%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
            style={{
              borderColor: "var(--hf-detail)",
              color: "var(--hf-text-primary)",
              backgroundColor: "transparent",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="hf-pressable rounded-lg px-4 py-2 font-mono text-xs font-semibold shadow-md hover:brightness-[1.05] active:brightness-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-surface)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
            style={{
              backgroundColor: "var(--hf-accent)",
              color: "#1a0f0c",
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
