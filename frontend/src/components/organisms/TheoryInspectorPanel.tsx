"use client";

import React from "react";
import { X, SendHorizontal, Check, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatBubble } from "@/components/molecules/ChatBubble";
import { describeIntent, type Intent } from "@/lib/ai/intentRouter";
import { MarkdownText } from "@/components/molecules/MarkdownText";
import { ViolationCard } from "@/components/molecules/ViolationCard";
import { QuickReplyChips } from "@/components/molecules/QuickReplyChips";
import { SuggestionCard } from "@/components/molecules/SuggestionCard";
import type { ScoreCorrection, CorrectionStatus } from "@/lib/music/suggestionTypes";
import type {
  InspectorScoreFocus,
  NoteInsight,
} from "@/store/useTheoryInspectorStore";
import { useTheoryInspectorStore } from "@/store/useTheoryInspectorStore";
import { isMinimalSuggestionExplanation } from "@/lib/study/studyConfig";
import type { IdeaAction } from "@/lib/ai/ideaActionSchema";
import { CHAT_SEED_TAG_PROMPTS } from "@/lib/ai/theoryInspectorTags";
import { useScoreStore } from "@/store/useScoreStore";
import {
  collectNonRestPitchesInMeasure,
  measureRangeForLocalizedHarmonyRegenerate,
} from "@/lib/music/scoreUtils";
import type { NoteSelection } from "@/store/useScoreStore";

const AI_MODAL_KEY = "hf-inspector-ai-modal-seen";

export type EditFocusedRegionPayload =
  | { scope: "measure"; measureIndex: number; lockedPitches: string[] }
  | { scope: "part"; partId: string; partName: string };

export interface TheoryInspectorMessage {
  id: string;
  type: "system" | "user" | "ai" | "violation" | "divider" | "chips" | "suggestion" | "evidence";
  content?: string;
  timestamp?: string;
  violationType?: string;
  chips?: string[];
  suggestionBatchId?: string;
  /**
   * Parsed `<<<INTENT>>>` JSON from the tutor stream (app actions the user
   * asked for that need confirmation). Surfaced as a confirmation bubble.
   */
  intent?: import("@/lib/ai/intentRouter").Intent | null;
}

export interface TheoryInspectorPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  messages?: TheoryInspectorMessage[];
  noteInsight?: NoteInsight | null;
  /** Measure or whole-part focus when no single-note card is shown */
  inspectorScoreFocus?: InspectorScoreFocus | null;
  inputValue?: string;
  isStreaming?: boolean;
  /** When set with isStreaming, shows chat typing dots (note-insight streams clear this id). */
  streamingMessageId?: string | null;
  onInputChange?: (value: string) => void;
  onSend?: () => void;
  onChipClick?: (chip: string) => void;
  onExplainMore?: (msgId: string) => void;
  onSuggestFix?: (msgId: string) => void;
  onNewChat?: () => void;
  onHistory?: () => void;
  onClose?: () => void;
  /** Suggestion card support */
  suggestionBatches?: Map<
    string,
    { corrections: ScoreCorrection[]; summary: string; musicalAlternatives?: import("@/lib/music/suggestionTypes").MusicalAlternativeHint[] }
  >;
  /** Run structured Stylist pass (same as violation “suggest fix”). */
  onRequestStylist?: () => void;
  correctionStatuses?: Record<string, CorrectionStatus>;
  onAcceptCorrection?: (correctionId: string) => void;
  onRejectCorrection?: (correctionId: string) => void;
  onAcceptAllCorrections?: (batchId: string) => void;
  onRejectAllCorrections?: (batchId: string) => void;
  /** Apply tutor <<<IDEA_ACTIONS>>> pitch edits */
  onAcceptIdeaAction?: (action: IdeaAction) => void;
  onRejectIdeaAction?: (action: IdeaAction) => void;
  /** Fires when a starter prompt chip is clicked (text passed verbatim to chat). */
  onStarterPromptClick?: (prompt: string) => void;
  /** Measure focus: classical localized regenerate hook (backend optional). */
  onEditFocusedRegion?: (payload: EditFocusedRegionPayload) => void;
  /** Current editor note selection (sandbox) — drives multi-bar regenerate label and range. */
  editorSelection?: NoteSelection[];
  /** Accept a tutor INTENT (mood/genre/pickup/regenerate/navigation). */
  onApplyIntent?: (msgId: string, intent: import("@/lib/ai/intentRouter").Intent) => void;
  /** Dismiss an INTENT confirmation bubble without applying it. */
  onDismissIntent?: (msgId: string) => void;
  /** Fired when user clicks a bold keyword in AI explanations — for note highlighting. */
  onKeywordClick?: (keyword: string) => void;
  /** Sandbox: dock inspector as right column vs floating card (full-width score). */
  inspectorDockMode?: "sidebar" | "floating";
  onInspectorDockModeChange?: (mode: "sidebar" | "floating") => void;
  /** Floating layout: drag the panel by the header (parent handles pointer + position). */
  floatingHeaderDrag?: {
    onPointerDown: React.PointerEventHandler<HTMLDivElement>;
    className?: string;
    title?: string;
  };
}

/**
 * TheoryInspectorPanel Organism
 * Pencil Node: qmx1U ("TheoryInspectorPanel") — 380×884px right column.
 *
 * Spec:
 *   layout:vertical  fill:$neutral-50  stroke:$sonata-detail @1  r:4
 *
 *   PanelHeader (99E9J): h:52  gap:8  pad:[0,12]  jc:space_between  ai:center
 *     fill:$sonata-surface  (solid cherry red)
 *     panelTitle: Instrument Serif fs:16  fill:$neutral-50
 *     spacer: fill_container
 *     newChatBtn, historyBtn, CloseBtn: 28×28  r:4  fill:#00000030
 *       icons: 14×14  fill:$neutral-50
 *
 *   ChatArea (ra6HT): fill_container  layout:vertical  gap:8  pad:16
 *
 *   ChatInputBar (CaIdi): h:60  gap:8  pad:[0,12]  ai:center
 *     fill:$sonata-bg  stroke top:1 $sonata-detail
 *     inputField: fill_container h:36  pad:[0,12]  fill:$neutral-50  stroke:$sonata-detail @1  r:4
 *     sendBtn: 36×36  r:4  fill:$sonata-surface
 */
export const TheoryInspectorPanel = React.forwardRef<
  HTMLDivElement,
  TheoryInspectorPanelProps
>(
  (
    {
      messages = [],
      noteInsight,
      inspectorScoreFocus = null,
      inputValue = "",
      isStreaming = false,
      streamingMessageId = null,
      onInputChange,
      onSend,
      onChipClick,
      onExplainMore,
      onSuggestFix,
      onClose,
      suggestionBatches,
      correctionStatuses = {},
      onAcceptCorrection,
      onRejectCorrection,
      onAcceptAllCorrections,
      onRejectAllCorrections,
      onRequestStylist,
      onAcceptIdeaAction,
      onRejectIdeaAction,
      onStarterPromptClick,
      onEditFocusedRegion,
      editorSelection = [],
      onApplyIntent,
      onDismissIntent,
      onKeywordClick,
      inspectorDockMode,
      onInspectorDockModeChange,
      floatingHeaderDrag,
      className,
      ...props
    },
    ref,
  ) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const localizedRegenerateRange = React.useMemo(() => {
      if (!inspectorScoreFocus || inspectorScoreFocus.kind !== "measure") return null;
      return measureRangeForLocalizedHarmonyRegenerate(
        editorSelection,
        inspectorScoreFocus.measureIndex,
      );
    }, [inspectorScoreFocus, editorSelection]);
    const localizedRegenerateLabel =
      localizedRegenerateRange &&
      localizedRegenerateRange.startMeasure !== localizedRegenerateRange.endMeasure
        ? `Regenerate bars ${localizedRegenerateRange.startMeasure + 1}–${localizedRegenerateRange.endMeasure + 1}`
        : "Regenerate this bar";
    const tutorEnabled = useTheoryInspectorStore((s) => s.hasApiKey);
    const openAiConfigHint = useTheoryInspectorStore((s) => s.openAiConfigHint);
    const showInspectorRationale = useTheoryInspectorStore((s) => s.showInspectorRationale);
    const setShowInspectorRationale = useTheoryInspectorStore(
      (s) => s.setShowInspectorRationale,
    );
    const inspectorActiveTab = useTheoryInspectorStore((s) => s.inspectorActiveTab);
    const setInspectorActiveTab = useTheoryInspectorStore((s) => s.setInspectorActiveTab);
    const aiChatTags = useTheoryInspectorStore((s) => s.aiChatTags);
    const dismissChatTag = useTheoryInspectorStore((s) => s.dismissChatTag);
    const dismissedChatTags = useTheoryInspectorStore((s) => s.dismissedChatTags);
    const score = useScoreStore((s) => s.score);
    const allowRhythmInSuggestions = useTheoryInspectorStore((s) => s.allowRhythmInSuggestions);
    const setAllowRhythmInSuggestions = useTheoryInspectorStore(
      (s) => s.setAllowRhythmInSuggestions,
    );
    const proactiveAlternativesEnabled = useTheoryInspectorStore(
      (s) => s.proactiveAlternativesEnabled,
    );
    const setProactiveAlternativesEnabled = useTheoryInspectorStore(
      (s) => s.setProactiveAlternativesEnabled,
    );

    // AI first-visit modal
    const [showAiModal, setShowAiModal] = React.useState(false);
    React.useEffect(() => {
      if (typeof window === "undefined") return;
      if (!localStorage.getItem(AI_MODAL_KEY)) setShowAiModal(true);
    }, []);
    const dismissAiModal = React.useCallback(() => {
      setShowAiModal(false);
      if (typeof window !== "undefined") localStorage.setItem(AI_MODAL_KEY, "1");
    }, []);

    const suppressSuggestionProse = isMinimalSuggestionExplanation();
    const chatInputLocked = isStreaming && streamingMessageId != null;
    const visibleChatTags = React.useMemo(() => {
      const seeds = [...CHAT_SEED_TAG_PROMPTS];
      const dyn = aiChatTags.filter((t) => !dismissedChatTags.includes(t));
      const s = seeds.filter((t) => !dismissedChatTags.includes(t));
      return [...s, ...dyn];
    }, [aiChatTags, dismissedChatTags]);

    const violationMessages = messages.filter((m) => m.type === "violation");
    const suggestionMessages = messages.filter((m) => m.type === "suggestion");

    const renderChatMessage = (
      msg: TheoryInspectorMessage,
      mode: "full" | "chatStream",
    ): React.ReactNode => {
      if (
        mode === "chatStream" &&
        (msg.type === "violation" || msg.type === "suggestion")
      ) {
        return null;
      }
      switch (msg.type) {
        case "divider":
          return (
            <div key={msg.id} className="flex items-center gap-[8px]">
              <div
                className="flex-1 h-[1px]"
                style={{ backgroundColor: "var(--hf-detail)" }}
              />
              <span
                className="font-mono text-[9px] font-normal shrink-0"
                style={{ color: "var(--hf-text-secondary)" }}
              >
                {msg.content}
              </span>
              <div
                className="flex-1 h-[1px]"
                style={{ backgroundColor: "var(--hf-detail)" }}
              />
            </div>
          );
        case "system":
          return (
            <ChatBubble
              key={msg.id}
              variant="system"
              content={msg.content ?? ""}
              timestamp={msg.timestamp}
            />
          );
        case "violation":
          return (
            <ViolationCard
              key={msg.id}
              violationType={msg.violationType}
              body={msg.content}
              timestamp={msg.timestamp}
              onExplainMore={() => onExplainMore?.(msg.id)}
              onSuggestFix={() => onSuggestFix?.(msg.id)}
            />
          );
        case "user":
          return (
            <ChatBubble
              key={msg.id}
              variant="user"
              content={msg.content ?? ""}
              timestamp={msg.timestamp}
            />
          );
        case "ai":
          return (
            <React.Fragment key={msg.id}>
              <ChatBubble
                variant="ai"
                content={msg.content ?? ""}
                timestamp={msg.timestamp}
              />
              {msg.intent ? (
                <IntentConfirmationBubble
                  messageId={msg.id}
                  intent={msg.intent}
                  onApply={onApplyIntent}
                  onDismiss={onDismissIntent}
                />
              ) : null}
            </React.Fragment>
          );
        case "chips":
          return (
            <QuickReplyChips
              key={msg.id}
              chips={msg.chips}
              onChipClick={onChipClick}
            />
          );
        case "evidence":
          return (
            <div
              key={msg.id}
              className="rounded-[6px] p-[10px] text-[11px] leading-[1.45]"
              style={{
                backgroundColor: "color-mix(in srgb, var(--hf-accent) 8%, transparent)",
                border: "1px solid var(--hf-detail)",
                color: "var(--hf-text-primary)",
              }}
            >
              <div
                className="font-mono text-[10px] mb-[6px]"
                style={{ color: "var(--hf-text-secondary)" }}
              >
                Engine Evidence
              </div>
              <pre
                className="m-0 whitespace-pre-wrap break-words font-mono text-[11px]"
                style={{ color: "var(--hf-text-primary)" }}
              >
                {msg.content ?? ""}
              </pre>
            </div>
          );
        case "suggestion": {
          const batchId = msg.suggestionBatchId;
          const batch = batchId ? suggestionBatches?.get(batchId) : undefined;
          if (!batch) return null;
          return (
            <SuggestionCard
              key={msg.id}
              corrections={batch.corrections}
              correctionStatuses={correctionStatuses}
              summary={batch.summary}
              musicalAlternatives={batch.musicalAlternatives}
              suppressProseSummary={suppressSuggestionProse}
              timestamp={msg.timestamp}
              onAcceptCorrection={(id) => onAcceptCorrection?.(id)}
              onRejectCorrection={(id) => onRejectCorrection?.(id)}
              onAcceptAll={() => onAcceptAllCorrections?.(batchId!)}
              onRejectAll={() => onRejectAllCorrections?.(batchId!)}
            />
          );
        }
        default:
          return null;
      }
    };

    // Near-bottom guard: only auto-scroll when the user is already close to the bottom.
    React.useLayoutEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      const distance = el.scrollHeight - (el.scrollTop + el.clientHeight);
      if (distance < 120 || isStreaming) {
        el.scrollTop = el.scrollHeight;
      }
    }, [isStreaming, inspectorActiveTab, messages.length, noteInsight]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend?.();
      }
    };

    const headerIconBtn =
      "hf-pressable flex items-center justify-center w-[28px] h-[28px] rounded-[4px] shrink-0 transition-[transform,background-color,opacity] hover:bg-black/30 active:bg-black/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70";

    return (
      <div
        ref={ref}
        className={cn(
          "hf-inspector-panel-depth flex flex-col h-full overflow-hidden rounded-[4px]",
          className,
        )}
        style={{
          backgroundColor: "var(--hf-panel-bg)",
          boxShadow: "0 2px 20px color-mix(in srgb, var(--hf-detail) 22%, transparent)",
          borderLeft: "1px solid color-mix(in srgb, var(--hf-detail) 65%, transparent)",
          position: "relative",
        }}
        role="complementary"
        aria-label="Theory Inspector — note explainability"
        {...props}
      >
        {/* ── Panel Header — Node 99E9J ──────────────────────
            fill:$sonata-surface (solid cherry red)
            gap:8  pad:[0,12]  h:52  jc:space_between  ai:center   */}
        <div
          className={cn(
            "flex items-center gap-[8px] w-full min-h-[52px] py-[6px] px-[12px] shrink-0",
            floatingHeaderDrag?.className,
          )}
          style={{ backgroundColor: "var(--hf-surface)" }}
          onPointerDown={floatingHeaderDrag?.onPointerDown}
          title={floatingHeaderDrag?.title}
        >
          {/* Title block */}
          <div className="flex flex-col justify-center gap-[1px] min-w-0">
            <span
              className="font-serif text-[16px] font-normal leading-none"
              style={{ color: "var(--neutral-50)" }}
            >
              Theory Inspector
            </span>
            <span
              className="font-body text-[10px] font-normal leading-tight truncate"
              style={{ color: "rgba(255, 252, 250, 0.92)" }}
              title="Click any note: harmony shows engine origin vs your edits; melody shows pitch in context"
            >
              Click any note — pitch explain (harmony + melody)
            </span>
          </div>

          {/* Spacer — fills remaining width */}
          <div className="flex-1" aria-hidden="true" />

          {onInspectorDockModeChange && inspectorDockMode && (
            <div className="flex items-center gap-1 shrink-0 mr-1" role="group" aria-label="Inspector layout">
              <button
                type="button"
                title="Dock to the right edge"
                aria-pressed={inspectorDockMode === "sidebar"}
                onClick={() => onInspectorDockModeChange("sidebar")}
                className={cn(
                  "hf-pressable rounded px-2 py-1 font-mono text-[9px] font-medium transition-colors",
                  inspectorDockMode === "sidebar"
                    ? "bg-white/25 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                    : "bg-black/15 text-white/90 hover:bg-black/25 hover:text-white",
                )}
              >
                Dock
              </button>
              <button
                type="button"
                title="Float over the score — full-width editing"
                aria-pressed={inspectorDockMode === "floating"}
                onClick={() => onInspectorDockModeChange("floating")}
                className={cn(
                  "hf-pressable rounded px-2 py-1 font-mono text-[9px] font-medium transition-colors",
                  inspectorDockMode === "floating"
                    ? "bg-white/25 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                    : "bg-black/15 text-white/90 hover:bg-black/25 hover:text-white",
                )}
              >
                Float
              </button>
            </div>
          )}

          {/* CloseBtn — x icon */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className={cn(headerIconBtn, "bg-black/20")}
          >
            <X
              className="w-[14px] h-[14px]"
              strokeWidth={2}
              style={{ color: "var(--neutral-50)" }}
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          <div
            className="flex gap-[8px] shrink-0 px-[12px] py-[8px] border-b"
            style={{ borderColor: "var(--hf-detail)" }}
            role="tablist"
            aria-label="Inspector view"
          >
            {(
              [
                { id: "explanation" as const, label: "Explanation" },
                { id: "chat" as const, label: "Chat" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={inspectorActiveTab === id}
                onClick={() => setInspectorActiveTab(id)}
                className={cn(
                  "hf-pressable rounded-full px-[14px] py-[6px] font-mono text-[11px] font-medium transition-all duration-200 ease-out shadow-sm",
                  inspectorActiveTab === id
                    ? "bg-[var(--hf-accent)] text-[#1a0f0c] shadow-md"
                    : "bg-transparent text-[var(--hf-text-secondary)] border border-[var(--hf-detail)] hover:border-[var(--hf-accent)] hover:bg-[color-mix(in_srgb,var(--hf-accent)_10%,transparent)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tutorEnabled && openAiConfigHint ? (
            <div
              className="shrink-0 mx-[12px] mt-[6px] mb-[-4px] rounded-md border px-3 py-2 font-body text-[12px] leading-snug"
              style={{
                borderColor: "var(--hf-detail)",
                backgroundColor: "color-mix(in srgb, var(--hf-accent) 12%, transparent)",
                color: "var(--hf-text-primary)",
              }}
              role="status"
            >
              {openAiConfigHint}
            </div>
          ) : null}

          <div
            ref={scrollRef}
            className="hf-scroll-smooth flex-1 min-h-0 overflow-y-auto flex flex-col gap-[8px] p-[16px]"
            aria-label="Theory Inspector — tab content"
          >
            {inspectorActiveTab === "explanation" ? (
              <>
          {!noteInsight && !inspectorScoreFocus ? (
            <div
              className="flex-1 min-h-[180px] flex items-center justify-center rounded-[8px] border px-4 py-6 text-center"
              style={{
                borderColor: "var(--hf-detail)",
                backgroundColor: "color-mix(in srgb, var(--hf-bg) 55%, transparent)",
              }}
            >
              <p
                className="m-0 font-mono text-[12px] leading-snug"
                style={{ color: "var(--hf-text-secondary)" }}
              >
                Click a note to see its explanation.
              </p>
            </div>
          ) : null}
          {!noteInsight &&
            inspectorScoreFocus &&
            (inspectorScoreFocus.kind === "measure" ||
              inspectorScoreFocus.kind === "part") && (
              <div
                className="rounded-[6px] p-[12px]"
                style={{
                  backgroundColor: "var(--hf-bg)",
                  border: "1px solid var(--hf-detail)",
                }}
              >
                <div className="flex items-center justify-between gap-[8px]">
                  <div>
                    <div
                      className="font-mono text-[10px] mb-[2px]"
                      style={{ color: "var(--hf-text-secondary)" }}
                    >
                      {inspectorScoreFocus.kind === "measure"
                        ? inspectorScoreFocus.partId
                          ? "This staff · bar"
                          : "This measure"
                        : "This part"}
                    </div>
                    <div className="text-[14px] font-medium" style={{ color: "var(--hf-text-primary)" }}>
                      {inspectorScoreFocus.kind === "measure"
                        ? inspectorScoreFocus.partId && score
                          ? `Bar ${inspectorScoreFocus.measureIndex + 1} · ${score.parts.find((p) => p.id === inspectorScoreFocus.partId)?.name ?? "staff"}`
                          : `Bar ${inspectorScoreFocus.measureIndex + 1}`
                        : inspectorScoreFocus.partName}
                    </div>
                  </div>
                  {onEditFocusedRegion && tutorEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        if (inspectorScoreFocus.kind === "measure" && score) {
                          onEditFocusedRegion({
                            scope: "measure",
                            measureIndex: inspectorScoreFocus.measureIndex,
                            lockedPitches: collectNonRestPitchesInMeasure(
                              score,
                              inspectorScoreFocus.measureIndex,
                            ),
                          });
                        } else if (inspectorScoreFocus.kind === "part") {
                          onEditFocusedRegion({
                            scope: "part",
                            partId: inspectorScoreFocus.partId,
                            partName: inspectorScoreFocus.partName,
                          });
                        }
                      }}
                      className="hf-pressable shrink-0 rounded-[6px] px-[10px] py-[6px] font-mono text-[11px] font-medium shadow-sm hover:shadow-md hover:brightness-[1.04] active:brightness-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
                      style={{
                        backgroundColor: "var(--hf-accent)",
                        color: "var(--text-on-light)",
                      }}
                      aria-label={
                        inspectorScoreFocus.kind === "measure"
                          ? localizedRegenerateRange &&
                            localizedRegenerateRange.startMeasure !== localizedRegenerateRange.endMeasure
                            ? "Regenerate harmony for the selected bar range"
                            : "Regenerate harmony suggestions for this bar"
                          : "Ask the assistant to suggest edits for this part"
                      }
                    >
                      {inspectorScoreFocus.kind === "measure"
                        ? localizedRegenerateLabel
                        : "Suggest edits"}
                    </button>
                  )}
                </div>
                <div
                  className="text-[11px] mt-[6px] leading-snug"
                  style={{ color: "var(--hf-text-secondary)" }}
                >
                  Chat uses the facts below. Click a note for note-level engine context.
                </div>
                <pre
                  className="mt-[10px] m-0 max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words font-mono text-[10px]"
                  style={{ color: "var(--hf-text-primary)" }}
                >
                  {inspectorScoreFocus.evidenceLines.join("\n")}
                </pre>
              </div>
            )}

          {noteInsight ? (
            <>
                <div
                  className="rounded-md p-[12px]"
                  style={{
                    backgroundColor: "var(--hf-inspector-note-bg)",
                    border: "1px solid var(--hf-detail)",
                    borderLeftWidth: "4px",
                    borderLeftColor: "var(--hf-accent)",
                  }}
                >
                  <div
                    className="font-mono text-[10px] mb-[6px] uppercase tracking-wide"
                    style={{ color: "var(--hf-text-secondary)" }}
                  >
                    This note
                  </div>
                  <div className="text-[14px] font-medium" style={{ color: "var(--hf-text-primary)" }}>
                    {noteInsight.noteLabel} ({noteInsight.voice})
                  </div>
                  <div
                    className="text-[11px] mt-[4px] leading-snug"
                    style={{ color: "var(--hf-text-secondary)" }}
                    title={
                      noteInsight.insightKind === "melody-guide"
                        ? "Internal: melody-context"
                        : noteInsight.inspectorMode === "origin-justifier"
                          ? "Internal: origin-justifier — pitch still matches first generation"
                          : noteInsight.inspectorMode === "harmonic-guide"
                            ? "Internal: harmonic-guide — live score emphasis"
                            : undefined
                    }
                  >
                    {noteInsight.insightKind === "melody-guide"
                      ? `Input melody · chord moment ${noteInsight.slotIndex}`
                      : noteInsight.inspectorMode === "origin-justifier"
                        ? `Chord moment ${noteInsight.slotIndex} · still matches first generation`
                        : noteInsight.inspectorMode === "harmonic-guide"
                          ? `Chord moment ${noteInsight.slotIndex} · live score (edited or guide-only)`
                          : `Chord moment ${noteInsight.slotIndex}`}
                  </div>
                  {(noteInsight.originalEnginePitch != null || noteInsight.userModifiedPitch) && (
                    <div
                      className="text-[11px] mt-[8px] rounded-[4px] px-[8px] py-[6px]"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--hf-accent) 12%, transparent)",
                        border: "1px solid var(--hf-detail)",
                        color: "var(--hf-text-primary)",
                      }}
                    >
                      <div className="font-body text-[10px] font-medium mb-[4px]" style={{ color: "var(--hf-text-secondary)" }}>
                        First save vs what you see now
                      </div>
                      <div className="text-[10px] mb-[2px]" style={{ color: "var(--hf-text-secondary)" }}>
                        Pitch when the score was first loaded vs current pitch.
                      </div>
                      <div>
                        {noteInsight.originalEnginePitch != null ? (
                          <>
                            <span style={{ color: "var(--hf-text-secondary)" }}>At first load: </span>
                            <span className="font-medium">{noteInsight.originalEnginePitch}</span>
                          </>
                        ) : (
                          <span style={{ color: "var(--hf-text-secondary)" }}>No saved first pitch for this note.</span>
                        )}
                      </div>
                      <div className="mt-[4px]">
                        <span style={{ color: "var(--hf-text-secondary)" }}>In the score now: </span>
                        <span className="font-medium">{noteInsight.currentPitch}</span>
                        {noteInsight.userModifiedPitch ? (
                          <span style={{ color: "var(--hf-text-secondary)" }}> (you changed it)</span>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progressive disclosure (Iter1 §3 / Iter2 §3): the three
                    rationale blocks (engine origin, what this click means,
                    verifiable export) default hidden to avoid "wall of text".
                    Users opt in via a disclosure toggle for the deeper story. */}
                <button
                  type="button"
                  onClick={() => setShowInspectorRationale(!showInspectorRationale)}
                  className="hf-pressable flex items-center gap-[6px] rounded-[4px] px-[8px] py-[4px] font-mono text-[10px] self-start shadow-sm hover:bg-[color-mix(in_srgb,var(--hf-surface)_6%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
                  style={{
                    color: "var(--hf-text-secondary)",
                    border: "1px solid var(--hf-detail)",
                    backgroundColor: "transparent",
                  }}
                  aria-expanded={showInspectorRationale}
                >
                  {showInspectorRationale ? (
                    <ChevronDown className="w-[12px] h-[12px]" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-[12px] h-[12px]" aria-hidden="true" />
                  )}
                  {showInspectorRationale ? "Hide rationale" : "Show rationale"}
                </button>

                {showInspectorRationale && (
                  <>
                    {noteInsight.engineOriginExplanation ? (
                      <div
                        className="rounded-[6px] p-[12px] text-[13px] leading-[1.5]"
                        style={{
                          backgroundColor: "var(--hf-bg)",
                          border: "1px solid var(--hf-detail)",
                          color: "var(--hf-text-primary)",
                        }}
                      >
                        <div className="font-body text-[13px] font-medium mb-[2px]" style={{ color: "var(--hf-text-primary)" }}>
                          What the tool first wrote
                        </div>
                        <div className="font-body text-[10px] mb-[8px] leading-snug" style={{ color: "var(--hf-text-secondary)" }}>
                          Frozen snapshot from when the score was generated (if we have it).
                        </div>
                        <MarkdownText content={noteInsight.engineOriginExplanation} variant="panel" onKeywordClick={onKeywordClick} />
                      </div>
                    ) : null}

                    <div
                      className="rounded-[6px] p-[12px] text-[13px] leading-[1.5]"
                      style={{
                        backgroundColor: "var(--hf-bg)",
                        border: "1px solid var(--hf-detail)",
                        color: "var(--hf-text-primary)",
                      }}
                    >
                      <div className="font-body text-[13px] font-medium mb-[2px]" style={{ color: "var(--hf-text-primary)" }}>
                        What this click means
                      </div>
                      <div className="font-body text-[10px] mb-[8px] leading-snug" style={{ color: "var(--hf-text-secondary)" }}>
                        {noteInsight.insightKind === "melody-guide"
                          ? "How your tune sits at this beat with the other staves. (HarmonyForge did not generate the melody—focus on fit and rhythm; full detail is in the export.)"
                          : "Why HarmonyForge’s axiomatic engine chose the original harmony pitch at generation, and how that relates to what you see now—then use the export to verify every staff."}
                      </div>
                      <MarkdownText content={noteInsight.currentPitchGuideExplanation} variant="panel" onKeywordClick={onKeywordClick} />
                    </div>

                    <div
                      className="rounded-[6px] p-[10px] text-[11px] leading-[1.45]"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--hf-accent) 8%, transparent)",
                        border: "1px solid var(--hf-detail)",
                        color: "var(--hf-text-primary)",
                      }}
                    >
                      <div className="font-body text-[12px] font-medium mb-[2px]" style={{ color: "var(--hf-text-primary)" }}>
                        Verifiable score export
                      </div>
                      <div className="font-body text-[10px] mb-[6px] leading-snug" style={{ color: "var(--hf-text-secondary)" }}>
                        Copied from your score so answers stay checkable—use this to confirm rhythm, meter, and what each staff is doing.
                      </div>
                      <pre
                        className="m-0 whitespace-pre-wrap break-words font-mono text-[11px]"
                        style={{ color: "var(--hf-text-primary)" }}
                      >
                        {noteInsight.evidenceLines.join("\n")}
                      </pre>
                    </div>
                  </>
                )}

                <div className="text-[13px] leading-[1.5] bg-transparent pt-[10px]">
                  <div
                    className="font-mono text-[10px] mb-[8px] uppercase tracking-[0.06em]"
                    style={{ color: "var(--hf-text-secondary)" }}
                  >
                    Tutor summary
                  </div>
                  <div>
                    {isStreaming ? (
                      <span
                        className="font-body text-[13px]"
                        style={{ color: "var(--hf-text-primary)" }}
                      >
                        Generating summary…
                      </span>
                    ) : tutorEnabled ? (
                      noteInsight.aiExplanation?.trim() ? (
                        <MarkdownText content={noteInsight.aiExplanation.trim()} variant="panel" onKeywordClick={onKeywordClick} />
                      ) : (
                        <span
                          className="font-body text-[13px]"
                          style={{ color: "var(--hf-text-primary)" }}
                        >
                          No summary yet. The panels above still describe the score—wait for the
                          reply or check your connection.
                        </span>
                      )
                    ) : (
                      <span
                        className="font-body text-[13px]"
                        style={{ color: "var(--hf-text-primary)" }}
                      >
                        Add OPENAI_API_KEY (e.g. in .env.local or Vercel project env) for an AI summary.
                        Everything above still works without it—facts and export stay the same.
                        {openAiConfigHint ? (
                          <>
                            {" "}
                            <span className="block mt-2 opacity-90">{openAiConfigHint}</span>
                          </>
                        ) : null}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[13px] leading-[1.5] bg-transparent pt-[10px]">
                  <div
                    className="font-mono text-[10px] mb-[8px] uppercase tracking-[0.06em]"
                    style={{ color: "var(--hf-text-secondary)" }}
                  >
                    Ideas to try next
                  </div>
                  <div>
                    {!tutorEnabled ? (
                      <span
                        className="font-body text-[13px]"
                        style={{ color: "var(--hf-text-primary)" }}
                      >
                        Set OPENAI_API_KEY to generate suggestion bullets here; deterministic panels
                        above still work without it.
                      </span>
                    ) : isStreaming ? (
                      <span
                        className="font-body text-[13px]"
                        style={{ color: "var(--hf-text-primary)" }}
                      >
                        …
                      </span>
                    ) : noteInsight.aiSuggestions?.trim() ? (
                      <MarkdownText content={noteInsight.aiSuggestions.trim()} variant="panel" onKeywordClick={onKeywordClick} />
                    ) : (
                      <span
                        className="font-body text-[13px]"
                        style={{ color: "var(--hf-text-primary)" }}
                      >
                        No suggestion bullets in this reply yet.
                      </span>
                    )}
                    {noteInsight.ideaActions &&
                      noteInsight.ideaActions.length > 0 &&
                      tutorEnabled &&
                      !isStreaming && (
                        <div
                          className="mt-[10px] flex flex-col gap-[6px]"
                          aria-label="Implementable idea actions"
                        >
                          <div
                            className="font-mono text-[9px]"
                            style={{ color: "var(--hf-text-secondary)" }}
                          >
                            One-click pitch edits (from tutor JSON)
                          </div>
                          {noteInsight.ideaActions.map((a) => {
                            const status =
                              noteInsight.ideaActionStatuses?.[a.id] ?? "pending";
                            const resolved = status !== "pending";
                            return (
                              <div
                                key={a.id}
                                className="flex items-center gap-[8px] rounded-[4px] px-[8px] py-[6px]"
                                style={{
                                  backgroundColor: resolved
                                    ? "transparent"
                                    : "color-mix(in srgb, var(--hf-accent) 10%, transparent)",
                                  border: "1px solid var(--hf-detail)",
                                  opacity: resolved ? 0.65 : 1,
                                }}
                              >
                                <div className="flex-1 min-w-0">
                                  <div
                                    className="font-body text-[12px] leading-snug"
                                    style={{ color: "var(--hf-text-primary)" }}
                                  >
                                    {a.summary}
                                  </div>
                                  <div
                                    className="font-mono text-[10px] mt-[2px]"
                                    style={{ color: "var(--hf-text-secondary)" }}
                                    title={a.noteId}
                                  >
                                    {a.suggestedPitch}
                                  </div>
                                </div>
                                {resolved ? (
                                  <span
                                    className="font-mono text-[9px] shrink-0 uppercase"
                                    style={{ color: "var(--hf-text-secondary)" }}
                                  >
                                    {status}
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-[4px] shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => onAcceptIdeaAction?.(a)}
                                      className="hf-pressable flex items-center justify-center w-[26px] h-[26px] rounded shadow-sm hover:bg-green-900/25 active:bg-green-900/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d32] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
                                      style={{ color: "#2e7d32" }}
                                      aria-label={`Accept: set pitch to ${a.suggestedPitch}`}
                                    >
                                      <Check className="w-[14px] h-[14px]" strokeWidth={2.5} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onRejectIdeaAction?.(a)}
                                      className="hf-pressable flex items-center justify-center w-[26px] h-[26px] rounded shadow-sm hover:bg-red-900/20 active:bg-red-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-violation)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
                                      style={{ color: "var(--semantic-violation)" }}
                                      aria-label="Reject this idea"
                                    >
                                      <X className="w-[14px] h-[14px]" strokeWidth={2.5} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                </div>
              </>
          ) : null}
                {violationMessages.map((msg) => renderChatMessage(msg, "full"))}
                {suggestionMessages.map((msg) => renderChatMessage(msg, "full"))}
              </>
            ) : (
              <>
                {messages.length > 0 && (
                  <div className="flex items-center gap-[8px] shrink-0">
                    <div className="flex-1 h-[1px]" style={{ backgroundColor: "var(--hf-detail)" }} />
                    <span className="font-mono text-[9px]" style={{ color: "var(--hf-text-secondary)" }}>
                      Conversation
                    </span>
                    <div className="flex-1 h-[1px]" style={{ backgroundColor: "var(--hf-detail)" }} />
                  </div>
                )}
                <div
                  role="log"
                  aria-live="polite"
                  aria-label="Theory Inspector — chat"
                  className="flex flex-col gap-[8px]"
                >
                  {messages.map((msg) => renderChatMessage(msg, "chatStream"))}
                </div>
                {isStreaming && streamingMessageId != null && (
                  <div
                    className="flex items-center gap-[4px] px-[12px] py-[6px]"
                    aria-label="AI is typing"
                    role="status"
                  >
                    <span
                      className="w-[6px] h-[6px] rounded-full animate-pulse"
                      style={{ backgroundColor: "var(--hf-accent)", animationDelay: "0ms" }}
                    />
                    <span
                      className="w-[6px] h-[6px] rounded-full animate-pulse"
                      style={{ backgroundColor: "var(--hf-accent)", animationDelay: "150ms" }}
                    />
                    <span
                      className="w-[6px] h-[6px] rounded-full animate-pulse"
                      style={{ backgroundColor: "var(--hf-accent)", animationDelay: "300ms" }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {inspectorActiveTab === "chat" && visibleChatTags.length > 0 ? (
            <div
              className="hf-scroll-smooth flex items-center gap-[6px] shrink-0 overflow-x-auto py-[8px] px-[12px] border-t"
              style={{
                scrollbarWidth: "none",
                borderColor: "color-mix(in srgb, var(--hf-detail) 55%, transparent)",
                backgroundColor: "var(--hf-bg)",
              }}
              aria-label="Suggested chats"
            >
              {visibleChatTags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-[2px] shrink-0 rounded-full px-[10px] py-[4px]"
                  style={{
                    background: "color-mix(in srgb, var(--hf-surface) 12%, transparent)",
                    border: "1px solid var(--hf-detail)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onStarterPromptClick?.(tag)}
                    className="hf-pressable font-mono text-[10px] whitespace-nowrap rounded-sm px-0.5 -mx-0.5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--hf-bg)]"
                    style={{ color: "var(--hf-text-primary)" }}
                  >
                    {tag}
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissChatTag(tag)}
                    className="hf-pressable ml-[2px] flex items-center justify-center w-[14px] h-[14px] rounded-full hover:bg-black/15 active:bg-black/25"
                    aria-label={`Remove tag ${tag}`}
                    style={{ color: "var(--hf-text-secondary)" }}
                  >
                    <X className="w-[8px] h-[8px]" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {inspectorActiveTab === "chat" && tutorEnabled && (
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5 w-full px-[12px] py-[6px] shrink-0 font-mono text-[10px]"
              style={{
                backgroundColor: "var(--hf-bg)",
                borderTop: "1px solid var(--hf-detail)",
                color: "var(--hf-text-secondary)",
              }}
            >
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-[var(--hf-detail)] size-3 accent-[var(--hf-surface)]"
                  checked={allowRhythmInSuggestions}
                  onChange={(e) => setAllowRhythmInSuggestions(e.target.checked)}
                />
                <span>Allow rhythm in stylist fixes</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-[var(--hf-detail)] size-3 accent-[var(--hf-surface)]"
                  checked={proactiveAlternativesEnabled}
                  onChange={(e) => setProactiveAlternativesEnabled(e.target.checked)}
                />
                <span>Proactive focus (coming soon)</span>
              </label>
              {onRequestStylist && score && score.parts.length > 0 ? (
                <button
                  type="button"
                  onClick={onRequestStylist}
                  className="hf-pressable ml-auto font-mono text-[10px] rounded px-2 py-0.5 border"
                  style={{ borderColor: "var(--hf-detail)", color: "var(--hf-text-primary)" }}
                >
                  Suggest alternatives
                </button>
              ) : null}
            </div>
          )}

          {inspectorActiveTab === "chat" && (
            <div
              className="flex items-center gap-[8px] w-full h-[60px] px-[12px] shrink-0"
              style={{
                backgroundColor: "var(--hf-bg)",
                borderTop: "1px solid var(--hf-detail)",
              }}
            >
              <div
                className="flex items-center flex-1 h-[36px] px-[12px] rounded-[4px] transition-[box-shadow,border-color] duration-200 ease-out focus-within:border-[var(--hf-accent)] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--hf-accent)_30%,transparent)]"
                style={{
                  backgroundColor: "var(--hf-panel-bg)",
                  border: "1px solid var(--hf-detail)",
                }}
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => onInputChange?.(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    messages.length === 0
                      ? "Ask about this score, or tap a suggestion below"
                      : "Follow up…"
                  }
                  disabled={chatInputLocked}
                  className="flex-1 bg-transparent border-none outline-none font-body text-[12px] font-normal disabled:opacity-50"
                  style={{ color: "var(--hf-text-primary)" }}
                  aria-label="Theory Inspector message"
                />
              </div>
              <button
                type="button"
                onClick={onSend}
                disabled={chatInputLocked}
                aria-label="Send message"
                className="hf-pressable flex items-center justify-center w-[36px] h-[36px] rounded-[4px] shrink-0 shadow-sm hover:shadow-md hover:brightness-[1.08] active:brightness-[0.92] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-bg)]"
                style={{ backgroundColor: "var(--hf-surface)" }}
              >
                <SendHorizontal
                  className="w-[14px] h-[14px] text-white"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>
            </div>
          )}
        </div>

        {/* AI first-visit modal */}
        {showAiModal && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center p-[24px]"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            role="dialog"
            aria-modal="true"
            aria-label="About conversational AI in Theory Inspector"
            onClick={(e) => { if (e.target === e.currentTarget) dismissAiModal(); }}
          >
            <div
              className="w-full max-w-[320px] rounded-[12px] p-[20px] flex flex-col gap-[14px]"
              style={{
                backgroundColor: "var(--hf-panel-bg)",
                border: "1px solid var(--hf-detail)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
              }}
            >
              <div className="flex items-start justify-between gap-[8px]">
                <h2 className="font-mono text-[13px] font-semibold" style={{ color: "var(--hf-text-primary)" }}>
                  Conversational AI is ready
                </h2>
                <button type="button" onClick={dismissAiModal} aria-label="Close" className="hf-pressable flex items-center justify-center w-[22px] h-[22px] rounded-full hover:bg-black/15 active:bg-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]" style={{ color: "var(--hf-text-secondary)" }}>
                  <X className="w-[12px] h-[12px]" strokeWidth={2} />
                </button>
              </div>
              <p className="font-body text-[12px] leading-[1.5]" style={{ color: "var(--hf-text-primary)" }}>
                This panel uses a language model for explanations, audits, and suggestions. HarmonyForge&#x27;s automatic voicings still come from the deterministic engine — transparent coaching next to fixed rules.
              </p>
              <p className="font-mono text-[10px]" style={{ color: "var(--hf-text-secondary)" }}>
                Click a note in the score, then ask anything.
              </p>
              <button
                type="button"
                onClick={dismissAiModal}
                className="hf-pressable self-end rounded-[6px] px-[14px] py-[7px] font-mono text-[11px] font-medium shadow-sm hover:shadow-md hover:brightness-[1.05] active:brightness-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-surface)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
                style={{ backgroundColor: "var(--hf-accent)", color: "#1a0f0c" }}
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

TheoryInspectorPanel.displayName = "TheoryInspectorPanel";

/**
 * Visual confirmation for a tutor-emitted INTENT. Applies the change through
 * store setters wired in the sandbox page (mood, pickup, regenerate, navigate).
 */
function IntentConfirmationBubble({
  messageId,
  intent,
  onApply,
  onDismiss,
}: {
  messageId: string;
  intent: Intent;
  onApply?: (msgId: string, intent: Intent) => void;
  onDismiss?: (msgId: string) => void;
}) {
  return (
    <div
      className="self-start max-w-[92%] rounded-[10px] border px-[10px] py-[8px] flex flex-col gap-[6px]"
      style={{
        backgroundColor: "color-mix(in srgb, var(--hf-surface) 10%, transparent)",
        borderColor: "var(--hf-detail)",
      }}
      role="note"
      aria-label="Suggested app action"
    >
      <div className="flex flex-col gap-[2px]">
        <span
          className="font-mono text-[10px] uppercase tracking-wide"
          style={{ color: "var(--hf-text-secondary)" }}
        >
          Suggested app action
        </span>
        <span
          className="font-sans text-[12px] leading-snug"
          style={{ color: "var(--hf-text-primary)" }}
        >
          {describeIntent(intent)}
        </span>
        {intent.reason ? (
          <span
            className="font-sans text-[11px] leading-snug"
            style={{ color: "var(--hf-text-secondary)" }}
          >
            {intent.reason}
          </span>
        ) : null}
      </div>
      <div className="flex gap-[8px]">
        <button
          type="button"
          className="hf-pressable font-mono text-[11px] rounded-[4px] px-[10px] py-[4px] shadow-sm hover:shadow-md hover:brightness-[1.06] active:brightness-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
          style={{
            backgroundColor: "var(--hf-surface)",
            color: "var(--hf-text-on-surface, white)",
          }}
          onClick={() => onApply?.(messageId, intent)}
          disabled={!onApply}
        >
          Apply
        </button>
        <button
          type="button"
          className="hf-pressable font-mono text-[11px] rounded-[4px] px-[10px] py-[4px] border shadow-sm hover:bg-[color-mix(in_srgb,var(--hf-surface)_8%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
          style={{
            borderColor: "var(--hf-detail)",
            color: "var(--hf-text-primary)",
          }}
          onClick={() => onDismiss?.(messageId)}
          disabled={!onDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
