"use client";

import React from "react";
import { Check, X, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScoreCorrection, CorrectionStatus } from "@/lib/music/suggestionTypes";

export interface SuggestionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  corrections: ScoreCorrection[];
  correctionStatuses: Record<string, CorrectionStatus>;
  summary?: string;
  /** M5 RQ2: hide explanatory summary; show only neutral copy + pitch rows */
  suppressProseSummary?: boolean;
  timestamp?: string;
  onAcceptCorrection: (correctionId: string) => void;
  onRejectCorrection: (correctionId: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

/**
 * SuggestionCard — in-panel card showing AI-suggested corrections.
 * Structurally similar to ViolationCard but with accept/reject per correction.
 */
export const SuggestionCard = React.forwardRef<
  HTMLDivElement,
  SuggestionCardProps
>(
  (
    {
      corrections,
      correctionStatuses,
      summary,
      suppressProseSummary = false,
      timestamp,
      onAcceptCorrection,
      onRejectCorrection,
      onAcceptAll,
      onRejectAll,
      className,
      ...props
    },
    ref,
  ) => {
    const pendingCount = corrections.filter(
      (c) => correctionStatuses[c.id] === "pending",
    ).length;

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-[6px] w-full rounded-[4px] px-[12px] py-[10px]",
          className,
        )}
        style={{
          backgroundColor: "var(--hf-panel-bg)",
          border: "1px solid var(--semantic-warning)",
        }}
        role="article"
        aria-label="Score correction suggestion"
        {...props}
      >
        {/* Badge */}
        <div
          className="inline-flex items-center gap-[4px] self-start px-[8px] py-[2px] rounded-[2px]"
          style={{ backgroundColor: "var(--semantic-warning)" }}
        >
          <Lightbulb
            className="w-[10px] h-[10px] shrink-0 text-white"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span className="font-mono text-[10px] font-bold text-white leading-none">
            Suggestion
          </span>
        </div>

        {/* Summary — full prose, or neutral line in minimal-explanation sessions */}
        <p
          className="font-body text-[11px] font-normal leading-[1.55]"
          style={{ color: "var(--hf-text-primary)" }}
        >
          {suppressProseSummary
            ? corrections.length === 0
              ? "No pitch changes in this batch."
              : "Suggested pitch changes (no written explanation for this session):"
            : summary || (corrections.length === 0
                ? "No specific corrections could be generated for this score."
                : `${corrections.length} correction${corrections.length > 1 ? "s" : ""} suggested:`)}
        </p>

        {/* Correction list */}
        <div className="flex flex-col gap-[4px]">
          {corrections.map((c) => {
            const status = correctionStatuses[c.id] ?? "pending";
            const isResolved = status !== "pending";
            return (
              <div
                key={c.id}
                className="flex items-center gap-[6px] rounded-[2px] px-[6px] py-[3px]"
                style={{
                  backgroundColor: isResolved
                    ? "transparent"
                    : "var(--semantic-warning-10)",
                  opacity: isResolved ? 0.5 : 1,
                }}
              >
                {/* Pitch change */}
                <span
                  className="font-mono text-[10px] font-medium flex-1 min-w-0"
                  style={{ color: "var(--hf-text-primary)" }}
                >
                  <span style={{ textDecoration: status === "accepted" ? "none" : "line-through", opacity: 0.6 }}>
                    {c.originalPitch}
                  </span>
                  <span className="mx-[4px]">→</span>
                  <span style={{ color: "var(--semantic-warning)", fontWeight: 600 }}>
                    {c.suggestedPitch}
                  </span>
                  <span
                    className="ml-[4px] font-body text-[9px] font-normal"
                    style={{ color: "var(--hf-text-secondary)" }}
                  >
                    {c.ruleLabel}
                  </span>
                </span>

                {/* Per-correction accept/reject */}
                {!isResolved && (
                  <div className="flex items-center gap-[2px] shrink-0">
                    <button
                      type="button"
                      onClick={() => onAcceptCorrection(c.id)}
                      className="hf-pressable flex items-center justify-center w-[18px] h-[18px] rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d32] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
                      style={{ color: "#2e7d32" }}
                      aria-label={`Accept: ${c.originalPitch} → ${c.suggestedPitch}`}
                    >
                      <Check className="w-[10px] h-[10px]" strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectCorrection(c.id)}
                      className="hf-pressable flex items-center justify-center w-[18px] h-[18px] rounded-full hover:bg-red-100 dark:hover:bg-red-900/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-violation)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
                      style={{ color: "var(--semantic-violation)" }}
                      aria-label={`Reject: keep ${c.originalPitch}`}
                    >
                      <X className="w-[10px] h-[10px]" strokeWidth={2.5} />
                    </button>
                  </div>
                )}

                {/* Status indicator */}
                {isResolved && (
                  <span
                    className="font-mono text-[9px] shrink-0"
                    style={{
                      color:
                        status === "accepted"
                          ? "#2e7d32"
                          : "var(--hf-text-secondary)",
                    }}
                  >
                    {status === "accepted" ? "applied" : "skipped"}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Accept All / Reject All */}
        {pendingCount > 0 && (
          <div className="flex items-center justify-end gap-[8px] w-full mt-[2px]">
            <button
              type="button"
              onClick={onRejectAll}
              className="hf-pressable flex items-center px-[8px] py-[3px] rounded-[2px] font-mono text-[10px] font-normal shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--hf-surface) 10%, transparent)",
                color: "var(--hf-surface)",
              }}
            >
              Reject All
            </button>
            <button
              type="button"
              onClick={onAcceptAll}
              className="hf-pressable flex items-center px-[8px] py-[3px] rounded-[2px] font-mono text-[10px] font-normal text-white shadow-sm hover:shadow-md hover:brightness-[1.06] active:brightness-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
              style={{ backgroundColor: "var(--semantic-warning)" }}
            >
              Accept All
            </button>
          </div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <p
            className="font-body text-[9px] font-normal"
            style={{ color: "var(--hf-text-secondary)" }}
            aria-label={`Sent at ${timestamp}`}
          >
            {timestamp}
          </p>
        )}
      </div>
    );
  },
);

SuggestionCard.displayName = "SuggestionCard";
