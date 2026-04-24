"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VoiceType } from "@/components/atoms/PartChip";

/** Voice-keyed semantic styles — fixed, cross-theme (MASTER.md §1) */
const VOICE_STYLES: Record<
  VoiceType,
  { letter: string; textColor: string; badgeBg: string; borderColor: string }
> = {
  soprano: {
    letter: "S",
    textColor: "#D32F2F",
    badgeBg: "#D32F2F33",
    borderColor: "#D32F2FB3",
  },
  alto: {
    letter: "A",
    textColor: "#1976D2",
    badgeBg: "#1976D233",
    borderColor: "#1976D2B3",
  },
  tenor: {
    letter: "T",
    textColor: "#FFB300",
    badgeBg: "#FFB3001A",
    borderColor: "#FFB300B3",
  },
  bass: {
    letter: "B",
    textColor: "#7B1FA2",
    badgeBg: "#7B1FA21A",
    borderColor: "#7B1FA2B3",
  },
};

const VOICE_LABELS: Record<VoiceType, string> = {
  soprano: "Soprano",
  alto: "Alto",
  tenor: "Tenor",
  bass: "Bass",
};

type InstrumentFamily = "Voices" | "Woodwinds" | "Brass" | "Strings";

const FAMILY_ORDER: InstrumentFamily[] = ["Voices", "Woodwinds", "Brass", "Strings"];

function instrumentFamily(name: string): InstrumentFamily {
  const n = name.toLowerCase();
  if (/\b(voice|vocal)\b/.test(n) || n.endsWith(" voice")) return "Voices";
  if (/\b(flute|oboe|english horn|clarinet|bassoon|saxophone|sax|piccolo|recorder)\b/.test(n))
    return "Woodwinds";
  if (/\b(trumpet|horn|trombone|tuba|euphonium|cornet|bugle|flugelhorn)\b/.test(n)) return "Brass";
  if (/\b(violin|viola|cello|string|guitar|harp|double bass|contrabass|lute)\b/.test(n))
    return "Strings";
  return "Strings";
}

/** Same fragment keys as RiffScoreEditor — small icons in the picker. */
const INSTRUMENT_IMAGE_MAP: Array<{ keys: string[]; src: string }> = [
  { keys: ["soprano voice", "soprano"], src: "/instruments/soprano_voice.svg" },
  { keys: ["flute"], src: "/instruments/flute.svg" },
  { keys: ["oboe"], src: "/instruments/oboe.svg" },
  { keys: ["violin"], src: "/instruments/violin_i.svg" },
  { keys: ["alto voice", "alto"], src: "/instruments/alto_voice.svg" },
  { keys: ["clarinet"], src: "/instruments/clarinet.svg" },
  { keys: ["viola"], src: "/instruments/viola.svg" },
  { keys: ["french horn", "horn"], src: "/instruments/french_horn.svg" },
  { keys: ["tenor voice", "tenor"], src: "/instruments/tenor_voice.svg" },
  { keys: ["trumpet"], src: "/instruments/trumpet.svg" },
  { keys: ["cello"], src: "/instruments/cello.svg" },
  { keys: ["trombone"], src: "/instruments/trombone.svg" },
  { keys: ["bass voice", "bass"], src: "/instruments/bass_voice.svg" },
  { keys: ["bassoon"], src: "/instruments/bassoon.svg" },
  { keys: ["double bass", "contrabass"], src: "/instruments/double_bass.svg" },
  { keys: ["tuba"], src: "/instruments/tuba.svg" },
];

function instrumentIconSrc(name: string): string | null {
  const n = name.toLowerCase();
  const sorted = [...INSTRUMENT_IMAGE_MAP].sort(
    (a, b) => Math.max(...b.keys.map((k) => k.length)) - Math.max(...a.keys.map((k) => k.length)),
  );
  for (const entry of sorted) {
    if (entry.keys.some((k) => n.includes(k))) return entry.src;
  }
  return null;
}

export interface VoiceDropdownProps {
  voice: VoiceType;
  instruments: string[];
  selected: string[];
  onToggle: (instrument: string) => void;
  descriptions?: Record<string, string>;
  className?: string;
}

/**
 * VoiceDropdown Molecule
 * Extracted from Pencil Node IDs: 0RQms / jPYyt / fGaR1 / i9BiM (Voice List rows in iVLue)
 * Collapsible row per SATB voice with a checkmark-list overlay for instrument selection.
 * Left border accent is voice-color keyed. Dropdown uses aria-expanded + role=listbox.
 */
export const VoiceDropdown = React.forwardRef<
  HTMLDivElement,
  VoiceDropdownProps
>(({ voice, instruments, selected, onToggle, descriptions, className }, ref) => {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const styles = VOICE_STYLES[voice];
  const label = VOICE_LABELS[voice];

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        rowRef.current &&
        !rowRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Keyboard navigation inside dropdown
  const handleDropdownKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = dropdownRef.current?.querySelectorAll<HTMLElement>(
      '[role="option"]',
    );
    if (!items || items.length === 0) return;
    const focused = document.activeElement as HTMLElement;
    const idx = Array.from(items).indexOf(focused);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[Math.min(idx + 1, items.length - 1)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[Math.max(idx - 1, 0)]?.focus();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Trigger row */}
      <div
        ref={rowRef}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`voice-dropdown-${voice}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className={cn(
          "flex items-center gap-[14px] h-[52px] w-full rounded-[6px] px-[16px]",
          "cursor-pointer select-none",
          "transition-opacity duration-150 hover:opacity-90",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hf-accent)]",
        )}
        style={{
          backgroundColor: "color-mix(in srgb, var(--hf-surface) 10%, transparent)",
          borderLeft: `3px solid ${styles.borderColor}`,
          borderTop: "1px solid transparent",
          borderRight: "1px solid transparent",
          borderBottom: "1px solid transparent",
        }}
      >
        {/* Voice badge + name */}
        <div className="flex items-center gap-[8px] flex-1 min-w-0">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-[12px] shrink-0"
            style={{ backgroundColor: styles.badgeBg }}
            aria-hidden="true"
          >
            <span
              className="font-mono text-[10px] font-bold leading-none"
              style={{ color: styles.textColor }}
            >
              {styles.letter}
            </span>
          </div>
          <span
            className="font-mono text-[13px] font-medium leading-none truncate"
            style={{ color: "var(--hf-text-primary)" }}
          >
            {label}
          </span>
        </div>

        {/* Count badge */}
        <div
          className="flex items-center rounded-full px-[8px] py-[3px] shrink-0"
          style={{ backgroundColor: "var(--hf-accent)" }}
        >
          <span
            className="font-mono text-[10px] font-normal leading-none"
            style={{ color: "#1a0f0c" }}
          >
            {selected.length} selected
          </span>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            "w-5 h-5 shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
          style={{ color: "var(--hf-text-primary)" }}
          aria-hidden="true"
        />
      </div>

      {/* Dropdown overlay */}
      {open && (
        <div
          id={`voice-dropdown-${voice}`}
          ref={dropdownRef}
          role="listbox"
          aria-label={`${label} instruments`}
          aria-multiselectable="true"
          onKeyDown={handleDropdownKeyDown}
          className={cn(
            "absolute left-0 right-0 z-[var(--z-tooltip)] mt-1",
            "rounded-[6px] border border-[var(--hf-detail)]",
            "shadow-md overflow-hidden",
          )}
          style={{ backgroundColor: "var(--hf-bg)" }}
        >
          {FAMILY_ORDER.map((family) => {
            const items = instruments.filter((i) => instrumentFamily(i) === family);
            if (items.length === 0) return null;
            return (
              <div key={family} className="flex flex-col">
                <div
                  className="px-[16px] py-[6px] font-mono text-[9px] font-semibold uppercase tracking-wider"
                  style={{
                    color: "var(--hf-text-secondary)",
                    backgroundColor: "color-mix(in srgb, var(--hf-surface) 12%, transparent)",
                  }}
                >
                  {family}
                </div>
                {items.map((instrument) => {
                  const isSelected = selected.includes(instrument);
                  const src = instrumentIconSrc(instrument);
                  return (
                    <div
                      key={instrument}
                      role="option"
                      tabIndex={0}
                      aria-selected={isSelected}
                      onClick={() => onToggle(instrument)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onToggle(instrument);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-[10px] px-[16px] py-[10px]",
                        "cursor-pointer",
                        "transition-colors duration-100",
                        "hover:bg-[var(--hf-surface)]/5",
                        "focus-visible:outline-none focus-visible:bg-[var(--hf-surface)]/10",
                      )}
                    >
                      <Check
                        className={cn(
                          "w-[14px] h-[14px] shrink-0 transition-opacity duration-150",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                        style={{ color: styles.textColor }}
                        aria-hidden="true"
                        strokeWidth={2.5}
                      />
                      {src ? (
                        <Image
                          src={src}
                          alt=""
                          width={22}
                          height={22}
                          className="w-[22px] h-[22px] shrink-0 object-contain opacity-90"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="w-[22px] h-[22px] shrink-0" aria-hidden="true" />
                      )}
                      <div className="flex flex-col gap-[2px] min-w-0">
                        <span
                          className="font-mono text-[11px] font-normal leading-none"
                          style={{ color: "var(--hf-text-primary)" }}
                        >
                          {instrument}
                        </span>
                        {descriptions?.[instrument] && (
                          <span
                            className="font-mono text-[9px] leading-tight opacity-55"
                            style={{ color: "var(--hf-text-secondary)" }}
                          >
                            {descriptions[instrument]}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

VoiceDropdown.displayName = "VoiceDropdown";
