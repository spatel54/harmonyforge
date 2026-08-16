/**
 * Persisted palette sections shown on the note-selection popover (0–3).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  clampPopoverSectionIds,
  DEFAULT_POPOVER_SECTION_IDS,
  MAX_POPOVER_SECTIONS,
} from "@/lib/palettes/paletteRegistry";

export interface NotePalettePopoverState {
  /** Ordered section ids (max 3) shown when a note is selected. */
  sectionIds: string[];
  /** Add if under cap, remove if present; no-op add at cap. */
  toggleSection: (id: string) => void;
  /** Replace the full set (clamped). */
  setSectionIds: (ids: string[]) => void;
  isSectionEnabled: (id: string) => boolean;
  /** True when the section is already chosen or another slot is free. */
  canAddSection: (id: string) => boolean;
}

export const useNotePalettePopoverStore = create<NotePalettePopoverState>()(
  persist(
    (set, get) => ({
      sectionIds: [...DEFAULT_POPOVER_SECTION_IDS],
      toggleSection: (id) => {
        const current = get().sectionIds;
        if (current.includes(id)) {
          set({ sectionIds: current.filter((x) => x !== id) });
          return;
        }
        if (current.length >= MAX_POPOVER_SECTIONS) return;
        set({ sectionIds: clampPopoverSectionIds([...current, id]) });
      },
      setSectionIds: (ids) => set({ sectionIds: clampPopoverSectionIds(ids) }),
      isSectionEnabled: (id) => get().sectionIds.includes(id),
      canAddSection: (id) => {
        const current = get().sectionIds;
        if (current.includes(id)) return true;
        return current.length < MAX_POPOVER_SECTIONS;
      },
    }),
    {
      name: "harmonyforge-note-palette-popover",
      partialize: (state) => ({ sectionIds: state.sectionIds }),
      merge: (persisted, current) => {
        const raw = (persisted as Partial<NotePalettePopoverState> | undefined)?.sectionIds;
        return {
          ...current,
          sectionIds: clampPopoverSectionIds(raw ?? DEFAULT_POPOVER_SECTION_IDS),
        };
      },
    },
  ),
);
