"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type GlassBoxPedagogyVariant = "ensemble-generate" | "ensemble-reviewer" | "inspector";

export interface GlassBoxPedagogyCalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: GlassBoxPedagogyVariant;
}

const COPY: Record<GlassBoxPedagogyVariant, { title: string; body: string }> = {
  "ensemble-generate": {
    title: "How HarmonyForge uses (and doesn’t use) AI",
    body:
      "The harmony generator runs on explicit music-theory rules and search—it is not a chat model or neural net writing your parts. Conversational AI appears only in the Theory Inspector on the next screen, where it can explain what you’re hearing, flag issues, or suggest edits. The aim is a modern arranging workflow: predictable, inspectable harmony from the engine, with AI in a coaching role instead of an opaque generator.",
  },
  "ensemble-reviewer": {
    title: "How HarmonyForge uses (and doesn’t use) AI",
    body:
      "You’re continuing with your melody and building harmonies yourself. When someone uses Generate Harmonies, that step is still rule-based—not a language model inventing parts. Conversational AI is reserved for the Theory Inspector (explain, critique, suggest), so your creative choices stay primary and the assistant stays in a supporting role.",
  },
  inspector: {
    title: "This panel is where conversational AI lives",
    body:
      "Chats here use a language model to discuss your score—explanations, audits, and stylistic suggestions. Automatic harmony generation in HarmonyForge is separate: it follows fixed algorithms, not this chat. The design is to shift AI from anonymous generation to transparent coaching alongside deterministic harmony.",
  },
};

/**
 * Short, plain-language note distinguishing deterministic harmony generation
 * from Theory Inspector LLM usage (Glass Box pedagogy).
 */
export function GlassBoxPedagogyCallout({
  variant,
  className,
  ...props
}: GlassBoxPedagogyCalloutProps) {
  const { title, body } = COPY[variant];
  return (
    <aside
      className={cn(
        "rounded-[6px] border px-[12px] py-[10px]",
        "font-body text-[11px] leading-[1.45]",
        className,
      )}
      style={{
        borderColor: "var(--hf-detail)",
        backgroundColor: "color-mix(in srgb, var(--hf-surface) 12%, transparent)",
        color: "var(--hf-text-primary)",
      }}
      {...props}
    >
      <h3
        className="font-mono text-[10px] font-semibold uppercase tracking-wide mb-[6px]"
        style={{ color: "var(--hf-text-secondary)" }}
      >
        {title}
      </h3>
      <p className="m-0">{body}</p>
    </aside>
  );
}
