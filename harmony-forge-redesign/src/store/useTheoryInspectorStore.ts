import { create } from "zustand";
import type { TheoryInspectorMessage } from "@/components/organisms/TheoryInspectorPanel";
import type { ScoreIssueHighlight } from "@/lib/music/inspectorTypes";

export type Persona = "auditor" | "tutor" | "stylist";
export type Genre = "classical" | "jazz" | "pop";

export interface ValidationViolations {
  parallelFifths: number;
  parallelOctaves: number;
  rangeViolations: number;
  spacingViolations: number;
  voiceOrderViolations: number;
  voiceOverlapViolations: number;
}

export interface ValidationResult {
  violations: ValidationViolations;
  totalSlots: number;
  her: number;
  valid: boolean;
}

export interface NoteInsight {
  noteId: string;
  noteLabel: string;
  voice: string;
  slotIndex: number;
  source: "engine-trace" | "local-fallback";
  deterministicExplanation: string;
  evidenceLines: string[];
  aiExplanation?: string;
}

export interface TheoryInspectorState {
  messages: TheoryInspectorMessage[];
  addMessage: (msg: TheoryInspectorMessage) => void;
  updateMessage: (id: string, patch: Partial<TheoryInspectorMessage>) => void;
  clearMessages: () => void;

  persona: Persona;
  setPersona: (p: Persona) => void;

  genre: Genre;
  setGenre: (g: Genre) => void;

  isStreaming: boolean;
  setIsStreaming: (v: boolean) => void;
  streamingMessageId: string | null;
  setStreamingMessageId: (id: string | null) => void;

  lastValidation: ValidationResult | null;
  setLastValidation: (v: ValidationResult | null) => void;

  inputValue: string;
  setInputValue: (v: string) => void;

  hasApiKey: boolean;
  setHasApiKey: (v: boolean) => void;

  issueHighlights: ScoreIssueHighlight[];
  setIssueHighlights: (highlights: ScoreIssueHighlight[]) => void;
  clearIssueHighlights: () => void;

  selectedNoteInsight: NoteInsight | null;
  setSelectedNoteInsight: (insight: NoteInsight | null) => void;
}

export const useTheoryInspectorStore = create<TheoryInspectorState>(
  (set) => ({
    messages: [],
    addMessage: (msg) =>
      set((s) => ({ messages: [...s.messages, msg] })),
    updateMessage: (id, patch) =>
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === id ? { ...m, ...patch } : m,
        ),
      })),
    clearMessages: () => set({ messages: [] }),

    persona: "tutor",
    setPersona: (persona) => set({ persona }),

    genre: "classical",
    setGenre: (genre) => set({ genre }),

    isStreaming: false,
    setIsStreaming: (isStreaming) => set({ isStreaming }),
    streamingMessageId: null,
    setStreamingMessageId: (streamingMessageId) => set({ streamingMessageId }),

    lastValidation: null,
    setLastValidation: (lastValidation) => set({ lastValidation }),

    inputValue: "",
    setInputValue: (inputValue) => set({ inputValue }),

    hasApiKey: false,
    setHasApiKey: (hasApiKey) => set({ hasApiKey }),

    issueHighlights: [],
    setIssueHighlights: (issueHighlights) => set({ issueHighlights }),
    clearIssueHighlights: () => set({ issueHighlights: [] }),

    selectedNoteInsight: null,
    setSelectedNoteInsight: (selectedNoteInsight) => set({ selectedNoteInsight }),
  }),
);
