import { create } from "zustand";
import type {
  SuggestionBatch,
  ScoreCorrection,
  CorrectionStatus,
} from "@/lib/music/suggestionTypes";

export interface SuggestionState {
  batches: SuggestionBatch[];
  correctionStatuses: Record<string, CorrectionStatus>;
  activeBatchId: string | null;
  isLoading: boolean;

  addBatch: (batch: SuggestionBatch) => void;
  acceptCorrection: (correctionId: string) => void;
  rejectCorrection: (correctionId: string) => void;
  acceptAll: (batchId: string) => void;
  rejectAll: (batchId: string) => void;
  clearBatch: (batchId: string) => void;
  setActiveBatch: (batchId: string | null) => void;
  setIsLoading: (v: boolean) => void;

  /** Get all pending corrections for the active batch. */
  getPendingCorrections: () => ScoreCorrection[];
}

export const useSuggestionStore = create<SuggestionState>((set, get) => ({
  batches: [],
  correctionStatuses: {},
  activeBatchId: null,
  isLoading: false,

  addBatch: (batch) =>
    set((s) => {
      // Auto-reject older pending corrections for the same notes
      const newNoteIds = new Set(batch.corrections.map((c) => c.noteId));
      const updatedStatuses = { ...s.correctionStatuses };
      for (const existing of s.batches) {
        for (const c of existing.corrections) {
          if (
            newNoteIds.has(c.noteId) &&
            updatedStatuses[c.id] !== "accepted"
          ) {
            updatedStatuses[c.id] = "rejected";
          }
        }
      }
      // Initialize new corrections as pending
      for (const c of batch.corrections) {
        updatedStatuses[c.id] = "pending";
      }
      return {
        batches: [...s.batches, batch],
        correctionStatuses: updatedStatuses,
        activeBatchId: batch.id,
      };
    }),

  acceptCorrection: (correctionId) =>
    set((s) => ({
      correctionStatuses: {
        ...s.correctionStatuses,
        [correctionId]: "accepted",
      },
    })),

  rejectCorrection: (correctionId) =>
    set((s) => ({
      correctionStatuses: {
        ...s.correctionStatuses,
        [correctionId]: "rejected",
      },
    })),

  acceptAll: (batchId) =>
    set((s) => {
      const batch = s.batches.find((b) => b.id === batchId);
      if (!batch) return s;
      const updated = { ...s.correctionStatuses };
      for (const c of batch.corrections) {
        if (updated[c.id] === "pending") {
          updated[c.id] = "accepted";
        }
      }
      return { correctionStatuses: updated };
    }),

  rejectAll: (batchId) =>
    set((s) => {
      const batch = s.batches.find((b) => b.id === batchId);
      if (!batch) return s;
      const updated = { ...s.correctionStatuses };
      for (const c of batch.corrections) {
        if (updated[c.id] === "pending") {
          updated[c.id] = "rejected";
        }
      }
      return { correctionStatuses: updated };
    }),

  clearBatch: (batchId) =>
    set((s) => ({
      batches: s.batches.filter((b) => b.id !== batchId),
      activeBatchId:
        s.activeBatchId === batchId ? null : s.activeBatchId,
    })),

  setActiveBatch: (activeBatchId) => set({ activeBatchId }),
  setIsLoading: (isLoading) => set({ isLoading }),

  getPendingCorrections: () => {
    const { batches, correctionStatuses, activeBatchId } = get();
    if (!activeBatchId) return [];
    const batch = batches.find((b) => b.id === activeBatchId);
    if (!batch) return [];
    return batch.corrections.filter(
      (c) => correctionStatuses[c.id] === "pending",
    );
  },
}));
