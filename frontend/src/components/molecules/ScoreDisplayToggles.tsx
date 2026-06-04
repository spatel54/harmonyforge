"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { HoverTooltip } from "@/components/atoms/HoverTooltip";
import { useScoreDisplayStore } from "@/store/useScoreDisplayStore";

export interface ScoreDisplayTogglesProps {
  /** When true, show the chord-symbol visibility toggle (melody + harmony). */
  showChordSymbolsToggle?: boolean;
  className?: string;
}

/**
 * Letter-name and chord-symbol overlays — shared by Sandbox header and export preview.
 */
export function ScoreDisplayToggles({
  showChordSymbolsToggle = false,
  className,
}: ScoreDisplayTogglesProps) {
  const showNoteNameLabels = useScoreDisplayStore((s) => s.showNoteNameLabels);
  const setShowNoteNameLabels = useScoreDisplayStore((s) => s.setShowNoteNameLabels);
  const showChordSymbols = useScoreDisplayStore((s) => s.showChordSymbols);
  const setShowChordSymbols = useScoreDisplayStore((s) => s.setShowChordSymbols);

  return (
    <div
      className={cn(
        "flex items-center gap-2 shrink-0 rounded-md border px-2 py-1",
        className,
      )}
      style={{
        borderColor: "color-mix(in srgb, var(--hf-detail) 65%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--hf-surface) 35%, transparent)",
      }}
      role="group"
      aria-label="Score label overlays"
    >
      <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0 rounded-md px-0.5 py-0.5 transition-colors hover:bg-[color-mix(in_srgb,var(--hf-surface)_10%,transparent)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--hf-accent)] has-[:focus-visible]:ring-offset-1 has-[:focus-visible]:ring-offset-[var(--hf-bg)]">
        <input
          type="checkbox"
          className="rounded border-[var(--hf-detail)] size-3.5 accent-[var(--hf-surface)] transition-transform active:scale-90"
          checked={showNoteNameLabels}
          onChange={(e) => setShowNoteNameLabels(e.target.checked)}
          aria-label="Show letter names above each notehead"
        />
        <span
          className="font-mono text-[10px] md:text-[11px] font-medium hidden sm:inline"
          style={{ color: "var(--hf-text-primary)" }}
        >
          Letter Names
        </span>
        <HoverTooltip
          ariaLabel="About letter names"
          content="When on, each pitch shows as letter and accidental (C, F#, Bb) just above the notehead. Turn off for a clean score."
        />
      </label>
      {showChordSymbolsToggle ? (
        <>
          <div className="w-px h-4 shrink-0 bg-[var(--hf-detail)] opacity-50" aria-hidden />
          <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0 rounded-md px-0.5 py-0.5 transition-colors hover:bg-[color-mix(in_srgb,var(--hf-surface)_10%,transparent)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--hf-accent)] has-[:focus-visible]:ring-offset-1 has-[:focus-visible]:ring-offset-[var(--hf-bg)]">
            <input
              type="checkbox"
              className="rounded border-[var(--hf-detail)] size-3.5 accent-[var(--hf-surface)] transition-transform active:scale-90"
              checked={showChordSymbols}
              onChange={(e) => setShowChordSymbols(e.target.checked)}
              aria-label="Show chord symbols above the staff"
            />
            <span
              className="font-mono text-[10px] md:text-[11px] font-medium hidden sm:inline"
              style={{ color: "var(--hf-text-primary)" }}
            >
              Chords
            </span>
            <HoverTooltip
              ariaLabel="About chord symbols"
              content="When on, chord symbols appear above the staff. They are notation only and are not played back."
            />
          </label>
        </>
      ) : null}
    </div>
  );
}
