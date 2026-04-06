import { create } from "zustand";

export interface EditCursor {
  partId: string;
  measureIndex: number;
  beat: number;
  noteIndex: number;
}

interface EditCursorState {
  cursor: EditCursor | null;
  setCursor: (cursor: EditCursor | null) => void;
  clearCursor: () => void;
}

export const useEditCursorStore = create<EditCursorState>((set) => ({
  cursor: null,
  setCursor: (cursor) => set({ cursor }),
  clearCursor: () => set({ cursor: null }),
}));

