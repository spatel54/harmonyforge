"use client";

import React from "react";
import { X, SendHorizontal, Check } from "lucide-react";
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
import { useTheoryInspectorStore } from "@/store/useTheoryInspectorStore";
import { isMinimalSuggestionExplanation } from "@/lib/study/studyConfig";
import type { IdeaAction } from "@/lib/ai/ideaActionSchema";

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
  /** Apply tutor <<<IDEA_ACTIONS>>> pitch edits */
  onAcceptIdeaAction?: (action: IdeaAction) => void;
  onRejectIdeaAction?: (action: IdeaAction) => void;
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
      onAcceptIdeaAction,
      onRejectIdeaAction,
      className,
      ...props
    },
    ref,
  ) => {
    const chatScrollRef = React.useRef<HTMLDivElement>(null);
    const tutorEnabled = useTheoryInspectorStore((s) => s.hasApiKey);
    const suppressSuggestionProse = isMinimalSuggestionExplanation();
    const chatInputLocked = isStreaming && streamingMessageId != null;

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

    // No dependency array: React Compiler / Turbopack can rewrite multi-entry effect deps and trigger
    // "final argument changed size" errors. Scrolling after every paint is cheap for this small panel.
    React.useLayoutEffect(() => {
      const el = chatScrollRef.current;
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
              style={{ color: "rgba(255, 252, 250, 0.92)" }}
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

        {/* ── Body: note details (top) + chat (bottom), equal split ── */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div
            className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-[8px] p-[16px]"
            style={{ borderBottom: "1px solid var(--hf-detail)" }}
            aria-label="Theory Inspector — note details and recommendations"
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
                      ? "How your tune sits at this beat with the other staves. (HarmonyForge did not generate the melody—focus on fit and rhythm; full detail is in the export.)"
                      : "Why HarmonyForge’s axiomatic engine chose the original harmony pitch at generation, and how that relates to what you see now—then use the export to verify every staff."}
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

                {/* Tutor summary (LLM) — after deterministic blocks; Ideas follow below */}
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
                    Wrap-up after the facts above—tie together what you’re hearing, why it matters musically, and how that connects to HarmonyForge’s rules when relevant.
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
                        <MarkdownText content={noteInsight.aiExplanation.trim()} variant="panel" />
                      ) : (
                        <span
                          className="font-body text-[13px]"
                          style={{ color: "var(--hf-text-primary)" }}
                        >
                          No summary yet. The sections above still describe the score; wait for the
                          response or check your connection.
                        </span>
                      )
                    ) : (
                      <span
                        className="font-body text-[13px]"
                        style={{ color: "var(--hf-text-primary)" }}
                      >
                        Add OPENAI_API_KEY to your environment (.env.local locally or Vercel Project
                        Settings in production) for an AI summary. The sections above still explain
                        the score without the tutor.
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
                    After the summary: concrete tries—each bullet should name what to do and why (because / so that), tied to the facts and export.
                  </div>
                  <div>
                    {!tutorEnabled ? (
                      <span
                        className="font-body text-[13px]"
                        style={{ color: "var(--hf-text-primary)" }}
                      >
                        Enable the AI tutor by setting OPENAI_API_KEY in your environment to get
                        suggestions here.
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
                                      className="flex items-center justify-center w-[26px] h-[26px] rounded transition-colors hover:bg-green-900/25 focus-visible:outline-2 focus-visible:outline-offset-1"
                                      style={{ color: "#2e7d32" }}
                                      aria-label={`Accept: set pitch to ${a.suggestedPitch}`}
                                    >
                                      <Check className="w-[14px] h-[14px]" strokeWidth={2.5} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onRejectIdeaAction?.(a)}
                                      className="flex items-center justify-center w-[26px] h-[26px] rounded transition-colors hover:bg-red-900/25 focus-visible:outline-2 focus-visible:outline-offset-1"
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
          </div>

          <div
            className="flex-1 min-h-0 flex flex-col min-h-0"
            aria-label="Theory Inspector — chat column"
          >
            <div
              ref={chatScrollRef}
              className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-[8px] p-[16px]"
              role="log"
              aria-live="polite"
              aria-label="Theory Inspector — chat"
            >
              {messages.map((msg) => renderChatMessage(msg))}

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
          </div>
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
              placeholder=""
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
