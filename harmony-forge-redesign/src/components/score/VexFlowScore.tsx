"use client";

import React, { useEffect, useRef, useState } from "react";
import VexFlow from "vexflow";
import type { EditableScore } from "@/lib/music/scoreTypes";
import { noteToEasyScoreNotation, notesToBeats, beatsToRestNotation } from "@/lib/music/vexflowHelpers";
import type { NoteSelection } from "@/store/useScoreStore";

const Factory = (VexFlow as unknown as { Factory: new (o: object) => object }).Factory;

export interface NotePosition {
  x: number;
  y: number;
  w: number;
  h: number;
  selection: NoteSelection;
}

export interface VexFlowScoreProps {
  score: EditableScore | null;
  className?: string;
  selection?: NoteSelection[];
  onNoteClick?: (sel: NoteSelection, shiftKey: boolean) => void;
  onNoteDrag?: (sel: NoteSelection, semitoneDelta: number) => void;
  visiblePartIds?: Set<string>;
  onError?: (err: Error) => void;
  onRendered?: (rendered: boolean) => void;
}

export function VexFlowScore({
  score,
  className,
  selection = [],
  onNoteClick,
  onNoteDrag,
  visiblePartIds,
  onError,
  onRendered,
}: VexFlowScoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [notePositions, setNotePositions] = useState<NotePosition[]>([]);
  const dragRef = useRef<{
    selection: NoteSelection;
    startY: number;
    shiftKey: boolean;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (Math.abs(e.clientY - drag.startY) > 4) {
        drag.moved = true;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      if (drag.moved && onNoteDrag) {
        const semitoneDelta = Math.round((drag.startY - e.clientY) / 6);
        if (semitoneDelta !== 0) {
          onNoteDrag(drag.selection, semitoneDelta);
        } else if (onNoteClick) {
          onNoteClick(drag.selection, drag.shiftKey);
        }
      } else if (onNoteClick) {
        onNoteClick(drag.selection, drag.shiftKey);
      }

      dragRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dragRef.current = null;
    };
  }, [onNoteClick, onNoteDrag]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !score) return;

    const clefMap: Record<string, string> = {
      treble: "treble",
      bass: "bass",
      alto: "alto",
      tenor: "tenor",
    };

    const partsToRender =
      visiblePartIds && visiblePartIds.size > 0
        ? score.parts.filter((p) => visiblePartIds.has(p.id))
        : score.parts;
    const safeParts = partsToRender.length > 0 ? partsToRender : score.parts;
    if (safeParts.length === 0) return;

    const applyDarkThemeInk = (root: HTMLElement) => {
      const svg = root.querySelector("svg");
      if (!svg) return;
      const ink = "var(--hf-text-primary)";
      const lineLike = svg.querySelectorAll("path, line, rect, ellipse, polygon");
      lineLike.forEach((el) => {
        const node = el as SVGElement;
        if (node.getAttribute("stroke")) node.setAttribute("stroke", ink);
        const fill = node.getAttribute("fill");
        if (fill && fill !== "none") node.setAttribute("fill", ink);
      });
      const textNodes = svg.querySelectorAll("text");
      textNodes.forEach((el) => {
        const node = el as SVGTextElement;
        node.setAttribute("fill", ink);
      });
    };

    const normalizeVerticalViewport = (root: HTMLElement) => {
      const svg = root.querySelector("svg");
      if (!svg) return;
      svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
      svg.style.width = "100%";
      svg.style.height = "auto";
      svg.style.display = "block";

      const noteLike = svg.querySelectorAll("ellipse, path");
      let minY = Number.POSITIVE_INFINITY;
      noteLike.forEach((el) => {
        const node = el as SVGGraphicsElement;
        if (typeof node.getBBox !== "function") return;
        try {
          const box = node.getBBox();
          if (box.height <= 0 || box.width <= 0) return;
          if (Number.isFinite(box.y)) {
            minY = Math.min(minY, box.y);
          }
        } catch {
          // Ignore invalid boxes from hidden groups.
        }
      });
      if (!Number.isFinite(minY)) return;
      if (minY < 120) return;

      const widthAttr = Number.parseFloat(svg.getAttribute("width") ?? "");
      const heightAttr = Number.parseFloat(svg.getAttribute("height") ?? "");
      if (!Number.isFinite(widthAttr) || !Number.isFinite(heightAttr)) return;
      const targetY = Math.max(0, minY - 56);
      svg.setAttribute("viewBox", `0 ${targetY} ${widthAttr} ${heightAttr}`);
      svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
    };

    const isMalformedVerticalPlacement = (root: HTMLElement): boolean => {
      const svg = root.querySelector("svg");
      if (!svg) return true;
      const noteLike = svg.querySelectorAll("ellipse, path");
      let minY = Number.POSITIVE_INFINITY;
      noteLike.forEach((el) => {
        const node = el as SVGGraphicsElement;
        if (typeof node.getBBox !== "function") return;
        try {
          const box = node.getBBox();
          if (box.height <= 0 || box.width <= 0) return;
          minY = Math.min(minY, box.y);
        } catch {
          // ignore
        }
      });
      if (!Number.isFinite(minY)) return true;
      const h = Math.max(root.clientHeight || 0, 1);
      return minY > h * 0.6;
    };

    let cancelled = false;

    const parseTimeSignatureBeats = (timeSignature?: string): number => {
      if (!timeSignature) return 4;
      const match = timeSignature.match(/^(\d+)\s*\/\s*(\d+)$/);
      if (!match) return 4;
      const num = Number.parseInt(match[1] ?? "4", 10);
      const den = Number.parseInt(match[2] ?? "4", 10);
      if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return 4;
      return (num * 4) / den;
    };

    const pitchToMidi = (pitch: string): number => {
      const m = pitch.match(/^([A-G])(#|b)?(\d+)$/);
      if (!m) return 60;
      const base: Record<string, number> = {
        C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
      };
      const step = m[1] ?? "C";
      const accidental = m[2] ?? "";
      const octave = Number.parseInt(m[3] ?? "4", 10);
      let midi = 12 * (octave + 1) + (base[step] ?? 0);
      if (accidental === "#") midi += 1;
      if (accidental === "b") midi -= 1;
      return midi;
    };

    const noteYForClef = (pitch: string, clef: string, staffTop: number): number => {
      const midi = pitchToMidi(pitch);
      const baseline = clef === "bass" ? 50 : clef === "alto" ? 57 : 64;
      const delta = midi - baseline;
      return staffTop + 32 - delta * 3;
    };

    const safeNotation = (raw: string): string => {
      const m = raw.match(/^([A-G](?:##|#|bb|b)?\d|B4)\/(w|h|q|8|16|32)(\.*)(?:\/r)?$/);
      if (!m) return "B4/q/r";
      return raw;
    };

    const buildHitboxes = (
      width: number,
      maxMeasures: number,
      parts: typeof safeParts,
    ): NotePosition[] => {
      const left = 26;
      const right = width - 26;
      const measureWidth = Math.max(80, (right - left) / Math.max(1, maxMeasures));
      const topStart = 24;
      const partGap = 92;
      const positions: NotePosition[] = [];
      parts.forEach((part, partIdx) => {
        const staffTop = topStart + partIdx * partGap;
        for (let mIdx = 0; mIdx < maxMeasures; mIdx++) {
          const notes = part.measures[mIdx]?.notes ?? [];
          if (notes.length === 0) continue;
          const x0 = left + mIdx * measureWidth;
          notes.forEach((note, nIdx) => {
            if (note.isRest) return;
            const denom = notes.length + 1;
            const x = x0 + ((nIdx + 1) / denom) * measureWidth;
            const y = noteYForClef(note.pitch, part.clef, staffTop);
            positions.push({
              x: Math.max(0, x - 10),
              y: Math.max(0, y - 10),
              w: 20,
              h: 20,
              selection: {
                partId: part.id,
                measureIndex: mIdx,
                noteIndex: nIdx,
                noteId: note.id,
              },
            });
          });
        }
      });
      return positions;
    };

    const renderScore = () => {
      if (cancelled || !container.isConnected) return;
      try {
        const width = Math.max(container.clientWidth || 900, 640);
        const height = Math.max(280, safeParts.length * 96 + 64);
        const renderId = `score-vf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        container.innerHTML = "";
        const renderDiv = document.createElement("div");
        renderDiv.id = renderId;
        renderDiv.style.width = "100%";
        renderDiv.style.height = "100%";
        container.appendChild(renderDiv);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vf = new Factory({ renderer: { elementId: renderId, width, height } }) as any;
        vf.initRenderer();
        const context = vf.getContext();
        const maxMeasures = Math.max(1, ...safeParts.map((p) => p.measures.length));
        const beatsPerMeasure = 4;
        const totalBeats = maxMeasures * beatsPerMeasure;

        safeParts.forEach((part, partIdx) => {
          const clef = clefMap[part.clef] ?? "treble";
          const tickables: unknown[] = [];
          for (let mIdx = 0; mIdx < maxMeasures; mIdx++) {
            const measure = part.measures[mIdx];
            const notes = measure?.notes ?? [];
            const inferredBeats = parseTimeSignatureBeats(measure?.timeSignature);
            const targetBeats = Number.isFinite(inferredBeats) && inferredBeats > 0 ? inferredBeats : beatsPerMeasure;
            const usedBeats = Math.round((notesToBeats(notes) || 0) * 1000) / 1000;
            const padBeats = Math.max(0, targetBeats - usedBeats);
            const notation = notes.length
              ? notes.map((n) => safeNotation(noteToEasyScoreNotation(n))).join(", ")
              : "B4/w/r";
            let measureTickables: unknown[] = [];
            try {
              measureTickables = vf.EasyScore().notes(notation, { clef });
            } catch {
              measureTickables = vf.EasyScore().notes("B4/w/r", { clef });
            }
            tickables.push(...measureTickables);
            if (padBeats > 0.001) {
              const restNotation = beatsToRestNotation(padBeats);
              if (restNotation) {
                try {
                  tickables.push(...vf.EasyScore().notes(restNotation, { clef }));
                } catch {
                  tickables.push(...vf.EasyScore().notes("B4/q/r", { clef }));
                }
              }
            }
            if (mIdx < maxMeasures - 1) {
              tickables.push(vf.BarNote({ type: "single" }));
            }
          }
          const voice = vf.Voice({ time: `${totalBeats}/4` });
          voice.setStrict(false);
          voice.addTickables(
            tickables as Parameters<ReturnType<typeof vf.Voice>["addTickables"]>[0],
          );
          const staveY = 36 + partIdx * 94;
          const stave = vf.Stave({ x: 20, y: staveY, width: width - 40 });
          stave.addClef(clef);
          if (partIdx === 0) stave.addTimeSignature("4/4");
          stave.setContext(context).draw();
          vf.Formatter().joinVoices([voice]).format([voice], width - 120);
          voice.draw(context, stave);
        });
        applyDarkThemeInk(renderDiv);
        normalizeVerticalViewport(renderDiv);
        if (isMalformedVerticalPlacement(renderDiv)) {
          renderDiv.style.display = "none";
          onRendered?.(false);
          setNotePositions([]);
          return;
        }
        const positions = buildHitboxes(width, maxMeasures, safeParts);
        setNotePositions(positions);
        onRendered?.(renderDiv.querySelector("svg") !== null && positions.length > 0);
      } catch (err) {
        console.error("VexFlow renderScore() error:", err);
        onError?.(err instanceof Error ? err : new Error(String(err)));
        onRendered?.(false);
        setNotePositions([]);
      }
    };

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(renderScore);
    });
    observer.observe(container);
    requestAnimationFrame(renderScore);

    return () => {
      cancelled = true;
      observer.disconnect();
      setNotePositions([]);
    };
  }, [score, visiblePartIds, onError, onRendered]);

  if (!score) return null;

  const selectedIds = new Set(selection.map((s) => s.noteId));

  return (
    <div className="relative w-full h-full min-h-[200px]" style={{ position: "relative" }}>
      <div
        ref={containerRef}
        className={className}
        style={{ width: "100%", height: "auto", minHeight: 200 }}
        aria-label="Score display"
      />
      {(onNoteClick || onNoteDrag) && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative w-full h-full pointer-events-auto">
            {notePositions.map((pos, i) => (
              <button
                key={`${pos.selection.noteId}-${i}`}
                type="button"
                data-note-hit
                className="absolute cursor-pointer border-0 p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded"
                style={{
                  left: pos.x - 4,
                  top: pos.y - 4,
                  width: pos.w + 8,
                  height: pos.h + 8,
                  backgroundColor: selectedIds.has(pos.selection.noteId) ? "rgba(255, 179, 0, 0.3)" : "transparent",
                  cursor: onNoteDrag ? "ns-resize" : "pointer",
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  dragRef.current = {
                    selection: pos.selection,
                    startY: e.clientY,
                    shiftKey: e.shiftKey,
                    moved: false,
                  };
                }}
                aria-label={`Note ${pos.selection.noteId}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}