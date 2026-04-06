"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export type MarkdownTextVariant = "bubble" | "panel";

export interface MarkdownTextProps {
  content: string;
  variant?: MarkdownTextVariant;
  className?: string;
}

/**
 * Safe markdown (no raw HTML): bold, italic, inline code, lists, paragraphs.
 * Root is a div so block-level markdown is valid inside chat cards.
 */
export function MarkdownText({
  content,
  variant = "bubble",
  className,
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
          strong: ({ children }) => (
            <strong className="font-semibold" style={{ color: "var(--hf-text-primary)" }}>
              {children}
            </strong>
          ),
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
