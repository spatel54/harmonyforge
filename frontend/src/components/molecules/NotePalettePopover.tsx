"use client";

import React from "react";
import { Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaletteButton } from "@/components/atoms/PaletteButton";
import {
  getPaletteSectionById,
  MAX_POPOVER_SECTIONS,
  PALETTE_SECTIONS,
  type PaletteItem,
} from "@/lib/palettes/paletteRegistry";
import type { NotePosition } from "@/lib/music/scoreTypes";
import { useNotePalettePopoverStore } from "@/store/useNotePalettePopoverStore";

export interface NotePalettePopoverProps {
  selectionCount: number;
  notePositions: NotePosition[];
  selectedNoteIds: ReadonlySet<string>;
  hasSelection: boolean;
  onActivate: (toolId: string, item: PaletteItem) => void;
  containerRef: React.RefObject<HTMLElement | null>;
  className?: string;
}

const POPOVER_MARGIN = 8;
const MIN_POPOVER_HEIGHT = 160;

export function computePopoverLayout(
  anchor: NotePosition,
  containerSize: { width: number; height: number },
  popoverWidth: number,
): { left: number; top: number; maxHeight: number } {
  const { width: cw, height: ch } = containerSize;
  const spaceBelow = ch - (anchor.y + anchor.h) - POPOVER_MARGIN;
  const spaceAbove = anchor.y - POPOVER_MARGIN;
  const placeBelow = spaceBelow >= spaceAbove;

  let maxHeight = Math.max(0, placeBelow ? spaceBelow : spaceAbove);
  let top = placeBelow
    ? anchor.y + anchor.h + POPOVER_MARGIN
    : anchor.y - maxHeight - POPOVER_MARGIN;

  if (top < POPOVER_MARGIN) {
    maxHeight -= POPOVER_MARGIN - top;
    top = POPOVER_MARGIN;
  }
  if (top + maxHeight > ch - POPOVER_MARGIN) {
    maxHeight = ch - POPOVER_MARGIN - top;
  }
  maxHeight = Math.max(0, maxHeight);

  let left = anchor.x + anchor.w / 2 - popoverWidth / 2;
  left = Math.max(POPOVER_MARGIN, Math.min(left, cw - popoverWidth - POPOVER_MARGIN));

  return { left, top, maxHeight };
}

/**
 * Compact palette popover anchored to the first selected note.
 * Shows 0–3 user-chosen palette sections; gear opens an inline section picker.
 * Height is capped to the editor so all chosen sections stay reachable via scroll.
 */
export function NotePalettePopover({
  selectionCount,
  notePositions,
  selectedNoteIds,
  hasSelection,
  onActivate,
  containerRef,
  className,
}: NotePalettePopoverProps) {
  const sectionIds = useNotePalettePopoverStore((s) => s.sectionIds);
  const toggleSection = useNotePalettePopoverStore((s) => s.toggleSection);
  const canAddSection = useNotePalettePopoverStore((s) => s.canAddSection);

  const [pickerOpen, setPickerOpen] = React.useState(false);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [layout, setLayout] = React.useState<{ left: number; top: number; maxHeight: number } | null>(
    null,
  );

  const anchorPos = React.useMemo(() => {
    if (selectionCount === 0) return null;
    for (const pos of notePositions) {
      if (selectedNoteIds.has(pos.selection.noteId)) return pos;
    }
    return null;
  }, [notePositions, selectedNoteIds, selectionCount]);

  React.useLayoutEffect(() => {
    if (!anchorPos || !containerRef.current) {
      setLayout(null);
      return;
    }
    const container = containerRef.current;
    const measure = () => {
      const width = popoverRef.current?.offsetWidth ?? 240;
      setLayout(
        computePopoverLayout(
          anchorPos,
          { width: container.clientWidth, height: container.clientHeight },
          width,
        ),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    if (popoverRef.current) ro.observe(popoverRef.current);
    return () => ro.disconnect();
  }, [anchorPos, containerRef, sectionIds, pickerOpen, selectionCount]);

  if (selectionCount === 0 || !anchorPos) return null;

  const sections = sectionIds
    .map((id) => getPaletteSectionById(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div
      ref={popoverRef}
      className={cn(
        "hf-print-hide absolute z-[40] pointer-events-auto",
        "overflow-y-auto overscroll-contain hf-scroll-smooth",
        "rounded-[8px] border border-[var(--hf-detail)]",
        "bg-[var(--hf-panel-bg)] shadow-lg",
        "w-[min(248px,calc(100vw-32px))]",
        className,
      )}
      style={
        layout
          ? { left: layout.left, top: layout.top, maxHeight: layout.maxHeight, touchAction: "pan-y" }
          : {
              left: anchorPos.x,
              top: anchorPos.y + anchorPos.h + POPOVER_MARGIN,
              maxHeight: MIN_POPOVER_HEIGHT,
              visibility: "hidden" as const,
              touchAction: "pan-y",
            }
      }
      role="dialog"
      aria-label="Note palette shortcuts"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="sticky top-0 z-[1] flex items-center justify-between gap-2 px-2 py-1.5 border-b border-[var(--hf-detail)]"
        style={{ backgroundColor: "var(--hf-panel-bg)" }}
      >
        <span
          className="font-mono text-[10px] uppercase tracking-wider opacity-80"
          style={{ color: "var(--hf-text-secondary)" }}
        >
          Quick palettes
        </span>
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          title="Choose palettes for this popover (up to 3)"
          aria-label="Choose palettes for note popover"
          aria-expanded={pickerOpen}
          className={cn(
            "hf-pressable flex items-center gap-1 h-[24px] px-2 rounded-[5px]",
            "border border-[var(--hf-detail)] text-[10px] font-mono",
            "hover:border-[var(--hf-accent)] hover:bg-[color-mix(in_srgb,var(--hf-accent)_10%,transparent)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)]",
          )}
          style={{ color: "var(--hf-text-primary)" }}
        >
          <Settings2 className="w-[12px] h-[12px]" aria-hidden />
          Palettes
        </button>
      </div>

      <div className="min-h-0">
        {pickerOpen && (
          <div className="px-2 py-2 border-b border-[var(--hf-detail)] space-y-1">
            <p
              className="text-[10px] font-mono mb-1.5 opacity-75"
              style={{ color: "var(--hf-text-secondary)" }}
            >
              Up to {MAX_POPOVER_SECTIONS} sections appear when a note is selected.
            </p>
            {PALETTE_SECTIONS.map((section) => {
              const enabled = sectionIds.includes(section.id);
              const canToggle = enabled || canAddSection(section.id);
              return (
                <label
                  key={section.id}
                  className={cn(
                    "flex items-center gap-2 py-0.5 cursor-pointer text-[11px] font-mono",
                    !canToggle && "opacity-50 cursor-not-allowed",
                  )}
                  style={{ color: "var(--hf-text-primary)" }}
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    disabled={!canToggle}
                    onChange={() => toggleSection(section.id)}
                    className="rounded"
                  />
                  {section.label}
                </label>
              );
            })}
            {sectionIds.length >= MAX_POPOVER_SECTIONS && (
              <p className="text-[10px] font-mono pt-1" style={{ color: "var(--hf-text-secondary)" }}>
                Maximum {MAX_POPOVER_SECTIONS} — uncheck one to add another.
              </p>
            )}
          </div>
        )}

        {sections.length === 0 && !pickerOpen && (
          <div className="px-2 py-2">
            <p className="text-[10px] font-mono opacity-75" style={{ color: "var(--hf-text-secondary)" }}>
              No palettes chosen — tap <strong>Palettes</strong> to add up to {MAX_POPOVER_SECTIONS}.
            </p>
          </div>
        )}

        {sections.map((section) => (
          <div key={section.id} className="px-2 py-1.5 border-b border-[var(--hf-detail)] last:border-b-0">
            <div
              className="font-mono text-[9px] uppercase tracking-wider mb-1 opacity-70"
              style={{ color: "var(--hf-text-secondary)" }}
            >
              {section.label}
            </div>
            <div className="grid grid-cols-4 gap-1">
              {section.items.map((item) => (
                <PaletteButton
                  key={item.id}
                  item={item}
                  disabled={Boolean(item.requiresSelection) && !hasSelection}
                  onActivate={(it) => onActivate(it.toolId, it)}
                  className="min-h-[36px] min-w-[36px] px-1 py-1"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
