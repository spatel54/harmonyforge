"use client";

import React from "react";
import type { EditableScore, NotePosition } from "@/lib/music/scoreTypes";
import { getNoteById } from "@/lib/music/scoreUtils";
import { ARTICULATION_GLYPHS } from "@/lib/music/notationOverlayBadges";
import { noteheadAnchor } from "@/lib/music/noteHighlightRect";

type LineSpan = {
  id: string;
  kind: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

function collectLineSpans(score: EditableScore, positions: NotePosition[]): LineSpan[] {
  const byId = new Map(positions.map((p) => [p.selection.noteId, p]));
  const spans: LineSpan[] = [];

  for (const part of score.parts) {
    const open: Record<string, { noteId: string; pos: NotePosition } | undefined> = {};
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        const pos = byId.get(note.id);
        if (!pos) continue;
        if (note.lineStart) {
          open[note.lineStart] = { noteId: note.id, pos };
        }
        if (note.lineEnd && open[note.lineEnd]) {
          const start = open[note.lineEnd]!;
          const a = noteheadAnchor(start.pos);
          const b = noteheadAnchor(pos);
          spans.push({
            id: `${start.noteId}-${note.id}-${note.lineEnd}`,
            kind: note.lineEnd,
            x1: a.cx,
            y1: a.top + a.height * 0.25,
            x2: b.cx,
            y2: b.top + b.height * 0.25,
          });
          delete open[note.lineEnd];
        }
      }
    }
  }
  return spans;
}

function slurPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - Math.max(12, Math.abs(x2 - x1) * 0.12);
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

export interface NotationEngravingOverlayProps {
  score: EditableScore;
  notePositions: NotePosition[];
  className?: string;
}

/** SVG slurs, hairpins, and 8va lines anchored to note positions (Phase 3 engraving). */
export function NotationEngravingOverlay({
  score,
  notePositions,
  className,
}: NotationEngravingOverlayProps) {
  const spans = React.useMemo(
    () => collectLineSpans(score, notePositions),
    [score, notePositions],
  );

  if (spans.length === 0) return null;

  return (
    <svg
      className={className}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
    >
      {spans.map((span) => {
        if (span.kind === "slur") {
          return (
            <path
              key={span.id}
              d={slurPath(span.x1, span.y1, span.x2, span.y2)}
              fill="none"
              stroke="var(--hf-text-primary)"
              strokeWidth={1.5}
              opacity={0.85}
            />
          );
        }
        if (span.kind === "cresc-hairpin" || span.kind === "decresc-hairpin") {
          const y = span.y1 + 14;
          const open = span.kind === "cresc-hairpin" ? 3 : -3;
          return (
            <polyline
              key={span.id}
              points={`${span.x1},${y + open} ${span.x2},${y - open}`}
              fill="none"
              stroke="var(--hf-accent)"
              strokeWidth={1.5}
              opacity={0.9}
            />
          );
        }
        if (span.kind === "8va" || span.kind === "8vb") {
          return (
            <g key={span.id}>
              <line
                x1={span.x1}
                y1={span.y1 - 10}
                x2={span.x2}
                y2={span.y2 - 10}
                stroke="var(--hf-text-primary)"
                strokeWidth={1}
                strokeDasharray="4 3"
                opacity={0.8}
              />
              <text
                x={span.x1}
                y={span.y1 - 14}
                fontSize={9}
                fill="var(--hf-text-primary)"
                fontFamily="var(--font-mono, monospace)"
              >
                {span.kind}
              </text>
            </g>
          );
        }
        return null;
      })}
    </svg>
  );
}

/** Articulation glyph at notehead (including rests). */
export function articulationGlyphForNote(note: import("@/lib/music/scoreTypes").Note): string | null {
  const arts = note.articulations ?? [];
  const order = ["fermata", "a.", "a-", "a>", "a^", "staccatissimo", "breath-mark", "caesura"] as const;
  for (const key of order) {
    if (arts.includes(key) && ARTICULATION_GLYPHS[key]) return ARTICULATION_GLYPHS[key]!;
  }
  return null;
}

export function noteHasEngravingBadge(score: EditableScore, noteId: string): boolean {
  const hit = getNoteById(score, noteId);
  if (!hit) return false;
  return Boolean(articulationGlyphForNote(hit.note));
}
