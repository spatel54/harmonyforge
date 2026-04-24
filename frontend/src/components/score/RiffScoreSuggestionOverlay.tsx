"use client";

import { useState, type CSSProperties } from "react";
import { Check, X } from "lucide-react";
import type { ScoreCorrection } from "@/lib/music/suggestionTypes";
import {
  DEFAULT_NOTE_HIGHLIGHT_PAD,
  tightNoteHighlightRect,
} from "@/lib/music/noteHighlightRect";
import type { NotePosition } from "@/lib/music/scoreTypes";

interface RiffScoreSuggestionOverlayProps {
  corrections: ScoreCorrection[];
  notePositions: NotePosition[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  onAccept?: (correctionId: string) => void;
  onReject?: (correctionId: string) => void;
  /** Clip so ghost notes / tints do not draw over the RiffScore toolbar. */
  overlayClipStyle?: CSSProperties;
}

/**
 * Renders inline ghost noteheads at suggested pitch positions with
 * accept/reject popover on hover. Replaces the badge-pill style
 * SuggestionOverlay with a Grammarly-style inline experience.
 */
export function RiffScoreSuggestionOverlay({
  corrections,
  notePositions,
  onAccept,
  onReject,
  overlayClipStyle,
}: RiffScoreSuggestionOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1]" style={overlayClipStyle}>
      <div className="relative w-full h-full">
        {corrections.map((correction) => {
          const pos = notePositions.find(
            (p) => p.selection.noteId === correction.noteId,
          );
          if (!pos) return null;

          return (
            <GhostNoteCorrection
              key={correction.id}
              correction={correction}
              position={pos}
              onAccept={() => onAccept?.(correction.id)}
              onReject={() => onReject?.(correction.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ghost note pitch positioning
// ---------------------------------------------------------------------------

const STEP_SEMITONES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

/** Convert pitch string to MIDI number for interval calculation. */
function pitchToMidi(pitch: string): number {
  const m = pitch.match(/^([A-G])(#|b)?(\d+)$/);
  if (!m) return 60;
  const step = m[1] ?? "C";
  const oct = parseInt(m[3] ?? "4", 10);
  let s = (STEP_SEMITONES[step] ?? 0) + (oct - 4) * 12;
  if (m[2] === "#") s += 1;
  if (m[2] === "b") s -= 1;
  return 60 + s;
}

/** Convert pitch string to staff position (number of half-steps from middle C). */
function pitchToStaffSteps(pitch: string): number {
  const STEP_ORDER: Record<string, number> = {
    C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6,
  };
  const m = pitch.match(/^([A-G])(#|b)?(\d+)$/);
  if (!m) return 0;
  const step = STEP_ORDER[m[1]] ?? 0;
  const octave = parseInt(m[3] ?? "4", 10);
  return step + octave * 7;
}

/**
 * Calculate the Y offset for the ghost notehead relative to the original note.
 * Each staff space (half-step on the staff) is approximately 4px at default scale.
 */
function calculateGhostYOffset(originalPitch: string, suggestedPitch: string): number {
  const origSteps = pitchToStaffSteps(originalPitch);
  const sugSteps = pitchToStaffSteps(suggestedPitch);
  const stepDiff = sugSteps - origSteps;
  // Staff lines go up as pitch goes up, but screen Y goes down
  // Each staff position (line or space) is ~4px
  return -stepDiff * 4;
}

// ---------------------------------------------------------------------------
// Individual ghost note component
// ---------------------------------------------------------------------------

interface GhostNoteCorrectionProps {
  correction: ScoreCorrection;
  position: NotePosition;
  onAccept: () => void;
  onReject: () => void;
}

function GhostNoteCorrection({
  correction,
  position,
  onAccept,
  onReject,
}: GhostNoteCorrectionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const showPopover = isHovered || isFocused;

  const yOffset = calculateGhostYOffset(
    correction.originalPitch,
    correction.suggestedPitch,
  );

  const ghostX = position.x;
  const ghostY = position.y + yOffset;
  const direction = pitchToMidi(correction.suggestedPitch) > pitchToMidi(correction.originalPitch) ? "up" : "down";
  const originalTint = tightNoteHighlightRect(
    position,
    DEFAULT_NOTE_HIGHLIGHT_PAD,
    DEFAULT_NOTE_HIGHLIGHT_PAD,
  );

  return (
    <>
      {/* Faint connecting line from original to ghost */}
      <svg
        className="absolute pointer-events-none"
        style={{
          left: position.x + position.w / 2 - 1,
          top: Math.min(position.y + position.h / 2, ghostY + 6),
          width: 2,
          height: Math.abs(yOffset) || 1,
        }}
        aria-hidden="true"
      >
        <line
          x1="1"
          y1="0"
          x2="1"
          y2={Math.abs(yOffset) || 1}
          stroke="var(--semantic-warning)"
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.5"
        />
      </svg>

      {/* Ghost notehead — semi-transparent ellipse */}
      <button
        type="button"
        className="absolute pointer-events-auto cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded-full"
        style={{
          left: ghostX - 2,
          top: ghostY - 2,
          width: Math.max(position.w, 14) + 4,
          height: Math.max(position.h, 10) + 4,
          background: "transparent",
          border: "none",
          padding: 0,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label={`Suggestion: change ${correction.originalPitch} to ${correction.suggestedPitch} — ${correction.ruleLabel}`}
      >
        <svg
          width={Math.max(position.w, 14) + 4}
          height={Math.max(position.h, 10) + 4}
          viewBox={`0 0 ${Math.max(position.w, 14) + 4} ${Math.max(position.h, 10) + 4}`}
        >
          <ellipse
            cx={(Math.max(position.w, 14) + 4) / 2}
            cy={(Math.max(position.h, 10) + 4) / 2}
            rx={Math.max(position.w, 14) / 2}
            ry={Math.max(position.h, 10) / 2}
            fill="var(--semantic-warning)"
            opacity="0.4"
          />
        </svg>
      </button>

      {/* Always-visible pitch label (scientific notation) */}
      <div
        className="absolute pointer-events-none font-mono text-[9px] font-semibold z-[5] whitespace-nowrap leading-none"
        style={{
          left: ghostX + Math.max(position.w, 14) + 6,
          top: ghostY + Math.max(position.h, 10) / 2 - 5,
          color: "var(--semantic-warning)",
          textShadow: "0 0 3px var(--hf-bg), 0 0 6px var(--hf-bg)",
        }}
        aria-hidden="true"
      >
        {correction.suggestedPitch}
      </div>

      {/* Highlight tint on original note */}
      <div
        className="hf-score-overlay-pill absolute rounded-full pointer-events-none"
        style={{
          left: originalTint.left,
          top: originalTint.top,
          width: originalTint.width,
          height: originalTint.height,
          backgroundColor: "color-mix(in srgb, var(--semantic-warning) 32%, transparent)",
          border: "1px dashed var(--semantic-warning)",
          boxShadow: "0 0 0 1px color-mix(in srgb, var(--semantic-warning) 28%, transparent)",
        }}
        aria-hidden="true"
      />

      {/* Accept/reject popover — appears on hover/focus */}
      {showPopover && (
        <div
          className="absolute flex items-center gap-1 rounded-md px-2 py-1 shadow-md pointer-events-auto z-30"
          style={{
            left: ghostX - 8,
            top: direction === "up" ? ghostY - 32 : ghostY + position.h + 8,
            backgroundColor: "var(--hf-surface, #1e293b)",
            border: "1px solid var(--semantic-warning)",
          }}
          role="group"
          aria-label={`Accept or reject: ${correction.ruleLabel}`}
        >
          <span
            className="font-mono text-[10px] font-medium select-none whitespace-nowrap"
            style={{ color: "var(--semantic-warning)" }}
          >
            {correction.suggestedPitch}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAccept();
            }}
            className="flex items-center justify-center w-[18px] h-[18px] rounded transition-colors hover:bg-green-900/30 focus-visible:outline-2 focus-visible:outline-offset-1"
            style={{ color: "#2e7d32" }}
            aria-label={`Accept: change to ${correction.suggestedPitch}`}
          >
            <Check className="w-[11px] h-[11px]" strokeWidth={2.5} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReject();
            }}
            className="flex items-center justify-center w-[18px] h-[18px] rounded transition-colors hover:bg-red-900/30 focus-visible:outline-2 focus-visible:outline-offset-1"
            style={{ color: "var(--semantic-violation)" }}
            aria-label={`Reject suggestion for ${correction.originalPitch}`}
          >
            <X className="w-[11px] h-[11px]" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </>
  );
}
