"use client";

import React from "react";
import {
  OPEN_SOURCE_NOTICES,
  PRODUCT_NAME,
} from "@/lib/siteMeta";
import { cn } from "@/lib/utils";
import { HfModal } from "@/components/molecules/HfModal";

export interface OpenSourceCreditsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Lists upstream open-source notices required by embedded dependencies (e.g. RiffScore MIT).
 */
export function OpenSourceCreditsDialog({
  isOpen,
  onClose,
}: OpenSourceCreditsDialogProps) {
  return (
    <HfModal
      isOpen={isOpen}
      onClose={onClose}
      zIndex={10200}
      panelClassName={cn(
        "max-w-lg w-full max-h-[min(80vh,480px)] overflow-y-auto rounded-lg border p-6 shadow-xl",
        "bg-[var(--hf-panel-bg)] border-[var(--hf-detail)]",
      )}
      labelledBy="credits-dialog-title"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <h2
          id="credits-dialog-title"
          className="font-brand text-lg m-0"
          style={{ color: "var(--hf-text-primary)" }}
        >
          Open source credits
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="hf-pressable font-mono text-[11px] shrink-0 px-2 py-1 rounded border border-[var(--hf-detail)] text-[var(--hf-text-primary)] hover:opacity-90"
        >
          Close
        </button>
      </div>
      <p
        className="font-body text-sm leading-relaxed mb-4 m-0"
        style={{ color: "var(--hf-text-secondary)" }}
      >
        {PRODUCT_NAME} bundles open-source components. The notices below reproduce
        copyright lines their licenses require.
      </p>
      <ul className="space-y-4 m-0 p-0 list-none">
        {OPEN_SOURCE_NOTICES.map((n) => (
          <li key={n.name}>
            <div
              className="font-mono text-[12px] font-medium mb-1"
              style={{ color: "var(--hf-text-primary)" }}
            >
              {n.name}
              {n.packageUrl ? (
                <>
                  {" "}
                  <a
                    href={n.packageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--hf-accent)] underline font-normal"
                  >
                    (repository)
                  </a>
                </>
              ) : null}
            </div>
            <p
              className="font-mono text-[10px] leading-relaxed m-0 opacity-90"
              style={{ color: "var(--hf-text-secondary)" }}
            >
              {n.copyrightLine}
              <br />
              Licensed under the {n.license} License.
            </p>
          </li>
        ))}
      </ul>
    </HfModal>
  );
}
