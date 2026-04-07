import { create } from "zustand";

/**
 * Sandbox registers inspector/export setters so CoachmarkOverlay can open panels during the tour.
 * Cleared on sandbox unmount.
 */
interface SandboxTourBridgeState {
  setInspectorOpen: ((open: boolean) => void) | null;
  setExportModalOpen: ((open: boolean) => void) | null;
  register: (handlers: {
    setInspectorOpen: (open: boolean) => void;
    setExportModalOpen: (open: boolean) => void;
  }) => void;
  unregister: () => void;
}

export const useSandboxTourBridge = create<SandboxTourBridgeState>((set) => ({
  setInspectorOpen: null,
  setExportModalOpen: null,
  register: (handlers) =>
    set({
      setInspectorOpen: handlers.setInspectorOpen,
      setExportModalOpen: handlers.setExportModalOpen,
    }),
  unregister: () => set({ setInspectorOpen: null, setExportModalOpen: null }),
}));
