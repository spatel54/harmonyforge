import { create } from "zustand";

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
}

interface SandboxState {
  // Context Menu
  contextMenu: ContextMenuState;
  openContextMenu: (x: number, y: number) => void;
  closeContextMenu: () => void;
}

export const useSandboxStore = create<SandboxState>((set) => ({
  contextMenu: {
    isOpen: false,
    x: 0,
    y: 0,
  },
  openContextMenu: (x: number, y: number) =>
    set({ contextMenu: { isOpen: true, x, y } }),
  closeContextMenu: () =>
    set((state) => ({
      contextMenu: { ...state.contextMenu, isOpen: false },
    })),
}));
