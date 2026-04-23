"use client";

import React from "react";

export interface WorkspaceResetModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function WorkspaceResetModal({ open, onCancel, onConfirm }: WorkspaceResetModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[190] flex items-center justify-center px-6 py-10"
      style={{ backgroundColor: "rgba(10, 8, 8, 0.72)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hf-reset-workspace-title"
    >
      <div
        className="max-w-md w-full rounded-xl border p-6 shadow-xl"
        style={{
          backgroundColor: "var(--hf-panel-bg)",
          borderColor: "var(--hf-detail)",
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
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 font-mono text-xs font-medium border transition-opacity hover:opacity-90"
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
            className="rounded-lg px-4 py-2 font-mono text-xs font-semibold transition-opacity hover:opacity-90"
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
