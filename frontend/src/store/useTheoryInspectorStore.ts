import { create } from "zustand";
import type { TheoryInspectorMessage } from "@/components/organisms/TheoryInspectorPanel";
import type { IdeaAction } from "@/lib/ai/ideaActionSchema";
import type { ScoreIssueHighlight } from "@/lib/music/inspectorTypes";
import type { SlotTraceEntry } from "@/lib/music/theoryInspectorBaseline";
import type { AuditedSlot } from "@/lib/music/theoryInspectorSlots";
import type { TheoryInspectorMode } from "@/lib/music/theoryInspectorMode";
import { mergeAiChatTags } from "@/lib/ai/theoryInspectorTags";

export type InspectorPanelTab = "explanation" | "chat";

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
  /** Parsed from tutor reply after <<<SUGGESTIONS>>> */
  aiSuggestions?: string;
  /** Optional structured pitch edits after <<<IDEA_ACTIONS>>> */
  ideaActions?: IdeaAction[];
  /** Per-action accept/reject for ideaActions (key = action id) */
  ideaActionStatuses?: Record<string, "pending" | "accepted" | "rejected">;

  insightKind: NoteInsightKind;
  currentPitch: string;
  /** Harmony note: pitch at generation; null if unknown / melody / user-added */
  originalEnginePitch: string | null;
  userModifiedPitch: boolean;
  /** Block A: why the engine emitted originalEnginePitch (omit for melody-guide) */
  engineOriginExplanation?: string;
  /** Block B: how this moment sits in the live score (full notation: pitch, rhythm, voicing) */
  currentPitchGuideExplanation: string;
  /** When user changed pitch: FACT line for tutor */
  pitchEditDeltaLine?: string;
}

/** What the user focused for Theory Inspector chat context (note, bar, or staff). */
export type InspectorScoreFocus =
  | { kind: "note"; insight: NoteInsight }
  | {
      kind: "measure";
      measureIndex: number;
      /** When set, focus is this bar on one staff only (highlights + FACTs). */
      partId?: string;
      evidenceLines: string[];
      noteIds: string[];
    }
  | {
      kind: "part";
      partId: string;
      partName: string;
      evidenceLines: string[];
      noteIds: string[];
    };

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

  /** From GET /api/theory-inspector when OPENAI_* looks misconfigured (e.g. model in API key slot). */
  openAiConfigHint: string | null;
  setOpenAiConfigHint: (v: string | null) => void;

  /** User-stated musical goal for the current session (Iter1 §3). Empty = not set. */
  musicalGoal: string;
  setMusicalGoal: (goal: string) => void;

  /** Progressive-disclosure toggle for the note panel rationale stack (Iter1 §3 / Iter2 §3). */
  showInspectorRationale: boolean;
  setShowInspectorRationale: (v: boolean) => void;

  issueHighlights: ScoreIssueHighlight[];
  setIssueHighlights: (highlights: ScoreIssueHighlight[]) => void;
  clearIssueHighlights: () => void;

  selectedNoteInsight: NoteInsight | null;
  setSelectedNoteInsight: (insight: NoteInsight | null) => void;
  /** Merge into current note insight (no-op if none selected). */
  patchSelectedNoteInsight: (patch: Partial<NoteInsight>) => void;

  inspectorScoreFocus: InspectorScoreFocus | null;
  setInspectorScoreFocus: (focus: InspectorScoreFocus | null) => void;

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

  inspectorActiveTab: InspectorPanelTab;
  setInspectorActiveTab: (tab: InspectorPanelTab) => void;

  /** AI-suggested chat tags (seeds are constants in UI). Max 3 after merge. */
  aiChatTags: string[];
  addAiChatTags: (tags: string[]) => void;
  removeAiChatTag: (tag: string) => void;
  /** Tags hidden for this session (× on strip). */
  dismissedChatTags: string[];
  dismissChatTag: (tag: string) => void;

  /**
   * When false (default), Stylist / apply ignores LLM `suggestedDuration` so the user’s
   * notated phrasing is preserved (Iteration 7). When true, duration edits may apply.
   */
  allowRhythmInSuggestions: boolean;
  setAllowRhythmInSuggestions: (v: boolean) => void;
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

    openAiConfigHint: null,
    setOpenAiConfigHint: (openAiConfigHint) => set({ openAiConfigHint }),

    musicalGoal: "",
    setMusicalGoal: (musicalGoal) => set({ musicalGoal }),

    showInspectorRationale: false,
    setShowInspectorRationale: (showInspectorRationale) => set({ showInspectorRationale }),

    issueHighlights: [],
    setIssueHighlights: (issueHighlights) => set({ issueHighlights }),
    clearIssueHighlights: () => set({ issueHighlights: [] }),

    selectedNoteInsight: null,
    setSelectedNoteInsight: (insight) =>
      set((s) => {
        if (insight) {
          return {
            selectedNoteInsight: insight,
            inspectorScoreFocus: { kind: "note", insight },
          };
        }
        return {
          selectedNoteInsight: null,
          inspectorScoreFocus:
            s.inspectorScoreFocus?.kind === "note" ? null : s.inspectorScoreFocus,
        };
      }),

    patchSelectedNoteInsight: (patch) =>
      set((s) => {
        const cur = s.selectedNoteInsight;
        if (!cur) return s;
        const next = { ...cur, ...patch };
        return {
          selectedNoteInsight: next,
          inspectorScoreFocus:
            s.inspectorScoreFocus?.kind === "note"
              ? { kind: "note", insight: next }
              : s.inspectorScoreFocus,
        };
      }),

    inspectorScoreFocus: null,
    setInspectorScoreFocus: (focus) =>
      set({
        inspectorScoreFocus: focus,
        selectedNoteInsight: focus?.kind === "note" ? focus.insight : null,
      }),

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

    inspectorActiveTab: "explanation",
    setInspectorActiveTab: (inspectorActiveTab) => set({ inspectorActiveTab }),

    aiChatTags: [],
    addAiChatTags: (incoming) =>
      set((s) => ({
        aiChatTags: mergeAiChatTags(s.aiChatTags, incoming),
      })),
    removeAiChatTag: (tag) =>
      set((s) => ({
        aiChatTags: s.aiChatTags.filter((t) => t !== tag),
      })),
    dismissedChatTags: [],
    dismissChatTag: (tag) =>
      set((s) =>
        s.dismissedChatTags.includes(tag)
          ? s
          : { dismissedChatTags: [...s.dismissedChatTags, tag] },
      ),

    allowRhythmInSuggestions: false,
    setAllowRhythmInSuggestions: (allowRhythmInSuggestions) => set({ allowRhythmInSuggestions }),
  }),
);
