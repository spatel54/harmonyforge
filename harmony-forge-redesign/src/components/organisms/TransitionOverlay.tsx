"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type TransitionVariant = "parsing" | "generating";

export interface TransitionOverlayProps {
  variant: TransitionVariant;
  /** Controls visibility — fade in immediately, fade out on false */
  visible: boolean;
  className?: string;
}

const LABELS: Record<TransitionVariant, { headline: string; sub: string }> = {
  parsing: {
    headline: "Parsing Score",
    sub: "Reading symbolic notation…",
  },
  generating: {
    headline: "Generating Harmonies",
    sub: "Applying voice-leading rules…",
  },
};

/** Five animated stave lines that pulse in sequence */
function StaveLines({ color }: { color: string }) {
  return (
    <div className="flex flex-col gap-[8px] w-[200px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-[1px] rounded-full origin-left"
          style={{
            backgroundColor: color,
            animation: `hf-stave-line 1.4s ease-in-out infinite`,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Three bouncing note heads */
function NoteHeads({ color }: { color: string }) {
  return (
    <div className="flex items-end gap-[10px]">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-[12px] h-[9px] rounded-full"
          style={{
            backgroundColor: color,
            animation: `hf-note-bounce 0.9s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Orbiting gradient sphere (generating variant) */
function OrbitSphere() {
  return (
    <div className="relative w-[72px] h-[72px]">
      {/* Core */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, var(--hf-accent), var(--hf-surface), var(--hf-accent))",
          animation: "hf-sphere-spin 1.8s linear infinite",
          boxShadow: "0 0 32px rgba(25,118,210,0.35)",
        }}
      />
      {/* Inner gloss */}
      <div
        className="absolute inset-[6px] rounded-full"
        style={{ backgroundColor: "var(--hf-bg)", opacity: 0.3 }}
      />
    </div>
  );
}

/**
 * TransitionOverlay Organism
 * Full-screen branded loading screen shown between route navigations.
 *
 * Variants:
 *  - "parsing"    → Upload → Document   (score parsing)
 *  - "generating" → Document → Sandbox  (harmony generation)
 */
export function TransitionOverlay({
  variant,
  visible,
  className,
}: TransitionOverlayProps) {
  const { headline, sub } = LABELS[variant];

  return (
    <div
      aria-live="assertive"
      aria-label={headline}
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-[32px]",
        "transition-opacity duration-500",
        visible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none",
        className,
      )}
      style={{ backgroundColor: "var(--hf-bg)" }}
    >
      {/* Logo mark */}
      <div
        className="flex items-center gap-[10px] mb-[8px]"
        style={{ opacity: 0.5 }}
      >
        <div
          className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, var(--hf-surface), var(--hf-accent))",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <span
          className="font-serif text-[18px]"
          style={{ color: "var(--hf-text-primary)" }}
        >
          HarmonyForge
        </span>
      </div>

      {/* Variant-specific animation */}
      {variant === "parsing" ? (
        <div className="flex flex-col items-center gap-[20px]">
          <StaveLines color="var(--hf-detail)" />
          <NoteHeads color="var(--hf-surface)" />
        </div>
      ) : (
        <OrbitSphere />
      )}

      {/* Text */}
      <div className="flex flex-col items-center gap-[6px]">
        <p
          className="font-serif text-[24px]"
          style={{ color: "var(--hf-text-primary)" }}
        >
          {headline}
        </p>
        <p
          className="font-mono text-[12px] opacity-50"
          style={{ color: "var(--hf-text-primary)" }}
        >
          {sub}
        </p>
      </div>

      {/* Progress bar */}
      <div
        className="w-[180px] h-[2px] rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--hf-detail)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            backgroundColor: "var(--hf-accent)",
            animation: "hf-progress-bar 1.6s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}
