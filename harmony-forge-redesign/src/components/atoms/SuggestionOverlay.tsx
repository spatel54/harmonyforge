"use client";

import React from "react";
import { Check, X } from "lucide-react";
import type { ScoreCorrection } from "@/lib/music/suggestionTypes";
import type { NotePosition } from "@/components/score/VexFlowScore";

export interface SuggestionOverlayProps {
  correction: ScoreCorrection;
  position: NotePosition;
  onAccept: () => void;
  onReject: () => void;
}

/** Pitch direction arrow based on suggested vs original pitch. */
function pitchDirection(original: string, suggested: string): "↑" | "↓" | "" {
  const STEP_SEMITONES: Record<string, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  };
  function toMidi(p: string): number {
    const m = p.match(/^([A-G])(#|b)?(\d+)$/);
    if (!m) return 60;
    const step = m[1] ?? "C";
    const oct = parseInt(m[3] ?? "4", 10);
    let s = (STEP_SEMITONES[step] ?? 0) + (oct - 4) * 12;
    if (m[2] === "#") s += 1;
    if (m[2] === "b") s -= 1;
    return 60 + s;
  }
  const diff = toMidi(suggested) - toMidi(original);
  if (diff > 0) return "↑";
  if (diff < 0) return "↓";
  return "";
}

/**
 * SuggestionOverlay — renders on VexFlowScore at a note's position.
 *
 * Shows:
 * 1. A highlight tint on the original note (blue at 20%)
 * 2. A badge pill above/below showing suggestedPitch + direction + accept/reject
 */
export function SuggestionOverlay({
  correction,
  position,
  onAccept,
  onReject,
}: SuggestionOverlayProps) {
  const direction = pitchDirection(
    correction.originalPitch,
    correction.suggestedPitch,
  );
  const isUp = direction === "↑";
  // Position the badge above the note if pitch goes up, below if pitch goes down
  const badgeOffsetY = isUp ? -32 : position.h + 12;

  return (
    <>
      {/* Highlight tint on original note */}
      <div
        className="absolute rounded pointer-events-none"
        style={{
          left: position.x - 4,
          top: position.y - 4,
          width: position.w + 8,
          height: position.h + 8,
          backgroundColor: "var(--semantic-warning-20)",
          border: "1.5px solid var(--semantic-warning)",
        }}
        aria-hidden="true"
      />

      {/* Badge with suggested pitch + accept/reject */}
      <div
        className="absolute flex items-center gap-[3px] rounded-full px-[6px] py-[2px] shadow-sm"
        style={{
          left: position.x - 8,
          top: position.y + badgeOffsetY,
          backgroundColor: "var(--semantic-warning-20)",
          border: "1px solid var(--semantic-warning)",
          zIndex: 20,
        }}
        role="group"
        aria-label={`Suggestion: change ${correction.originalPitch} to ${correction.suggestedPitch} — ${correction.ruleLabel}`}
      >
        {/* Pitch label */}
        <span
          className="font-mono text-[10px] font-semibold select-none whitespace-nowrap"
          style={{ color: "var(--semantic-warning)" }}
        >
          {correction.suggestedPitch}
          {direction && (
            <span className="ml-[2px]">{direction}</span>
          )}
        </span>

        {/* Accept button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAccept();
          }}
          className="flex items-center justify-center w-[16px] h-[16px] rounded-full transition-colors hover:bg-green-100 focus-visible:outline-2 focus-visible:outline-offset-1"
          style={{ color: "#2e7d32" }}
          aria-label={`Accept: change to ${correction.suggestedPitch}`}
        >
          <Check className="w-[10px] h-[10px]" strokeWidth={2.5} />
        </button>

        {/* Reject button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReject();
          }}
          className="flex items-center justify-center w-[16px] h-[16px] rounded-full transition-colors hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-1"
          style={{ color: "var(--semantic-violation)" }}
          aria-label={`Reject suggestion for ${correction.originalPitch}`}
        >
          <X className="w-[10px] h-[10px]" strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
}
