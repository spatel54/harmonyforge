import { create } from "zustand";
import type { TheoryInspectorMessage } from "@/components/organisms/TheoryInspectorPanel";
import type { ScoreIssueHighlight } from "@/lib/music/inspectorTypes";
import type { SlotTraceEntry } from "@/lib/music/theoryInspectorBaseline";
import type { AuditedSlot } from "@/lib/music/theoryInspectorSlots";
import type { TheoryInspectorMode } from "@/lib/music/theoryInspectorMode";

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

export type NoteInsightKind =
  | "harmony-with-provenance"
  | "harmony-no-provenance"
  | "melody-guide";

export type { TheoryInspectorMode };

export interface NoteInsight {
  noteId: string;
  noteLabel: string;
  voice: string;
  slotIndex: number;
  /** Product mode: origin snapshot vs live harmonic guide vs melody-only context. */
  inspectorMode: TheoryInspectorMode;
  source: "engine-trace" | "local-fallback";
  /** Combined blocks for legacy consumers / search */
  deterministicExplanation: string;
  evidenceLines: string[];
  aiExplanation?: string;

  insightKind: NoteInsightKind;
  currentPitch: string;
  /** Harmony note: pitch at generation; null if unknown / melody / user-added */
  originalEnginePitch: string | null;
  userModifiedPitch: boolean;
  /** Block A: why the engine emitted originalEnginePitch (omit for melody-guide) */
  engineOriginExplanation?: string;
  /** Block B: how current pitch sits in the live score (pitch-only) */
  currentPitchGuideExplanation: string;
  /** When user changed pitch: FACT line for tutor */
  pitchEditDeltaLine?: string;
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

  /** Harmony part note ids → pitch when generated score was first loaded */
  generationBaselineHarmonyPitches: Record<string, string>;
  /** Cached validate-satb-trace per slot at generation (SATB layouts only) */
  generationBaselineSatbTrace: SlotTraceEntry[] | null;
  /** Audited slots at baseline capture (same indexing as live scoreToAuditedSlots when structure unchanged) */
  generationBaselineAuditedSlots: AuditedSlot[] | null;
  setGenerationBaseline: (payload: {
    harmonyNotePitches: Record<string, string>;
    satbTrace: SlotTraceEntry[] | null;
    baselineAuditedSlots: AuditedSlot[] | null;
  }) => void;
  clearGenerationBaseline: () => void;
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

    generationBaselineHarmonyPitches: {},
    generationBaselineSatbTrace: null,
    generationBaselineAuditedSlots: null,
    setGenerationBaseline: (payload) =>
      set({
        generationBaselineHarmonyPitches: payload.harmonyNotePitches,
        generationBaselineSatbTrace: payload.satbTrace,
        generationBaselineAuditedSlots: payload.baselineAuditedSlots,
      }),
    clearGenerationBaseline: () =>
      set({
        generationBaselineHarmonyPitches: {},
        generationBaselineSatbTrace: null,
        generationBaselineAuditedSlots: null,
      }),
  }),
);
