"use client";

import React from "react";
import { X, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatBubble } from "@/components/molecules/ChatBubble";
import { MarkdownText } from "@/components/molecules/MarkdownText";
import { ViolationCard } from "@/components/molecules/ViolationCard";
import { QuickReplyChips } from "@/components/molecules/QuickReplyChips";
import { SuggestionCard } from "@/components/molecules/SuggestionCard";
import type { ScoreCorrection, CorrectionStatus } from "@/lib/music/suggestionTypes";
import type {
  InspectorScoreFocus,
  NoteInsight,
} from "@/store/useTheoryInspectorStore";
import {
  EXPLANATION_LEVELS,
  type ExplanationLevel,
} from "@/lib/ai/explanationLevel";
import { useTheoryInspectorStore } from "@/store/useTheoryInspectorStore";

export interface TheoryInspectorMessage {
  id: string;
  type: "system" | "user" | "ai" | "violation" | "divider" | "chips" | "suggestion" | "evidence";
  content?: string;
  timestamp?: string;
  violationType?: string;
  chips?: string[];
  suggestionBatchId?: string;
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
  debugStatus?: string;
  onInputChange?: (value: string) => void;
  onSend?: () => void;
  onChipClick?: (chip: string) => void;
  onExplainMore?: (msgId: string) => void;
  onSuggestFix?: (msgId: string) => void;
  onNewChat?: () => void;
  onHistory?: () => void;
  onClose?: () => void;
  /** Suggestion card support */
  suggestionBatches?: Map<string, { corrections: ScoreCorrection[]; summary: string }>;
  correctionStatuses?: Record<string, CorrectionStatus>;
  onAcceptCorrection?: (correctionId: string) => void;
  onRejectCorrection?: (correctionId: string) => void;
  onAcceptAllCorrections?: (batchId: string) => void;
  onRejectAllCorrections?: (batchId: string) => void;
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
      debugStatus,
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
      className,
      ...props
    },
    ref,
  ) => {
    const chatRef = React.useRef<HTMLDivElement>(null);
    const tutorEnabled = useTheoryInspectorStore((s) => s.hasApiKey);
    const explanationLevel = useTheoryInspectorStore((s) => s.explanationLevel);
    const setExplanationLevel = useTheoryInspectorStore(
      (s) => s.setExplanationLevel,
    );
    const hydrateExplanationLevelFromStorage = useTheoryInspectorStore(
      (s) => s.hydrateExplanationLevelFromStorage,
    );

    React.useEffect(() => {
      hydrateExplanationLevelFromStorage();
    }, [hydrateExplanationLevelFromStorage]);

    const chatLlmBlocked = tutorEnabled && explanationLevel === null;

    const levelLabel = (level: ExplanationLevel): string => {
      switch (level) {
        case "beginner":
          return "Beginner";
        case "intermediate":
          return "Intermediate";
        case "professional":
          return "Professional";
      }
    };

    const renderChatMessage = (msg: TheoryInspectorMessage): React.ReactNode => {
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
              disableLlmActions={chatLlmBlocked}
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
            <ChatBubble
              key={msg.id}
              variant="ai"
              content={msg.content ?? ""}
              timestamp={msg.timestamp}
            />
          );
        case "chips":
          return (
            <QuickReplyChips
              key={msg.id}
              chips={msg.chips}
              onChipClick={onChipClick}
              disabled={chatLlmBlocked}
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

    // No dependency array: React Compiler / Turbopack can rewrite multi-entry effect deps and trigger
    // "final argument changed size" errors. Scrolling after every paint is cheap for this small panel.
    React.useLayoutEffect(() => {
      const el = chatRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend?.();
      }
    };

    const headerIconBtn =
      "flex items-center justify-center w-[28px] h-[28px] rounded-[4px] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 shrink-0";

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col h-full overflow-hidden rounded-[4px]",
          className,
        )}
        style={{
          backgroundColor: "var(--hf-panel-bg)",
          boxShadow: "var(--shadow-lg)", // added shadow per design system
          borderLeft: "1px solid var(--hf-detail)",
        }}
        role="complementary"
        aria-label="Theory Inspector — note explainability"
        {...props}
      >
        {/* ── Panel Header — Node 99E9J ──────────────────────
            fill:$sonata-surface (solid cherry red)
            gap:8  pad:[0,12]  h:52  jc:space_between  ai:center   */}
        <div
          className="flex items-center gap-[8px] w-full min-h-[52px] py-[6px] px-[12px] shrink-0"
          style={{ backgroundColor: "var(--hf-surface)" }}
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
              style={{ color: "var(--hf-text-secondary)" }}
              title="Click any note: harmony shows engine origin vs your edits; melody shows pitch in context"
            >
              Click any note — pitch explain (harmony + melody)
            </span>
          </div>

          {/* Spacer — fills remaining width */}
          <div className="flex-1" aria-hidden="true" />

          {/* CloseBtn — x icon */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className={headerIconBtn}
            style={{ backgroundColor: "#00000020" }}
          >
            <X
              className="w-[14px] h-[14px]"
              strokeWidth={2}
              style={{ color: "var(--neutral-50)" }}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Explanation level — required before LLM chat / note tutor when API key is set */}
        <div
          className="w-full shrink-0 px-[12px] py-[8px] flex flex-col gap-[6px]"
          style={{
            backgroundColor: "var(--hf-bg)",
            borderBottom: "1px solid var(--hf-detail)",
          }}
        >
          <div
            className="font-body text-[10px] leading-tight"
            style={{ color: "var(--hf-text-secondary)" }}
          >
            {tutorEnabled
              ? chatLlmBlocked
                ? "Choose how deep the AI should go — required before chat, note summaries, and fix suggestions."
                : "Explanation depth for the AI tutor (change anytime)."
              : "When OPENAI_API_KEY is set, you choose explanation depth before using the AI tutor."}
          </div>
          <div
            className="flex gap-[4px] w-full"
            role="group"
            aria-label="AI explanation level"
          >
            {EXPLANATION_LEVELS.map((level) => {
              const active = explanationLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setExplanationLevel(level)}
                  className="flex-1 min-w-0 px-[6px] py-[6px] rounded-[4px] font-mono text-[9px] font-medium leading-tight transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hf-accent)"
                  style={{
                    backgroundColor: active
                      ? "var(--hf-surface)"
                      : "color-mix(in srgb, var(--hf-detail) 35%, transparent)",
                    color: active ? "var(--neutral-50)" : "var(--hf-text-primary)",
                    border: active
                      ? "1px solid var(--hf-surface)"
                      : "1px solid var(--hf-detail)",
                  }}
                >
                  {levelLabel(level)}
                </button>
              );
            })}
          </div>
        </div>

        {debugStatus && (
          <div
            className="px-[12px] py-[6px] font-mono text-[10px] leading-tight shrink-0"
            style={{
              backgroundColor: "color-mix(in srgb, var(--hf-accent) 10%, transparent)",
              borderBottom: "1px solid var(--hf-detail)",
              color: "var(--hf-text-primary)",
            }}
          >
            {debugStatus}
          </div>
        )}

        {/* ── Chat Area — Node ra6HT ───────────────────────── */}
        <div
          ref={chatRef}
          className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-[8px] p-[16px]"
          role="log"
          aria-live="polite"
          aria-label="Theory Inspector — note details and chat"
        >
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
                <div
                  className="font-mono text-[10px] mb-[6px]"
                  style={{ color: "var(--hf-text-secondary)" }}
                >
                  {inspectorScoreFocus.kind === "measure" ? "This measure" : "This part"}
                </div>
                <div className="text-[14px] font-medium" style={{ color: "var(--hf-text-primary)" }}>
                  {inspectorScoreFocus.kind === "measure"
                    ? `Bar ${inspectorScoreFocus.measureIndex + 1}`
                    : inspectorScoreFocus.partName}
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
                  className="rounded-[6px] p-[12px]"
                  style={{
                    backgroundColor: "var(--hf-bg)",
                    border: "1px solid var(--hf-detail)",
                  }}
                >
                  <div
                    className="font-mono text-[10px] mb-[6px]"
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

                {/* Tutor summary (LLM) — first so readers get plain language before technical blocks */}
                <div
                  className="rounded-[6px] p-[12px] text-[13px] leading-[1.5]"
                  style={{
                    backgroundColor: "var(--hf-bg)",
                    border: "1px solid var(--hf-detail)",
                    color: "var(--hf-text-primary)",
                  }}
                >
                  <div className="font-body text-[13px] font-medium mb-[2px]" style={{ color: "var(--hf-text-primary)" }}>
                    Tutor summary
                  </div>
                  <div className="font-body text-[10px] mb-[8px] leading-snug" style={{ color: "var(--hf-text-secondary)" }}>
                    Plain-language read of this note and the facts below.
                  </div>
                  <div>
                    {isStreaming ? (
                      <span
                        className="font-body text-[13px]"
                        style={{ color: "var(--hf-text-primary)" }}
                      >
                        Generating summary…
                      </span>
                    ) : chatLlmBlocked ? (
                      <span
                        className="font-body text-[13px]"
                        style={{ color: "var(--hf-text-primary)" }}
                      >
                        Choose Beginner, Intermediate, or Professional above to generate the AI tutor
                        summary.
                      </span>
                    ) : tutorEnabled ? (
                      noteInsight.aiExplanation?.trim() ? (
                        <MarkdownText content={noteInsight.aiExplanation.trim()} variant="panel" />
                      ) : (
                        <span
                          className="font-body text-[13px]"
                          style={{ color: "var(--hf-text-primary)" }}
                        >
                          No summary yet. The boxes below still describe the score; wait for the
                          response or check your connection.
                        </span>
                      )
                    ) : (
                      <span
                        className="font-body text-[13px]"
                        style={{ color: "var(--hf-text-primary)" }}
                      >
                        Add OPENAI_API_KEY to .env.local for an AI summary. The sections below still
                        explain the score without the tutor.
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="rounded-[6px] p-[12px] text-[13px] leading-[1.5]"
                  style={{
                    backgroundColor: "var(--hf-bg)",
                    border: "1px solid var(--hf-detail)",
                    color: "var(--hf-text-primary)",
                  }}
                >
                  <div className="font-body text-[13px] font-medium mb-[2px]" style={{ color: "var(--hf-text-primary)" }}>
                    Ideas to try next
                  </div>
                  <div className="font-body text-[10px] mb-[8px] leading-snug" style={{ color: "var(--hf-text-secondary)" }}>
                    Optional prompts to refine harmony or voice-leading—grounded in the facts when the tutor is on.
                  </div>
                  <div>
                    {!tutorEnabled ? (
                      <span
                        className="font-body text-[13px]"
                        style={{ color: "var(--hf-text-primary)" }}
                      >
                        Enable the AI tutor (OPENAI_API_KEY) to get suggestions here.
                      </span>
                    ) : chatLlmBlocked ? (
                      <span
                        className="font-body text-[13px]"
                        style={{ color: "var(--hf-text-primary)" }}
                      >
                        Choose an explanation level above to enable AI suggestions.
                      </span>
                    ) : isStreaming ? (
                      <span
                        className="font-body text-[13px]"
                        style={{ color: "var(--hf-text-primary)" }}
                      >
                        …
                      </span>
                    ) : noteInsight.aiSuggestions?.trim() ? (
                      <MarkdownText content={noteInsight.aiSuggestions.trim()} variant="panel" />
                    ) : (
                      <span
                        className="font-body text-[13px]"
                        style={{ color: "var(--hf-text-primary)" }}
                      >
                        No suggestions in this reply yet.
                      </span>
                    )}
                  </div>
                </div>

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
                    <MarkdownText content={noteInsight.engineOriginExplanation} variant="panel" />
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
                      ? "Plain read of your tune at this beat and how it lines up with the other staves—details live in the export below."
                      : "Plain read of your harmony line in this chord moment—full four-part and bar context is in the export below."}
                  </div>
                  <MarkdownText content={noteInsight.currentPitchGuideExplanation} variant="panel" />
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
          ) : null}

          {messages.map((msg) => renderChatMessage(msg))}

          {/* Chat stream typing (note insight uses its own “Generating summary…” copy) */}
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
        </div>

        <div
          className="flex items-center gap-[8px] w-full h-[60px] px-[12px] shrink-0"
          style={{
            backgroundColor: "var(--hf-bg)",
            borderTop: "1px solid var(--hf-detail)",
          }}
        >
          <div
            className="flex items-center flex-1 h-[36px] px-[12px] rounded-[4px]"
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
                chatLlmBlocked
                  ? "Choose explanation level above…"
                  : ""
              }
              disabled={
                chatLlmBlocked || (isStreaming && streamingMessageId != null)
              }
              className="flex-1 bg-transparent border-none outline-none font-body text-[12px] font-normal disabled:opacity-50"
              style={{ color: "var(--hf-text-primary)" }}
              aria-label="Theory Inspector message"
            />
          </div>
          <button
            type="button"
            onClick={onSend}
            disabled={
              chatLlmBlocked || (isStreaming && streamingMessageId != null)
            }
            aria-label="Send message"
            className="flex items-center justify-center w-[36px] h-[36px] rounded-[4px] shrink-0 transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hf-accent)"
            style={{ backgroundColor: "var(--hf-surface)" }}
          >
            <SendHorizontal
              className="w-[14px] h-[14px] text-white"
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    );
  },
);

TheoryInspectorPanel.displayName = "TheoryInspectorPanel";
