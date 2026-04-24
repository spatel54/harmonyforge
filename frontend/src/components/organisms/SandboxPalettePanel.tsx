"use client";

import React from "react";
import { ChevronDown, ChevronRight, PanelRightClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaletteButton } from "@/components/atoms/PaletteButton";
import {
  PALETTE_SECTIONS,
  type PaletteItem,
  type PaletteSection,
} from "@/lib/palettes/paletteRegistry";

export interface SandboxPalettePanelProps {
  /** Same tool ids as the score toolbar / keyboard path (`handleToolSelect`). */
  onActivate: (toolId: string, item: PaletteItem) => void;
  /** True when the sandbox has an active note selection — enables selection-required items. */
  hasSelection: boolean;
  /** Ask the parent to close this column. */
  onClose?: () => void;
  className?: string;
}

/**
 * Sandbox notation panel — extended symbols and score layout.
 *
 * Collapsible sections (clefs, key/time, articulations…) share the same `toolId`
 * dispatch as the editor toolbar and keyboard shortcuts (`handleToolSelect` in
 * `sandbox/page.tsx`). The RiffScore toolbar above the staff handles duration,
 * basic pitch, and playback; this panel is the single place for the full
 * symbol set (F9 to show/hide).
 */
export function SandboxPalettePanel({
  onActivate,
  hasSelection,
  onClose,
  className,
}: SandboxPalettePanelProps) {
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const defaultOpen = new Set(["note-entry", "articulations", "dynamics"]);
    for (const section of PALETTE_SECTIONS) {
      initial[section.id] = defaultOpen.has(section.id);
    }
    return initial;
  });
  const [filter, setFilter] = React.useState("");

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    for (const s of PALETTE_SECTIONS) next[s.id] = true;
    setOpenSections(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    for (const s of PALETTE_SECTIONS) next[s.id] = false;
    setOpenSections(next);
  };

  const visibleSections = React.useMemo<PaletteSection[]>(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return PALETTE_SECTIONS;
    return PALETTE_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.label.toLowerCase().includes(needle) ||
          (item.title?.toLowerCase().includes(needle) ?? false) ||
          section.label.toLowerCase().includes(needle),
      ),
    })).filter((section) => section.items.length > 0);
  }, [filter]);

  return (
    <aside
      className={cn(
        "flex flex-col h-full w-[260px] shrink-0 overflow-hidden",
        "bg-[var(--hf-panel-bg)] border-l border-[var(--hf-detail)]",
        "shadow-[inset_1px_0_0_color-mix(in_srgb,var(--hf-detail)_35%,transparent)]",
        "transition-[box-shadow,background-color] duration-300 ease-out",
        className,
      )}
      aria-label="Notation and symbols (beta)"
    >
      <div className="flex items-center justify-between h-[52px] px-3 border-b border-[var(--hf-detail)] shrink-0">
        <div className="flex flex-col leading-tight">
          <span className="font-serif text-[15px]" style={{ color: "var(--hf-text-primary)" }}>
            Notation (beta)
          </span>
          <span className="font-mono text-[10px] opacity-60" style={{ color: "var(--hf-text-primary)" }}>
            Click or drag symbols onto the score · F9 hides this panel
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Hide notation panel (F9)"
            aria-label="Hide notation panel"
            className="hf-pressable flex items-center justify-center w-[28px] h-[28px] rounded-[6px] border border-[var(--hf-detail)] shadow-sm hover:shadow-md hover:bg-[color-mix(in_srgb,var(--hf-surface)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--hf-surface)_16%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
          >
            <PanelRightClose className="w-[14px] h-[14px]" style={{ color: "var(--hf-text-primary)" }} />
          </button>
        )}
      </div>

      <div className="px-3 py-2 border-b border-[var(--hf-detail)] shrink-0 space-y-2">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={expandAll}
            className="hf-pressable flex-1 h-[26px] rounded-[6px] text-[10px] font-mono border border-[var(--hf-detail)] shadow-sm hover:border-[var(--hf-accent)] hover:bg-[color-mix(in_srgb,var(--hf-accent)_8%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
            style={{ color: "var(--hf-text-primary)" }}
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="hf-pressable flex-1 h-[26px] rounded-[6px] text-[10px] font-mono border border-[var(--hf-detail)] shadow-sm hover:border-[var(--hf-accent)] hover:bg-[color-mix(in_srgb,var(--hf-accent)_8%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
            style={{ color: "var(--hf-text-primary)" }}
          >
            Collapse all
          </button>
        </div>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter symbols…"
          className={cn(
            "w-full h-[28px] px-2 rounded-[6px]",
            "bg-[var(--hf-bg)] border border-[var(--hf-detail)]",
            "text-[12px] font-mono transition-shadow",
            "focus:outline-none focus:border-[var(--hf-accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--hf-accent)_35%,transparent)]",
          )}
          style={{ color: "var(--hf-text-primary)" }}
          aria-label="Filter notation symbols"
        />
      </div>

      <div className="hf-scroll-smooth flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2">
        {visibleSections.map((section) => {
          const isOpen = openSections[section.id] ?? false;
          return (
            <section
              key={section.id}
              className="rounded-[6px] border border-[var(--hf-detail)] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="hf-pressable w-full flex items-center justify-between px-2 py-1.5 hover:bg-[color-mix(in_srgb,var(--hf-surface)_8%,transparent)] active:bg-[color-mix(in_srgb,var(--hf-surface)_14%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--hf-accent)]"
                aria-expanded={isOpen}
                aria-controls={`palette-section-${section.id}`}
              >
                <span
                  className="font-mono text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--hf-text-primary)" }}
                >
                  {section.label}
                </span>
                {isOpen ? (
                  <ChevronDown className="w-[14px] h-[14px]" style={{ color: "var(--hf-text-primary)" }} />
                ) : (
                  <ChevronRight className="w-[14px] h-[14px]" style={{ color: "var(--hf-text-primary)" }} />
                )}
              </button>
              {isOpen && (
                <div id={`palette-section-${section.id}`} className="px-2 pb-2 pt-0">
                  {section.description ? (
                    <p
                      className="text-[10px] font-mono leading-snug mb-2 opacity-75"
                      style={{ color: "var(--hf-text-secondary)" }}
                    >
                      {section.description}
                    </p>
                  ) : null}
                  <div className="grid grid-cols-3 gap-1.5">
                  {section.items.map((item) => (
                    <PaletteButton
                      key={item.id}
                      item={item}
                      disabled={Boolean(item.requiresSelection) && !hasSelection}
                      onActivate={(it) => onActivate(it.toolId, it)}
                    />
                  ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
}
