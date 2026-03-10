"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceDropdown } from "@/components/molecules/VoiceDropdown";
import { EnsemblePreviewCard, type SelectedPart } from "@/components/molecules/EnsemblePreviewCard";
import type { VoiceType } from "@/components/atoms/PartChip";

/** Placeholder instrument lists per voice — replaced by backend data later */
const VOICE_INSTRUMENTS: Record<VoiceType, string[]> = {
  soprano: ["Soprano Voice", "Flute", "Oboe", "Violin I"],
  alto: ["Alto Voice", "Clarinet", "Viola", "French Horn"],
  tenor: ["Tenor Voice", "Trumpet", "Cello", "Trombone"],
  bass: ["Bass Voice", "Bassoon", "Double Bass", "Tuba"],
};

const VOICE_ORDER: VoiceType[] = ["soprano", "alto", "tenor", "bass"];

export type Genre = "classical" | "jazz" | "pop";

export interface GenerationConfig {
  mood: "major" | "minor";
  genre?: Genre;
  instruments: Record<VoiceType, string[]>;
}

export interface EnsembleBuilderPanelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  onGenerateHarmonies?: (config: GenerationConfig) => void;
  /** Disable Generate button while harmonies are being generated */
  isGenerating?: boolean;
}

/**
 * EnsembleBuilderPanel Organism
 * Extracted from Pencil Node ID: ZlAUA ("Ensemble Builder Panel")
 * Right column: heading → 4 VoiceDropdowns → divider → EnsemblePreviewCard → Generate CTA.
 * Manages local selection state for each voice. Client component.
 */
export const EnsembleBuilderPanel = React.forwardRef<
  HTMLDivElement,
  EnsembleBuilderPanelProps
>(({ onGenerateHarmonies, isGenerating = false, className, ...props }, ref) => {
  const [mood, setMood] = useState<"major" | "minor">("major");
  const [genre, setGenre] = useState<Genre>("classical");
  const [selections, setSelections] = useState<Record<VoiceType, string[]>>({
    soprano: [],
    alto: [],
    tenor: [],
    bass: [],
  });

  const handleToggle = (voice: VoiceType, instrument: string) => {
    setSelections((prev) => {
      const current = prev[voice];
      return {
        ...prev,
        [voice]: current.includes(instrument)
          ? current.filter((i) => i !== instrument)
          : [...current, instrument],
      };
    });
  };

  const handleRemovePart = (label: string) => {
    setSelections((prev) => {
      const next = { ...prev };
      for (const voice of VOICE_ORDER) {
        next[voice] = next[voice].filter((i) => i !== label);
      }
      return next;
    });
  };

  // Flatten all selected parts into SelectedPart[] for preview card
  const selectedParts: SelectedPart[] = VOICE_ORDER.flatMap((voice) =>
    selections[voice].map((label) => ({ label, voice })),
  );

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-[24px] flex-1 h-full overflow-y-auto",
        "px-[48px] pt-[32px] pb-[32px]",
        className,
      )}
      style={{
        backgroundColor: "var(--hf-panel-bg)",
        borderLeft: "1px solid var(--hf-detail)",
      }}
      {...props}
    >
      {/* Heading — Node eOoBk */}
      <div className="flex flex-col gap-[6px]">
        <h2
          className="font-brand text-[26px] font-normal leading-none"
          style={{ color: "var(--hf-text-primary)" }}
        >
          Ensemble Builder
        </h2>
        <p
          className="font-mono text-[12px] font-normal leading-none"
          style={{ color: "var(--hf-text-secondary)" }}
        >
          Select mood, genre, and instruments for your arrangement
        </p>
      </div>

      {/* Mood selector */}
      <div className="flex flex-col gap-[8px]">
        <span
          className="font-mono text-[11px] font-medium leading-none"
          style={{ color: "var(--hf-text-secondary)" }}
        >
          Mood
        </span>
        <div className="flex gap-[8px]">
          {(["major", "minor"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(m)}
              className={cn(
                "rounded-[6px] px-[16px] py-[10px] font-mono text-[12px] font-medium",
                "transition-opacity hover:opacity-90",
                mood === m
                  ? "bg-[var(--hf-accent)] text-[#1a0f0c]"
                  : "bg-[var(--hf-surface)]/20 text-[var(--hf-text-primary)] border border-[var(--hf-detail)]"
              )}
            >
              {m === "major" ? "Major" : "Minor"}
            </button>
          ))}
        </div>
      </div>

      {/* Genre preset — affects harmony theory only (chord inference, voice-leading) */}
      <div className="flex flex-col gap-[8px]">
        <span
          className="font-mono text-[11px] font-medium leading-none"
          style={{ color: "var(--hf-text-secondary)" }}
        >
          Genre
        </span>
        <div className="flex flex-wrap gap-[8px]">
          {(["classical", "jazz", "pop"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenre(g)}
              className={cn(
                "rounded-[6px] px-[16px] py-[10px] font-mono text-[12px] font-medium",
                "transition-opacity hover:opacity-90",
                genre === g
                  ? "bg-[var(--hf-accent)] text-[#1a0f0c]"
                  : "bg-[var(--hf-surface)]/20 text-[var(--hf-text-primary)] border border-[var(--hf-detail)]"
              )}
            >
              {g === "classical" ? "Classical" : g === "jazz" ? "Jazz" : "Pop"}
            </button>
          ))}
        </div>
        <span className="font-mono text-[10px] opacity-60" style={{ color: "var(--hf-text-secondary)" }}>
          {genre === "classical" && "Strict voice-leading, diatonic triads"}
          {genre === "jazz" && "7th chords, ii–V–I, relaxed voice-leading"}
          {genre === "pop" && "Cyclical progressions, modal borrowing"}
        </span>
      </div>

      {/* Voice List — Node iVLue */}
      <div className="flex flex-col gap-[10px] w-full">
        {VOICE_ORDER.map((voice) => (
          <VoiceDropdown
            key={voice}
            voice={voice}
            instruments={VOICE_INSTRUMENTS[voice]}
            selected={selections[voice]}
            onToggle={(instrument) => handleToggle(voice, instrument)}
          />
        ))}
      </div>

      {/* Divider — Node IPbv5 */}
      <div
        className="w-full h-[1px] shrink-0"
        style={{
          backgroundColor: "var(--hf-detail)",
          opacity: 0.4,
        }}
        aria-hidden="true"
      />

      {/* Ensemble Preview Card — Node LtBtZ */}
      <EnsemblePreviewCard
        selectedParts={selectedParts}
        totalParts={12}
        onRemovePart={handleRemovePart}
      />

      {/* Generate CTA row — Node nrVwz / rJKG6 */}
      <div className="flex justify-end w-full">
        <button
          type="button"
          disabled={isGenerating}
          onClick={() =>
            onGenerateHarmonies?.({
              mood,
              genre,
              instruments: selections,
            })
          }
          className={cn(
            "flex items-center gap-[8px] rounded-[6px] px-[24px] py-[12px]",
            "font-mono text-[13px] font-bold leading-none",
            "transition-opacity duration-150 hover:opacity-90 active:opacity-80",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hf-surface)]",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50",
          )}
          style={{
            backgroundColor: "var(--hf-accent)",
            color: "var(--text-on-light)",
          }}
          aria-label="Generate harmonies"
        >
          <Sparkles
            className="w-4 h-4 shrink-0"
            aria-hidden="true"
          />
          Generate Harmonies
        </button>
      </div>
    </div>
  );
});

EnsembleBuilderPanel.displayName = "EnsembleBuilderPanel";
