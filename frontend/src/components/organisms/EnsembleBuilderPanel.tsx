"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceDropdown } from "@/components/molecules/VoiceDropdown";
import { EnsemblePreviewCard, type SelectedPart } from "@/components/molecules/EnsemblePreviewCard";
import { HoverTooltip } from "@/components/atoms/HoverTooltip";
import { GlassBoxPedagogyCallout } from "@/components/molecules/GlassBoxPedagogyCallout";
import type { VoiceType } from "@/components/atoms/PartChip";
import {
  useGenerationConfigStore,
  type RhythmDensity,
} from "@/store/useGenerationConfigStore";

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
  rhythmDensity?: RhythmDensity;
  instruments: Record<VoiceType, string[]>;
  /** When true, infer harmony from melody + mood/genre (ignore chord symbols in file). */
  preferInferredChords?: boolean;
}

const RHYTHM_DENSITY_LABELS: Record<RhythmDensity, { title: string; hint: string }> = {
  chordal: {
    title: "Chordal",
    hint: "Long, sustained backing—chords change slowly (fewer harmony updates).",
  },
  mixed: {
    title: "Mixed",
    hint: "Backing refreshes when your melody starts a new note—fits most tunes.",
  },
  flowing: {
    title: "Flowing",
    hint: "Busier backing—harmony moves more often between melody notes.",
  },
};

export interface EnsembleBuilderPanelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  onGenerateHarmonies?: (config: GenerationConfig) => void;
  /** Disable Generate button while harmonies are being generated */
  isGenerating?: boolean;
  /**
   * M5 study: reviewer arm uses melody-only continuation copy instead of auto harmony generation.
   */
  studyPrimaryVariant?: "generate" | "reviewer_melody";
  /** Replaces default subheading under "Ensemble Builder" when set */
  studyPanelSubtitle?: string;
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
>(({ onGenerateHarmonies, isGenerating = false, studyPrimaryVariant = "generate", studyPanelSubtitle, className, ...props }, ref) => {
  const mood = useGenerationConfigStore((s) => s.mood);
  const rhythmDensity = useGenerationConfigStore((s) => s.rhythmDensity);
  const selections = useGenerationConfigStore((s) => s.instruments);
  const setMood = useGenerationConfigStore((s) => s.setMood);
  const setRhythmDensity = useGenerationConfigStore((s) => s.setRhythmDensity);
  const toggleInstrument = useGenerationConfigStore((s) => s.toggleInstrument);
  const removeInstrument = useGenerationConfigStore((s) => s.removeInstrument);
  const restoreFromStorage = useGenerationConfigStore((s) => s.restoreFromStorage);

  React.useEffect(() => {
    restoreFromStorage();
  }, [restoreFromStorage]);

  const handleToggle = (voice: VoiceType, instrument: string) => {
    toggleInstrument(voice, instrument);
  };

  const handleRemovePart = (label: string) => {
    removeInstrument(label);
  };

  // Flatten all selected parts into SelectedPart[] for preview card
  const selectedParts: SelectedPart[] = VOICE_ORDER.flatMap((voice) =>
    selections[voice].map((label) => ({ label, voice })),
  );

  return (
    <div
      ref={ref}
      data-coachmark="step-2"
      className={cn(
        "flex flex-col gap-5 flex-1 h-full overflow-y-auto",
        "px-[40px] pt-[28px] pb-[32px]",
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
          {studyPanelSubtitle ??
            (studyPrimaryVariant === "reviewer_melody"
              ? "Set context for the assistant; you will add harmonies in the editor."
              : "Choose mood, backing density, and instruments for this arrangement.")}
        </p>
        <p
          className="font-body text-[11px] leading-snug m-0 mt-[10px] max-w-prose"
          style={{ color: "var(--hf-text-secondary)" }}
        >
          {studyPrimaryVariant === "reviewer_melody" ? (
            <>
              Harmonies are not written by generative AI in this flow. Chat-style AI—for explanations and
              suggestions—lives in <span style={{ color: "var(--hf-text-primary)" }}>Theory Inspector</span> on the
              next screen.
            </>
          ) : (
            <>
              Generated harmonies come from the engine&apos;s{" "}
              <span style={{ color: "var(--hf-text-primary)" }}>algorithms</span> (theory rules and search), not from
              generative AI. <span style={{ color: "var(--hf-text-primary)" }}>AI</span> appears only in{" "}
              <span style={{ color: "var(--hf-text-primary)" }}>Theory Inspector</span> on the next screen.
            </>
          )}
        </p>
      </div>

      <GlassBoxPedagogyCallout
        variant={studyPrimaryVariant === "reviewer_melody" ? "ensemble-reviewer" : "ensemble-generate"}
      />

      {/* Sound & style — mood + backing density */}
      <section
        className="rounded-[8px] border p-4 flex flex-col gap-4"
        style={{
          borderColor: "color-mix(in srgb, var(--hf-detail) 65%, transparent)",
          backgroundColor: "color-mix(in srgb, var(--hf-surface) 7%, transparent)",
        }}
        aria-labelledby="ensemble-sound-style-heading"
      >
        <h3
          id="ensemble-sound-style-heading"
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] m-0"
          style={{ color: "var(--hf-text-secondary)" }}
        >
          Sound & style
        </h3>

        <div className="flex flex-col gap-[8px]">
          <span
            className="font-mono text-[11px] font-medium leading-none flex items-center gap-[6px]"
            style={{ color: "var(--hf-text-secondary)" }}
          >
            Mood
            <HoverTooltip
              ariaLabel="About mood"
              content={
                "Major vs minor: brighter vs darker overall mood (the key’s character).\nNot the same as tempo or how fast notes go by."
              }
            />
          </span>
          <div className="flex gap-[8px] flex-wrap">
            {(["major", "minor"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                title={
                  m === "major"
                    ? "Often brighter or more uplifting (major key)"
                    : "Often darker or more serious (minor key)"
                }
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

        <div className="flex flex-col gap-[8px]">
          <span
            className="font-mono text-[11px] font-medium leading-none flex items-center gap-[6px]"
            style={{ color: "var(--hf-text-secondary)" }}
          >
            Harmony motion
            <HoverTooltip
              ariaLabel="About harmony motion"
              content={
                "How often the harmony refreshes under your tune.\n\n• Chordal — long, slow-changing chords\n• Mixed — aligns with melody attacks\n• Flowing — busier motion between melody notes"
              }
            />
          </span>
          <div className="flex flex-wrap gap-[8px]">
            {(["chordal", "mixed", "flowing"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRhythmDensity(d)}
                title={RHYTHM_DENSITY_LABELS[d].hint}
                className={cn(
                  "rounded-[6px] px-[16px] py-[10px] font-mono text-[12px] font-medium",
                  "transition-opacity hover:opacity-90",
                  rhythmDensity === d
                    ? "bg-[var(--hf-accent)] text-[#1a0f0c]"
                    : "bg-[var(--hf-surface)]/20 text-[var(--hf-text-primary)] border border-[var(--hf-detail)]"
                )}
              >
                {RHYTHM_DENSITY_LABELS[d].title}
              </button>
            ))}
          </div>
          <span className="font-mono text-[10px] opacity-70" style={{ color: "var(--hf-text-secondary)" }}>
            {RHYTHM_DENSITY_LABELS[rhythmDensity].hint}
          </span>
        </div>

        {studyPrimaryVariant !== "reviewer_melody" && (
          <p
            className="m-0 text-[10px] leading-snug pt-2 border-t"
            style={{
              color: "var(--hf-text-secondary)",
              borderColor: "color-mix(in srgb, var(--hf-detail) 45%, transparent)",
            }}
          >
            <strong style={{ color: "var(--hf-text-primary)", fontWeight: 600 }}>Classical-style</strong> triads and
            voice-leading in the current key. Jazz, pop, and other styles are not available yet.
          </p>
        )}
      </section>

      {/* Voice List — Node iVLue */}
      <section
        className="rounded-[8px] border p-4 flex flex-col gap-3 w-full"
        style={{
          borderColor: "color-mix(in srgb, var(--hf-detail) 65%, transparent)",
          backgroundColor: "color-mix(in srgb, var(--hf-surface) 7%, transparent)",
        }}
        aria-labelledby="ensemble-instruments-heading"
      >
        <h3
          id="ensemble-instruments-heading"
          className="font-mono text-[11px] font-medium leading-none flex items-center gap-[6px] m-0"
          style={{ color: "var(--hf-text-secondary)" }}
        >
          Instruments (SATB)
          <HoverTooltip
            ariaLabel="What SATB means"
            content={
              "Four ranges, high to low: soprano, alto, tenor, bass.\nPick any instruments per line—mix freely."
            }
          />
        </h3>
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
      </section>

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
              genre: "classical",
              rhythmDensity,
              instruments: selections,
              preferInferredChords: false,
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
          aria-label={
            studyPrimaryVariant === "reviewer_melody"
              ? "Continue to sandbox with melody only"
              : "Generate harmonies"
          }
        >
          <Sparkles
            className="w-4 h-4 shrink-0"
            aria-hidden="true"
          />
          {studyPrimaryVariant === "reviewer_melody"
            ? "Continue to sandbox (melody only)"
            : "Generate Harmonies"}
        </button>
      </div>
    </div>
  );
});

EnsembleBuilderPanel.displayName = "EnsembleBuilderPanel";
