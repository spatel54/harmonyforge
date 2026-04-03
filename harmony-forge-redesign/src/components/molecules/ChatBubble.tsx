import React from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownText } from "@/components/molecules/MarkdownText";

export type ChatBubbleVariant = "system" | "user" | "ai";

export interface ChatBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: ChatBubbleVariant;
  content: string;
  timestamp?: string;
  onEdit?: () => void;
}

/**
 * ChatBubble Molecule
 * Covers three variants from TheoryInspectorPanel's ChatArea:
 *
 * "system"  → sysMsgWrap/sysMsg (Node k4JFu / KYSkE)
 *   Spec: wrapper gap:3
 *         sysMsg: pad:[8,12]  fill:$sonata-surface/10  stroke:$sonata-detail @1  r:2
 *         text:   IBM Plex Mono fs:11 fill:$text-on-light
 *         ts:     Inter fs:9 fill:#7A6050
 *
 * "user"    → userBubble/userInner (Node YwY7r / OCN6p)
 *   Spec: userBubble jc:end
 *         userInner: layout:vertical gap:4  pad:[8,12]  fill:#A55B3726  r:4
 *         text:      Inter fs:11  w:230  fill:$text-on-light
 *         ts:        Inter fs:9  fill:#7A6050  (outside inner)
 *
 * "ai"      → aCard (Node 3hTe5)
 *   Spec: layout:vertical gap:6 pad:[10,12]
 *         fill:#A55B370D  stroke:$sonata-detail @1  r:4
 *         text: Inter fs:11  fill:$text-on-light
 *         ts:   Inter fs:9  fill:#7A6050
 */
export const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ variant, content, timestamp, onEdit, className, ...props }, ref) => {
    /* ── System message ─────────────────────────────────── */
    if (variant === "system") {
      return (
        <div
          ref={ref}
          className={cn("flex flex-col gap-[3px] w-full", className)}
          role="status"
          {...props}
        >
          {/* sysMsg: pad:[8,12] fill:$sonata-surface/10 stroke:$sonata-detail r:2 */}
          <div
            className="w-full rounded-[2px] px-[12px] py-[8px]"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--hf-surface) 10%, transparent)",
              border: "1px solid var(--hf-detail)",
            }}
          >
            <p
              className="font-mono text-[11px] font-normal leading-[1.5]"
              style={{ color: "var(--hf-text-primary)" }}
            >
              {content}
            </p>
          </div>

          {timestamp && (
            <span
              className="font-body text-[9px] font-normal"
              style={{ color: "var(--hf-text-secondary)" }}
            >
              {timestamp}
            </span>
          )}
        </div>
      );
    }

    /* ── User message ────────────────────────────────────── */
    if (variant === "user") {
      return (
        <div
          ref={ref}
          className={cn("flex flex-col items-end gap-[4px] w-full", className)}
          {...props}
        >
          {/* userInner: layout:vertical gap:4 pad:[8,12] fill:#A55B3726 r:4 */}
          <div
            className="flex flex-col gap-[4px] px-[12px] py-[8px] rounded-[4px] max-w-[230px]"
            style={{ backgroundColor: "rgba(var(--hf-surface-rgb), 0.15)" }}
          >
            <MarkdownText content={content} variant="bubble" className="leading-[1.5]" />

            {/* userActRow: gap:8 jc:end */}
            {onEdit && (
              <div className="flex items-center justify-end gap-[8px]">
                <button
                  type="button"
                  onClick={onEdit}
                  aria-label="Edit message"
                  className="flex items-center justify-center w-[20px] h-[20px] rounded-[2px] transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hf-accent)"
                  style={{ color: "var(--hf-text-primary)" }}
                >
                  <Pencil
                    className="w-[10px] h-[10px]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </button>
              </div>
            )}
          </div>

          {timestamp && (
            <span
              className="font-body text-[9px] font-normal"
              style={{ color: "var(--hf-text-secondary)" }}
            >
              {timestamp}
            </span>
          )}
        </div>
      );
    }

    /* ── AI response ─────────────────────────────────────── */
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-[6px] w-full", className)}
        {...props}
      >
        {/* Match user/system: theme tokens so text stays readable in light + dark */}
        <div
          className="w-full rounded-[4px] px-[12px] py-[10px]"
          style={{
            backgroundColor: "rgba(var(--hf-surface-rgb), 0.14)",
            border: "1px solid var(--hf-detail)",
          }}
        >
          <MarkdownText content={content} variant="bubble" />
        </div>

        {timestamp && (
          <span
            className="font-body text-[9px] font-normal"
            style={{ color: "var(--hf-text-secondary)" }}
          >
            {timestamp}
          </span>
        )}
      </div>
    );
  },
);

ChatBubble.displayName = "ChatBubble";
