"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  SANDBOX_HOTKEY_SECTIONS,
  type SandboxHotkeySection,
} from "@/lib/sandbox/sandboxHotkeyHelp";

export interface SandboxHotkeysDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function HotkeySections({ sections }: { sections: SandboxHotkeySection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((section, sectionIndex) => (
        <section
          key={section.title}
          aria-labelledby={`hf-hotkeys-section-${sectionIndex}`}
        >
          <h3
            id={`hf-hotkeys-section-${sectionIndex}`}
            className="font-mono text-[11px] font-semibold uppercase tracking-wide m-0 mb-2"
            style={{ color: "var(--hf-text-secondary)" }}
          >
            {section.title}
          </h3>
          <ul className="m-0 p-0 list-none space-y-2.5">
            {section.rows.map((row, rowIndex) => (
              <li
                key={`${section.title}-${rowIndex}-${row.keys}`}
                className="flex flex-col sm:flex-row sm:gap-4 gap-1"
              >
                <div
                  className="shrink-0 font-mono text-[12px] font-medium sm:w-[min(40%,220px)]"
                  style={{ color: "var(--hf-text-primary)" }}
                >
                  {row.keys.split(" · ").map((part, i, arr) => (
                    <React.Fragment key={`${i}-${part}`}>
                      <span
                        className="inline-block px-1.5 py-0.5 rounded border text-[11px] leading-tight"
                        style={{
                          borderColor: "var(--hf-detail)",
                          backgroundColor: "color-mix(in srgb, var(--hf-surface) 35%, transparent)",
                        }}
                      >
                        {part.trim()}
                      </span>
                      {i < arr.length - 1 ? (
                        <span className="mx-1 opacity-50" aria-hidden>
                          ·
                        </span>
                      ) : null}
                    </React.Fragment>
                  ))}
                </div>
                <p
                  className="m-0 font-body text-[13px] leading-snug flex-1"
                  style={{ color: "var(--hf-text-secondary)" }}
                >
                  {row.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/**
 * Modal listing sandbox keyboard shortcuts (same behavior as the global key handler on the sandbox page).
 */
export function SandboxHotkeysDialog({ isOpen, onClose }: SandboxHotkeysDialogProps) {
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10200] overflow-y-auto hf-print-hide"
      role="presentation"
    >
      <div
        className="fixed inset-0 bg-[#2D1817] opacity-15 dark:opacity-30 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex min-h-full items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sandbox-hotkeys-title"
          className={cn(
            "pointer-events-auto max-w-lg w-full max-h-[min(85vh,560px)] overflow-y-auto rounded-lg border p-6 shadow-xl",
            "bg-[var(--hf-panel-bg)] border-[var(--hf-detail)]",
          )}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2
              id="sandbox-hotkeys-title"
              className="font-brand text-lg m-0"
              style={{ color: "var(--hf-text-primary)" }}
            >
              Keyboard shortcuts
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[11px] shrink-0 px-2 py-1 rounded border border-[var(--hf-detail)] text-[var(--hf-text-primary)] hover:opacity-90"
            >
              Close
            </button>
          </div>
          <p
            className="font-body text-[13px] leading-snug m-0 mb-5"
            style={{ color: "var(--hf-text-secondary)" }}
          >
            Shortcuts apply when focus is not in a text field or other typing control. The embedded
            score editor may provide additional shortcuts while you interact with the staff.
          </p>
          <HotkeySections sections={SANDBOX_HOTKEY_SECTIONS} />
        </div>
      </div>
    </div>
  );
}
