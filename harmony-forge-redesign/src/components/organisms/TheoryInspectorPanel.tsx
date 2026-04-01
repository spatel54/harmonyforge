"use client";

import React from "react";
import { Plus, Timer, X, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatBubble } from "@/components/molecules/ChatBubble";
import { ViolationCard } from "@/components/molecules/ViolationCard";
import { QuickReplyChips } from "@/components/molecules/QuickReplyChips";
import { SuggestionCard } from "@/components/molecules/SuggestionCard";
import type { ScoreCorrection, CorrectionStatus } from "@/lib/music/suggestionTypes";

export interface TheoryInspectorMessage {
  id: string;
  type: "system" | "user" | "ai" | "violation" | "divider" | "chips" | "suggestion";
  content?: string;
  timestamp?: string;
  violationType?: string;
  chips?: string[];
  suggestionBatchId?: string;
}

export interface TheoryInspectorPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  messages?: TheoryInspectorMessage[];
  inputValue?: string;
  isStreaming?: boolean;
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

const DEFAULT_MESSAGES: TheoryInspectorMessage[] = [
  { id: "div1", type: "divider", content: "Today" },
  {
    id: "sys1",
    type: "system",
    content: "Analyzing Measure 3… Violation detected.",
    timestamp: "09:42 AM",
  },
  {
    id: "v1",
    type: "violation",
    violationType: "Parallel 5th",
    content:
      "Per Schenkerian analysis (Schenker, Free Composition §100), parallel fifths between Soprano and Alto at beats 2–3 violate strict voice-leading. The outer-voice framework demands contrary motion at cadential points.",
    timestamp: "09:42 AM",
  },
  {
    id: "u1",
    type: "user",
    content: "Why does Schenkerian theory prohibit this?",
    timestamp: "09:43 AM",
  },
  {
    id: "ai1",
    type: "ai",
    content:
      "Schenker argues that the Ursatz — the fundamental structure of tonal music — requires strict contrary motion between soprano and bass at structural cadences. Parallel fifths disrupt the independence of voices, collapsing the contrapuntal fabric that underpins tonal coherence.",
    timestamp: "09:43 AM",
  },
  {
    id: "chips1",
    type: "chips",
    chips: [
      "Explain this chord",
      "Why parallel 5th?",
      "Suggest correction",
      "Schenker analysis",
    ],
  },
];

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
      messages = DEFAULT_MESSAGES,
      inputValue = "",
      isStreaming = false,
      onInputChange,
      onSend,
      onChipClick,
      onExplainMore,
      onSuggestFix,
      onNewChat,
      onHistory,
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

    React.useEffect(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, [messages]);

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
        aria-label="Theory Inspector — explains and suggests; you decide"
        {...props}
      >
        {/* ── Panel Header — Node 99E9J ──────────────────────
            fill:$sonata-surface (solid cherry red)
            gap:8  pad:[0,12]  h:52  jc:space_between  ai:center   */}
        <div
          className="flex items-center gap-[8px] w-full min-h-[52px] py-[6px] px-[12px] shrink-0"
          style={{ backgroundColor: "var(--hf-surface)" }}
        >
          {/* Title block: Theory Inspector + subtitle (AI as explainer/suggestor) */}
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
              title="AI explains and suggests; you have final say"
            >
              Explains and suggests — you decide
            </span>
          </div>

          {/* Spacer — fills remaining width */}
          <div className="flex-1" aria-hidden="true" />

          {/* newChatBtn — plus icon */}
          <button
            type="button"
            onClick={onNewChat}
            aria-label="New chat"
            className={headerIconBtn}
            style={{ backgroundColor: "#00000030" }}
          >
            <Plus
              className="w-[14px] h-[14px]"
              strokeWidth={2}
              style={{ color: "var(--neutral-50)" }}
              aria-hidden="true"
            />
          </button>

          {/* historyBtn — timer icon */}
          <button
            type="button"
            onClick={onHistory}
            aria-label="Chat history"
            className={headerIconBtn}
            style={{ backgroundColor: "#00000030" }}
          >
            <Timer
              className="w-[14px] h-[14px]"
              strokeWidth={2}
              style={{ color: "var(--neutral-50)" }}
              aria-hidden="true"
            />
          </button>

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

        {/* ── Chat Area — Node ra6HT ───────────────────────── */}
        <div
          ref={chatRef}
          className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-[8px] p-[16px]"
          role="log"
          aria-live="polite"
          aria-label="Theory Inspector conversation"
        >
          {messages.map((msg) => {
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
          })}

          {/* Streaming typing indicator */}
          {isStreaming && (
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

        {/* ── Chat Input Bar — Node CaIdi ──────────────────────
            h:60  gap:8  pad:[0,12]  ai:center
            fill:$sonata-bg  stroke top:1 $sonata-detail          */}
        <div
          className="flex items-center gap-[8px] w-full h-[60px] px-[12px] shrink-0"
          style={{
            backgroundColor: "var(--hf-bg)",
            borderTop: "1px solid var(--hf-detail)",
          }}
        >
          {/* inputField — fill_container h:36 pad:[0,12] fill:$neutral-50 stroke:$sonata-detail r:4 */}
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
              placeholder={isStreaming ? "Generating…" : "Ask about harmony, voice-leading…"}
              disabled={isStreaming}
              className="flex-1 bg-transparent border-none outline-none font-body text-[12px] font-normal disabled:opacity-50"
              style={{ color: "var(--hf-text-primary)" }}
              aria-label="Ask a theory question"
            />
          </div>

          {/* sendBtn — 36×36 r:4 fill:$sonata-surface */}
          <button
            type="button"
            onClick={onSend}
            disabled={isStreaming}
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
