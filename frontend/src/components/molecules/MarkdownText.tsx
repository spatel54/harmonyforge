"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export type MarkdownTextVariant = "bubble" | "panel";

export interface MarkdownTextProps {
  content: string;
  variant?: MarkdownTextVariant;
  className?: string;
  /**
   * When provided, bold (`**keyword**`) tokens become clickable.
   * The plain-text content of the bold node is passed to this callback.
   * Useful for clicking a pitch name (e.g. "G4") to highlight it in the score.
   */
  onKeywordClick?: (keyword: string) => void;
}

/** Extracts the plain-text content from React children (handles nested nodes). */
function extractText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (React.isValidElement(children)) {
    const el = children as React.ReactElement<{ children?: React.ReactNode }>;
    return extractText(el.props.children);
  }
  return "";
}

/**
 * Safe markdown (no raw HTML): bold, italic, inline code, lists, paragraphs.
 * Root is a div so block-level markdown is valid inside chat cards.
 * When `onKeywordClick` is provided, bold runs become clickable keyword buttons.
 */
export function MarkdownText({
  content,
  variant = "bubble",
  className,
  onKeywordClick,
}: MarkdownTextProps) {
  const isBubble = variant === "bubble";
  const textSize = isBubble ? "text-[11px] leading-[1.6]" : "text-[13px] leading-[1.5]";
  const codeSize = isBubble ? "text-[10px]" : "text-[11px]";

  return (
    <div
      className={cn("font-body font-normal", textSize, className)}
      style={{ color: "var(--hf-text-primary)" }}
    >
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p
              className="m-0 mb-2 last:mb-0"
              style={{ color: "var(--hf-text-primary)" }}
            >
              {children}
            </p>
          ),
          strong: ({ children }) => {
            if (onKeywordClick) {
              const keyword = extractText(children);
              return (
                <button
                  type="button"
                  onClick={() => onKeywordClick(keyword)}
                  className="font-semibold underline decoration-dotted underline-offset-2 cursor-pointer bg-transparent border-none p-0 inline"
                  style={{
                    color: "var(--hf-accent)",
                    textDecorationColor: "color-mix(in srgb, var(--hf-accent) 55%, transparent)",
                  }}
                  title={`Click to highlight "${keyword}" in the score`}
                >
                  {children}
                </button>
              );
            }
            return (
              <strong className="font-semibold" style={{ color: "var(--hf-text-primary)" }}>
                {children}
              </strong>
            );
          },
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => (
            <code
              className={cn("font-mono px-[4px] py-[1px] rounded-[2px]", codeSize)}
              style={{
                backgroundColor: "color-mix(in srgb, var(--hf-surface) 14%, transparent)",
                color: "var(--hf-text-primary)",
              }}
            >
              {children}
            </code>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 my-2 space-y-1 m-0" style={{ color: "var(--hf-text-primary)" }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 my-2 space-y-1 m-0" style={{ color: "var(--hf-text-primary)" }}>
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-[1.5]">{children}</li>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
