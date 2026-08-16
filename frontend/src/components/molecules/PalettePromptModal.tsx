"use client";

import React from "react";
import { HfModal } from "@/components/molecules/HfModal";
import type { PalettePromptKind } from "@/lib/sandbox/paletteToolScoreOps";

export type PalettePromptState = {
  kind: PalettePromptKind;
  title: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  /** Selection captured when the modal opened (RS remounts can clear live selection). */
  noteIds?: string[];
  measureIndex?: number;
};

const PROMPT_META: Record<
  PalettePromptKind,
  { title: string; label: string; defaultValue: string; placeholder?: string }
> = {
  lyrics: { title: "Lyric syllable", label: "Lyric", defaultValue: "", placeholder: "la" },
  chord: {
    title: "Chord symbol",
    label: "Symbol",
    defaultValue: "",
    placeholder: "Cmaj7",
  },
  expression: {
    title: "Expression text",
    label: "Expression",
    defaultValue: "",
    placeholder: "dolce",
  },
  performance: {
    title: "Performance text",
    label: "Performance",
    defaultValue: "",
    placeholder: "con fuoco",
  },
  rehearsal: { title: "Rehearsal mark", label: "Mark", defaultValue: "A" },
  tempo: { title: "Custom tempo", label: "BPM (quarter note)", defaultValue: "120" },
  time: { title: "Time signature", label: "Time signature", defaultValue: "4/4", placeholder: "4/4" },
  key: {
    title: "Key signature",
    label: "Fifths (−7 to +7)",
    defaultValue: "0",
    placeholder: "0",
  },
};

export function palettePromptState(
  kind: PalettePromptKind,
  defaults?: Partial<{ tempo: string; time: string; key: string }>,
  ctx?: { noteIds?: Iterable<string>; measureIndex?: number },
): PalettePromptState {
  const meta = PROMPT_META[kind];
  let defaultValue = meta.defaultValue;
  if (kind === "tempo" && defaults?.tempo) defaultValue = defaults.tempo;
  if (kind === "time" && defaults?.time) defaultValue = defaults.time;
  if (kind === "key" && defaults?.key) defaultValue = defaults.key;
  return {
    kind,
    title: meta.title,
    label: meta.label,
    defaultValue,
    placeholder: meta.placeholder,
    noteIds: ctx?.noteIds ? [...ctx.noteIds] : undefined,
    measureIndex: ctx?.measureIndex,
  };
}

export interface PalettePromptModalProps {
  state: PalettePromptState | null;
  onSubmit: (kind: PalettePromptKind, value: string) => void;
  onClose: () => void;
}

export function PalettePromptModal({ state, onSubmit, onClose }: PalettePromptModalProps) {
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    if (state) setValue(state.defaultValue);
  }, [state]);

  if (!state) return null;

  return (
    <HfModal
      isOpen={Boolean(state)}
      onClose={onClose}
      labelledBy="palette-prompt-title"
      panelClassName="w-full max-w-sm p-5"
    >
      <h2
        id="palette-prompt-title"
        className="font-serif text-lg mb-3"
        style={{ color: "var(--hf-text-primary)" }}
      >
        {state.title}
      </h2>
      <label className="block mb-3">
        <span
          className="font-mono text-[11px] uppercase tracking-wide opacity-70"
          style={{ color: "var(--hf-text-secondary)" }}
        >
          {state.label}
        </span>
        <input
          type="text"
          autoFocus
          data-testid="palette-prompt-input"
          value={value}
          placeholder={state.placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit(state.kind, value);
            }
          }}
          className="mt-1 w-full h-9 px-2 rounded-md border border-[var(--hf-detail)] bg-[var(--hf-bg)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--hf-accent)]"
          style={{ color: "var(--hf-text-primary)" }}
        />
      </label>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          data-testid="palette-prompt-cancel"
          onClick={onClose}
          className="hf-pressable px-3 py-1.5 rounded-md border border-[var(--hf-detail)] font-mono text-xs"
          style={{ color: "var(--hf-text-primary)" }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSubmit(state.kind, value)}
          className="hf-pressable px-3 py-1.5 rounded-md border border-[var(--hf-accent)] font-mono text-xs bg-[color-mix(in_srgb,var(--hf-accent)_12%,transparent)]"
          style={{ color: "var(--hf-text-primary)" }}
        >
          Apply
        </button>
      </div>
    </HfModal>
  );
}
