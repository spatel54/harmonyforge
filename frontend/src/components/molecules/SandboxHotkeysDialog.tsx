"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { HfModal } from "@/components/molecules/HfModal";
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
  return (
    <HfModal
      isOpen={isOpen}
      onClose={onClose}
      zIndex={10200}
      panelClassName={cn(
        "hf-scroll-smooth max-w-lg w-full max-h-[min(85vh,560px)] overflow-y-auto rounded-xl border p-6 shadow-[0_16px_48px_rgba(45,24,23,0.14)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.35)]",
        "bg-[var(--hf-panel-bg)] border-[color-mix(in_srgb,var(--hf-detail)_70%,transparent)]",
      )}
      labelledBy="sandbox-hotkeys-title"
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
          className="hf-pressable font-mono text-[11px] shrink-0 px-2.5 py-1.5 rounded-lg border border-[var(--hf-detail)] text-[var(--hf-text-primary)] shadow-sm hover:bg-[color-mix(in_srgb,var(--hf-surface)_8%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
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
    </HfModal>
  );
}
