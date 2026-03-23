"use client";

import { useEffect, useRef, useState } from "react";
import VexFlow from "vexflow";
import type { EditableScore } from "@/lib/music/scoreTypes";
import { noteToEasyScoreNotation, notesToBeats, beatsToRestNotation } from "@/lib/music/vexflowHelpers";
import type { NoteSelection } from "@/store/useScoreStore";
import type { ScoreCorrection } from "@/lib/music/suggestionTypes";
import { SuggestionOverlay } from "@/components/atoms/SuggestionOverlay";

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
  visiblePartIds?: Set<string>;
  onError?: (err: Error) => void;
  pendingCorrections?: ScoreCorrection[];
  onAcceptCorrection?: (correctionId: string) => void;
  onRejectCorrection?: (correctionId: string) => void;
}

export function VexFlowScore({ score, className, selection = [], onNoteClick, visiblePartIds, onError, pendingCorrections, onAcceptCorrection, onRejectCorrection }: VexFlowScoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const factoryRef = useRef<InstanceType<typeof Factory> | null>(null);
  const [notePositions, setNotePositions] = useState<NotePosition[]>([]);
  const renderingRef = useRef(false);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !score) return;

    const clefMap: Record<string, string> = {
      treble: "treble",
      bass: "bass",
      alto: "alto",
      tenor: "tenor",
    };

    let partsToRender =
      visiblePartIds && visiblePartIds.size > 0
        ? score.parts.filter((p) => visiblePartIds.has(p.id))
        : score.parts;
    if (partsToRender.length === 0) partsToRender = score.parts;
    if (partsToRender.length === 0) return;

    let cancelled = false;

    const render = (collectPositions: boolean) => {
      if (cancelled || !container.isConnected || renderingRef.current) return;
      renderingRef.current = true;

      try {
        const width = Math.max(container.clientWidth || 800, 400);
        const height = Math.max(container.clientHeight || 400, 280);

        container.innerHTML = "";
        const renderDiv = document.createElement("div");
        renderDiv.id = `score-vexflow-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        renderDiv.style.width = "100%";
        renderDiv.style.height = "100%";
        container.appendChild(renderDiv);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vf = new Factory({
          renderer: { elementId: renderDiv.id, width, height },
        }) as any;

        vf.initRenderer();
        const context = vf.getContext();
        context.clear();

        const system = vf.System({ x: 10, width: width - 20, spaceBetweenStaves: 12 });
        const maxMeasures = Math.max(1, ...partsToRender.map((p) => p.measures.length));
        const beatsPerMeasure = 4;
        const totalBeatsPerPart = maxMeasures * beatsPerMeasure;
        const timeSig = `${totalBeatsPerPart}/4`;

        for (const part of partsToRender) {
          const clef = clefMap[part.clef] ?? "treble";
          const tickables: unknown[] = [];

          for (let mIdx = 0; mIdx < maxMeasures; mIdx++) {
            const measure = part.measures[mIdx];
            const measureNotes = measure?.notes ?? [];

            const rawBeats = notesToBeats(measureNotes) || 0;
            const measureBeats = Math.round(rawBeats * 1000) / 1000;
            const padBeats = Math.max(0, beatsPerMeasure - measureBeats);

            const measureNotation = measureNotes.length
              ? measureNotes.map((n) => noteToEasyScoreNotation(n)).join(", ")
              : "";

            const measureTickables = measureNotation
              ? vf.EasyScore().notes(measureNotation, { clef })
              : vf.EasyScore().notes("B4/w/r", { clef });

            tickables.push(...measureTickables);

            if (padBeats > 0.001) {
              const restNotation = beatsToRestNotation(padBeats);
              if (restNotation) tickables.push(...vf.EasyScore().notes(restNotation, { clef }));
            }
            if (mIdx < maxMeasures - 1) {
              tickables.push(vf.BarNote({ type: "single" }));
            }
          }

          const voice = vf.Voice({ time: timeSig });
          voice.setStrict(false);
          voice.addTickables(tickables as Parameters<ReturnType<typeof vf.Voice>["addTickables"]>[0]);
          system.addStave({ voices: [voice] }).addClef(clef).addTimeSignature("4/4");
        }

        system.format();
        vf.draw();
        factoryRef.current = vf;

        if (collectPositions) {
          requestAnimationFrame(() => {
            if (cancelled) return;
            const positions: NotePosition[] = [];
            const svg = renderDiv.querySelector("svg");
            if (svg) {
              const containerRect = container.getBoundingClientRect();
              const allRects = svg.querySelectorAll("ellipse, path[fill]");
              let idx = 0;
              for (const part of partsToRender) {
                for (let mIdx = 0; mIdx < maxMeasures; mIdx++) {
                  const measure = part.measures[mIdx];
                  const measureNotes = measure?.notes ?? [];
                  const rawBeats = notesToBeats(measureNotes) || 0;
                  const measureBeats = Math.round(rawBeats * 1000) / 1000;
                  const padBeats = Math.max(0, beatsPerMeasure - measureBeats);

                  for (let nIdx = 0; nIdx < measureNotes.length; nIdx++) {
                    const note = measureNotes[nIdx];
                    const el = allRects[idx];
                    idx++;
                    if (el) {
                      const b = el.getBoundingClientRect();
                      positions.push({
                        x: b.left - containerRect.left + (container.scrollLeft || 0),
                        y: b.top - containerRect.top + (container.scrollTop || 0),
                        w: Math.max(b.width, 20),
                        h: Math.max(b.height, 20),
                        selection: { partId: part.id, measureIndex: mIdx, noteIndex: nIdx, noteId: note.id },
                      });
                    }
                  }
                  if (padBeats > 0.001) idx++;
                }
              }
            }
            setNotePositions(positions);
          });
        }
      } catch (err) {
        console.error("VexFlow render error:", err);
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        renderingRef.current = false;
      }
    };

    // Initial render with position collection
    requestAnimationFrame(() => {
      render(true);
    });

    // Debounced resize handler — skip if already rendering
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        render(true);
      }, 100);
    });
    resizeObserver.observe(container);

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      factoryRef.current = null;
    };
  }, [score, visiblePartIds, onError]);

  if (!score) return null;

  const selectedIds = new Set(selection.map((s) => s.noteId));

  return (
    <div className="relative w-full h-full min-h-[200px]" style={{ position: "relative" }}>
      <div
        ref={containerRef}
        className={className}
        style={{ width: "100%", height: "100%", minHeight: 200 }}
        aria-label="Score display"
      />
      {onNoteClick && (
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
                }}
                onClick={(e) => onNoteClick(pos.selection, e.shiftKey)}
                aria-label={`Note ${pos.selection.noteId}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Suggestion overlays — ghost notes + accept/reject badges */}
      {pendingCorrections && pendingCorrections.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative w-full h-full pointer-events-auto">
            {pendingCorrections.map((correction) => {
              const pos = notePositions.find(
                (p) => p.selection.noteId === correction.noteId,
              );
              if (!pos) return null;
              return (
                <SuggestionOverlay
                  key={correction.id}
                  correction={correction}
                  position={pos}
                  onAccept={() => onAcceptCorrection?.(correction.id)}
                  onReject={() => onRejectCorrection?.(correction.id)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}