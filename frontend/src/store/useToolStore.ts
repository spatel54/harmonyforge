import { create } from "zustand";
import type { NoteSelection } from "./useScoreStore";

export interface ToolState {
  activeTool: string | null;
  selection: NoteSelection[];
  setActiveTool: (toolId: string | null) => void;
  setSelection: (selection: NoteSelection[]) => void;
  toggleNoteSelection: (sel: NoteSelection, shiftKey: boolean) => void;
  clearSelection: () => void;
}

export const useToolStore = create<ToolState>((set, get) => ({
  activeTool: null,
  selection: [],
  setActiveTool: (activeTool) => set({ activeTool }),
  setSelection: (selection) => set({ selection }),
  toggleNoteSelection: (sel, shiftKey) => {
    const { selection } = get();
    const exists = selection.some(
      (s) =>
        s.partId === sel.partId &&
        s.measureIndex === sel.measureIndex &&
        s.noteIndex === sel.noteIndex
    );
    if (shiftKey) {
      if (exists) {
        set({
          selection: selection.filter(
            (s) =>
              !(
                s.partId === sel.partId &&
                s.measureIndex === sel.measureIndex &&
                s.noteIndex === sel.noteIndex
              )
          ),
        });
      } else {
        set({ selection: [...selection, sel] });
      }
    } else {
      set({ selection: [sel] });
    }
  },
  clearSelection: () => set({ selection: [] }),
}));
