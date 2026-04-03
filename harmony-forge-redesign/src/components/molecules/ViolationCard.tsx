import React from "react";
import { TriangleAlert, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ViolationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  violationType?: string;
  body?: string;
  timestamp?: string;
  onExplainMore?: () => void;
  onSuggestFix?: () => void;
  onRegenerate?: () => void;
  /** When true, LLM-backed actions are disabled. */
  disableLlmActions?: boolean;
}

/**
 * ViolationCard Molecule
 * Pencil Node: pXuBp ("vCard") inside TheoryInspectorPanel ChatArea.
 *
 * Spec:
 *   layout:vertical  gap:6  pad:[10,12]
 *   fill:$neutral-50  stroke:$semantic-violation @1  r:4
 *
 *   badgeRow: gap:4 pad:[2,8] ai:center  fill:$semantic-violation  r:2
 *     icon:  triangle-alert  10×10  fill:#ffffff
 *     text:  IBM Plex Mono fs:10 fw:700  fill:#ffffff
 *
 *   bodyTxt: Inter fs:11  fill:$text-on-light
 *
 *   actRow:  gap:8  jc:end  ai:center
 *     regenIco: refresh-cw 10×10
 *     explainBtn: pad:[3,8] r:2  fill:$sonata-surface/10  text:$sonata-surface
 *     applyBtn:  pad:[3,8] r:2  fill:$sonata-surface     text:white
 *
 *   vCardTs: Inter fs:9  fill:#7A6050
 */
export const ViolationCard = React.forwardRef<
  HTMLDivElement,
  ViolationCardProps
>(
  (
    {
      violationType = "Parallel 5th",
      body = "Per Schenkerian analysis (Schenker, Free Composition §100), parallel fifths between Soprano and Alto at beats 2–3 violate strict voice-leading. The outer-voice framework demands contrary motion at cadential points.",
      timestamp,
      onExplainMore,
      onSuggestFix,
      onRegenerate,
      disableLlmActions = false,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-[6px] w-full rounded-[4px] px-[12px] py-[10px] overflow-hidden",
          className,
        )}
        style={{
          backgroundColor: "var(--hf-panel-bg)",
          border: "1px solid var(--semantic-violation)",
        }}
        role="article"
        aria-label={`Violation: ${violationType}`}
        {...props}
      >
        {/* Badge row — Node LwmCm: gap:4 pad:[2,8] r:2 fill:$semantic-violation */}
        <div
          className="inline-flex items-center gap-[4px] self-start px-[8px] py-[2px] rounded-[2px]"
          style={{ backgroundColor: "var(--semantic-violation)" }}
        >
          <TriangleAlert
            className="w-[10px] h-[10px] shrink-0 text-white"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span className="font-mono text-[10px] font-bold text-white leading-none">
            {violationType}
          </span>
        </div>

        {/* Body text — Node a3JWw: Inter fs:11 */}
        <p
          className="font-body text-[11px] font-normal leading-[1.55]"
          style={{ color: "var(--hf-text-primary)" }}
        >
          {body}
        </p>

        {/* Action row — Node 6DZqH: gap:8 jc:end ai:center */}
        <div className="flex items-center justify-end gap-[8px] w-full">
          {/* Regenerate icon — 10×10 */}
          <button
            type="button"
            onClick={onRegenerate}
            disabled={disableLlmActions}
            aria-label="Regenerate explanation"
            className="flex items-center justify-center w-[20px] h-[20px] rounded-[2px] transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hf-accent) disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
            style={{ color: "var(--hf-text-primary)" }}
          >
            <RefreshCw
              className="w-[10px] h-[10px]"
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>

          {/* Explain more — Node hpZx8: pad:[3,8] r:2 fill:$sonata-surface/10 */}
          <button
            type="button"
            onClick={onExplainMore}
            disabled={disableLlmActions}
            className="flex items-center px-[8px] py-[3px] rounded-[2px] font-mono text-[10px] font-normal transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hf-accent) disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--hf-surface) 10%, transparent)",
              color: "var(--hf-surface)",
            }}
          >
            Explain more
          </button>

          {/* Suggest Fix — Node JQjoF: pad:[3,8] r:2 fill:$sonata-surface */}
          <button
            type="button"
            onClick={onSuggestFix}
            disabled={disableLlmActions}
            className="flex items-center px-[8px] py-[3px] rounded-[2px] font-mono text-[10px] font-normal text-white transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hf-accent) disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
            style={{ backgroundColor: "var(--hf-surface)" }}
          >
            Suggest Fix
          </button>
        </div>

        {/* Timestamp — Node hsDOw: Inter fs:9 fill:#7A6050 */}
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

ViolationCard.displayName = "ViolationCard";
