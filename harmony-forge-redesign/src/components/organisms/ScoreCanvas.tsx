import React from "react";
import { Music, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { SandboxContextMenu } from "./SandboxContextMenu";
import { VexFlowScore } from "@/components/score/VexFlowScore";
import { OSMDPreview } from "@/components/score/OSMDPreview";
import type { EditableScore } from "@/lib/music/scoreTypes";
import type { NoteSelection } from "@/store/useScoreStore";
import type { EditCursor } from "@/store/useEditCursorStore";
import { getInsertIndexAtBeat, parseMeasureBeats } from "@/lib/music/scoreUtils";

export interface ScoreCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
  staveLabels?: [string, string, string, string];
  showViolations?: boolean;
  /** Parsed score from MusicXML; when null, shows placeholder */
  score?: EditableScore | null;
  /** Raw MusicXML string — when provided, uses OpenSheetMusicDisplay for reliable display (overrides score) */
  musicXML?: string | null;
  /** Called when user clicks on canvas background (e.g. to clear selection) */
  onCanvasClick?: () => void;
  /** Called when user clicks on empty staff area (for note placement). Receives partId, measureIndex, noteIndex. */
  onStaffClick?: (partId: string, measureIndex: number, noteIndex: number) => void;
  /** Current selection for highlight */
  selection?: NoteSelection[];
  /** Called when user clicks a note */
  onNoteClick?: (sel: NoteSelection, shiftKey: boolean) => void;
  /** Called when user drags a note vertically; semitoneDelta can be positive/negative. */
  onNoteDrag?: (sel: NoteSelection, semitoneDelta: number) => void;
  /** Part IDs to show (empty = all) */
  visiblePartIds?: Set<string>;
  /** When true, prefer VexFlow edit rendering over OSMD display rendering. */
  preferEditMode?: boolean;
  /** Measure-level highlights shown as vertical overlays in the notation area. */
  measureHighlights?: Array<{
    measureIndex: number;
    color: "red" | "blue";
    label?: string;
  }>;
  /** Semantic edit cursor (renderer-independent). */
  cursor?: EditCursor | null;
  /** Callback when cursor moves via beat-grid interaction. */
  onCursorChange?: (cursor: EditCursor) => void;
}

/**
 * ScoreCanvas Organism
 */
export const ScoreCanvas = React.forwardRef<HTMLDivElement, ScoreCanvasProps>(
  (
    {
      staveLabels = ["S", "A", "T", "B"],
      showViolations = false,
      score = null,
      musicXML = null,
      onCanvasClick,
      onStaffClick,
      selection = [],
      onNoteClick,
      onNoteDrag,
      visiblePartIds,
      preferEditMode = false,
      measureHighlights = [],
      cursor = null,
      onCursorChange,
      className,
      ...props
    },
    ref,
  ) => {
    const [vexFlowCrashed, setVexFlowCrashed] = React.useState(false);
    const [vexFlowRendered, setVexFlowRendered] = React.useState(false);

    const handleVexFlowError = React.useCallback(() => {
      setVexFlowCrashed(true);
    }, []);

    React.useEffect(() => {
      setVexFlowCrashed(false);
      setVexFlowRendered(false);
    }, [score]);

    // For context menu (fix: define openContextMenu)
    const openContextMenu = React.useCallback((x: number, y: number) => {
      // This should be implemented or imported from context.
      // For now, fallback to not throwing.
      // You can hook this up to a real context menu if desired.
      // (No-op)
    }, []);

    // Stave definitions matching Pencil absolute coords
    const staves = [
      { y: 40, lines: 5, label: staveLabels[0], labelY: 50 },
      { y: 105, lines: 5, label: staveLabels[1], labelY: 115 },
      { y: 186, lines: 4, label: staveLabels[2], labelY: 196 },
      { y: 251, lines: 5, label: staveLabels[3], labelY: 261 },
    ];

    // Notes: [x, y, color]
    const blueNotes: [number, number][] = [
      [120, 48],
      [120, 113],
      [120, 194],
      [120, 259],
    ];
    const amberNotes: [number, number][] = [
      [200, 52],
      [200, 117],
      [200, 198],
      [200, 263],
    ];
    const defaultNotes: [number, number][] = [
      [280, 44],
      [280, 109],
      [280, 190],
      [280, 255],
    ];

    const partsForGrid = React.useMemo(() => {
      if (!score) return [];
      const filtered =
        visiblePartIds && visiblePartIds.size > 0
          ? score.parts.filter((part) => visiblePartIds.has(part.id))
          : score.parts;
      return filtered.length > 0 ? filtered : score.parts;
    }, [score, visiblePartIds]);

    const maxMeasures = React.useMemo(() => {
      if (partsForGrid.length === 0) return 1;
      return Math.max(1, ...partsForGrid.map((part) => part.measures.length));
    }, [partsForGrid]);

    return (
      <div
        ref={ref}
        className={cn("relative flex-1 min-h-[280px] overflow-hidden score-canvas-container", className)}
        role="img"
        aria-label="Score canvas — SATB grand staff"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("[data-note-hit]")) return;
          if (target.closest("[data-grid-slot]")) return;
          onCanvasClick?.();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openContextMenu(e.clientX, e.clientY);
        }}
        {...props}
      >
        {/* Static mockup — only when no score and no musicXML (placeholder) */}
        {!score && !musicXML && (
          <>
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              aria-hidden="true"
            >
              {/* ── Stave lines ───────────────────────────────── */}
              {staves.map((stave, si) => {
                const lineSpacing = 8; // gap:8 between lines
                return (
                  <g key={si}>
                    {Array.from({ length: stave.lines }, (_, li) => (
                      <line
                        key={li}
                        x1={80}
                        x2={80 + 980}
                        y1={stave.y + li * lineSpacing}
                        y2={stave.y + li * lineSpacing}
                        strokeWidth={1}
                        style={{ stroke: "var(--hf-staff-line)" }}
                      />
                    ))}
                  </g>
                );
              })}

              {/* ── Voice labels — Instrument Serif fs:16 ─────── */}
              {staves.map((stave, si) => (
                <text
                  key={si}
                  x={60}
                  y={stave.labelY}
                  textAnchor="middle"
                  fontSize={16}
                  fontFamily="'Instrument Serif', serif"
                  style={{ fill: "var(--hf-text-secondary)" }}
                >
                  {stave.label}
                </text>
              ))}

              {/* ── System Brace: x:76 y:40 w:4 h:252 r:2 ──── */}
              <rect
                x={76}
                y={40}
                width={4}
                height={252}
                rx={2}
                style={{ fill: "var(--hf-staff-line)" }}
              />

              {/* ── Open barline: x:80 y:40 w:2 h:255 ────────── */}
              <rect
                x={80}
                y={40}
                width={2}
                height={255}
                style={{ fill: "var(--hf-text-primary)" }}
              />

              {/* ── Barline 1: x:340 ──────────────────────────── */}
              <rect
                x={340}
                y={40}
                width={1}
                height={255}
                style={{ fill: "var(--hf-text-primary)" }}
              />

              {/* ── Barline 2: x:600 ──────────────────────────── */}
              <rect
                x={600}
                y={40}
                width={1}
                height={255}
                style={{ fill: "var(--hf-text-primary)" }}
              />

              {/* Highlight overlays (drawn before notes so notes are on top) ── */}
              {showViolations && (
                <>
                  {/* BlueNoteHL: x:116 y:36 w:20 h:230 fill:#1976D21A stroke:#1976D2 r:2 */}
                  <rect
                    x={116}
                    y={36}
                    width={20}
                    height={230}
                    rx={2}
                    fill="#1976D21A"
                    stroke="#1976D2"
                    strokeWidth={1}
                  />

                  {/* OrangeNoteHL: x:196 y:36 w:20 h:230 fill:#FFB3001A stroke:#FFB300 r:2 */}
                  <rect
                    x={196}
                    y={36}
                    width={20}
                    height={230}
                    rx={2}
                    fill="#FFB3001A"
                    stroke="#FFB300"
                    strokeWidth={1}
                  />
                </>
              )}

              {/* ViolationOverlay: x:188 y:36 w:56 h:230 fill:violation/10 stroke:violation */}
              {showViolations && (
                <rect
                  x={188}
                  y={36}
                  width={56}
                  height={230}
                  style={{
                    fill: "var(--semantic-violation-10)",
                    stroke: "var(--semantic-violation)",
                  }}
                  strokeWidth={1}
                />
              )}

              {/* ── Stems ─────────────────────────────────────── */}
              <rect
                x={131}
                y={22}
                width={1}
                height={28}
                style={{
                  fill: showViolations ? "#1976D2" : "var(--hf-text-primary)",
                }}
              />
              <rect
                x={211}
                y={26}
                width={1}
                height={28}
                style={{
                  fill: showViolations ? "#FFB300" : "var(--hf-text-primary)",
                }}
              />
              <rect
                x={291}
                y={18}
                width={1}
                height={28}
                style={{ fill: "var(--hf-text-primary)" }}
              />

              {/* ── Blue notes ────────────────────────────────── */}
              {blueNotes.map(([x, y], i) => (
                <ellipse
                  key={i}
                  cx={x}
                  cy={y}
                  rx={6}
                  ry={4.5}
                  style={{
                    fill: showViolations ? "#1976D2" : "var(--hf-text-primary)",
                  }}
                />
              ))}

              {/* ── Amber notes ───────────────────────────────── */}
              {amberNotes.map(([x, y], i) => (
                <ellipse
                  key={i}
                  cx={x}
                  cy={y}
                  rx={6}
                  ry={4.5}
                  style={{
                    fill: showViolations ? "#FFB300" : "var(--hf-text-primary)",
                  }}
                />
              ))}

              {/* ── Default notes ─────────────────────────────── */}
              {defaultNotes.map(([x, y], i) => (
                <ellipse
                  key={i}
                  cx={x}
                  cy={y}
                  rx={6}
                  ry={4.5}
                  style={{ fill: "var(--hf-text-primary)" }}
                />
              ))}
            </svg>

            {/* ── Badges (HTML overlays) — only when no score and no musicXML ── */}
            {showViolations && (
              <>
                {/* BlueBadge: x:114 y:24 fill:#1976D2 */}
                <div
                  className="absolute flex items-center justify-center w-[24px] h-[24px] rounded-full"
                  style={{ left: 114, top: 24, backgroundColor: "#1976D2" }}
                  aria-label="Blue note group"
                  role="img"
                >
                  <Music
                    className="w-[12px] h-[12px] text-white"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>

                {/* AmberBadge: x:190 y:24 fill:#FFB300 */}
                <div
                  className="absolute flex items-center justify-center w-[24px] h-[24px] rounded-full"
                  style={{ left: 190, top: 24, backgroundColor: "#FFB300" }}
                  aria-label="Amber note group"
                  role="img"
                >
                  <Music
                    className="w-[12px] h-[12px] text-white"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>

                {/* ViolBadge */}
                <div
                  className="absolute flex items-center justify-center w-[24px] h-[24px] rounded-full"
                  style={{
                    left: 220,
                    top: 24,
                    backgroundColor: "var(--semantic-violation)",
                  }}
                  aria-label="Voice-leading violation"
                  role="img"
                >
                  <TriangleAlert
                    className="w-[12px] h-[12px] text-white"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>
              </>
            )}

            {/* "No score loaded" message */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-body text-sm">No score loaded. Upload and generate to edit.</span>
            </div>
          </>
        )}

        {/* Default to reliable display (OSMD) unless edit mode is explicitly requested. */}
        {musicXML && !preferEditMode ? (
          <div className="absolute inset-0 pointer-events-auto min-h-[280px]">
            <OSMDPreview musicXML={musicXML} className="w-full h-full" minHeight={280} />
          </div>
        ) : score && !vexFlowCrashed ? (
          <div className="absolute inset-0 pointer-events-auto min-h-[280px]">
            <VexFlowScore
              score={score}
              className="w-full h-full"
              selection={selection}
              onNoteClick={onNoteClick}
              onNoteDrag={onNoteDrag}
              visiblePartIds={visiblePartIds}
              onError={handleVexFlowError}
              onRendered={setVexFlowRendered}
            />
          </div>
        ) : musicXML ? (
          <div className="absolute inset-0 pointer-events-auto min-h-[280px]">
            <OSMDPreview musicXML={musicXML} className="w-full h-full" minHeight={280} />
          </div>
        ) : null}

        {preferEditMode && musicXML && !vexFlowCrashed && !vexFlowRendered && (
          <div className="absolute inset-0 pointer-events-none">
            <OSMDPreview musicXML={musicXML} className="w-full h-full" minHeight={280} />
            <div className="absolute top-2 right-2 rounded px-2 py-1 text-[11px] font-mono bg-black/50 text-white">
              Edit renderer still loading; showing safe preview
            </div>
          </div>
        )}

        {preferEditMode && score && onStaffClick && partsForGrid.length > 0 && (
          <div className="absolute inset-0 pointer-events-none z-20" aria-hidden="true">
            {partsForGrid.map((part, partIdx) => {
              const topPct = (partIdx / partsForGrid.length) * 100;
              const heightPct = 100 / partsForGrid.length;
              return (
                <div
                  key={`grid-part-${part.id}`}
                  className="absolute left-0 right-0"
                  style={{ top: `${topPct}%`, height: `${heightPct}%` }}
                >
                  {Array.from({ length: maxMeasures }).map((_, measureIndex) => {
                    const measure = part.measures[measureIndex];
                    const beats = parseMeasureBeats(measure?.timeSignature);
                    const subdivision = beats >= 3 ? 0.5 : 0.25;
                    const slotCount = Math.max(1, Math.round(beats / subdivision));
                    const leftPct = (measureIndex / maxMeasures) * 100;
                    const widthPct = 100 / maxMeasures;

                    return (
                      <div
                        key={`grid-${part.id}-${measureIndex}`}
                        className="absolute top-0 bottom-0"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      >
                        {Array.from({ length: slotCount + 1 }).map((__, slotIndex) => {
                          const beat = Math.min(beats, slotIndex * subdivision);
                          const noteIndex = measure
                            ? getInsertIndexAtBeat(measure, beat)
                            : 0;
                          const slotLeft = (slotIndex / Math.max(1, slotCount)) * 100;
                          const isCursor =
                            cursor?.partId === part.id &&
                            cursor.measureIndex === measureIndex &&
                            Math.abs(cursor.beat - beat) < 0.001;

                          return (
                            <React.Fragment key={`slot-${part.id}-${measureIndex}-${slotIndex}`}>
                              <button
                                type="button"
                                data-grid-slot
                                className="absolute top-0 bottom-0 pointer-events-auto"
                                style={{
                                  left: `${slotLeft}%`,
                                  width: `${100 / Math.max(1, slotCount)}%`,
                                  background: "transparent",
                                }}
                                onClick={(evt) => {
                                  evt.stopPropagation();
                                  onStaffClick(part.id, measureIndex, noteIndex);
                                  onCursorChange?.({
                                    partId: part.id,
                                    measureIndex,
                                    beat,
                                    noteIndex,
                                  });
                                }}
                                title={`Part ${part.name}, measure ${measureIndex + 1}, beat ${beat.toFixed(2)}`}
                              />
                              {isCursor && (
                                <div
                                  className="absolute top-0 bottom-0"
                                  style={{
                                    left: `${slotLeft}%`,
                                    width: "2px",
                                    backgroundColor: "var(--hf-accent)",
                                  }}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {score && measureHighlights.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {measureHighlights.map((highlight) => {
              const maxMeasures = Math.max(
                1,
                ...score.parts.map((part) => part.measures.length),
              );
              const leftPct = (highlight.measureIndex / maxMeasures) * 100;
              const widthPct = Math.max(100 / maxMeasures, 3);
              const fillColor =
                highlight.color === "red"
                  ? "color-mix(in srgb, var(--semantic-violation) 18%, transparent)"
                  : "color-mix(in srgb, #1976d2 16%, transparent)";
              const borderColor =
                highlight.color === "red" ? "var(--semantic-violation)" : "#1976d2";
              return (
                <div
                  key={`${highlight.color}-${highlight.measureIndex}-${highlight.label ?? ""}`}
                  className="absolute top-0 bottom-0 rounded-[2px]"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    backgroundColor: fillColor,
                    border: `1px solid ${borderColor}`,
                    borderTop: "none",
                    borderBottom: "none",
                  }}
                  title={
                    highlight.label
                      ? `Measure ${highlight.measureIndex + 1}: ${highlight.label}`
                      : `Measure ${highlight.measureIndex + 1}`
                  }
                />
              );
            })}
          </div>
        )}

        <SandboxContextMenu />
      </div>
    );
  },
);

ScoreCanvas.displayName = "ScoreCanvas";