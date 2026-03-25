import React from "react";
import { Music, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { SandboxContextMenu } from "./SandboxContextMenu";
import { RiffScoreEditor } from "@/components/score/RiffScoreEditor";
import type { EditableScore } from "@/lib/music/scoreTypes";
import type { NoteSelection } from "@/store/useScoreStore";
import type { ScoreCorrection } from "@/lib/music/suggestionTypes";

export interface ScoreCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
  staveLabels?: [string, string, string, string];
  showViolations?: boolean;
  /** Parsed score from MusicXML; when null, shows placeholder */
  score?: EditableScore | null;
  /** Called when user clicks on canvas background (e.g. to clear selection) */
  onCanvasClick?: () => void;
  /** Called when user clicks on empty staff area (for note placement). Receives partId, measureIndex, noteIndex. */
  onStaffClick?: (partId: string, measureIndex: number, noteIndex: number) => void;
  /** Current selection for highlight */
  selection?: NoteSelection[];
  /** Called when user clicks a note */
  onNoteClick?: (sel: NoteSelection, shiftKey: boolean) => void;
  /** Part IDs to show (empty = all) */
  visiblePartIds?: Set<string>;
  /** Pending AI corrections to render as ghost note overlays */
  pendingCorrections?: ScoreCorrection[];
  onAcceptCorrection?: (correctionId: string) => void;
  onRejectCorrection?: (correctionId: string) => void;
  /** Called when the score changes from within the editor (RiffScore user edits) */
  onScoreChange?: (score: EditableScore) => void;
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
      onCanvasClick,
      onStaffClick,
      selection = [],
      onNoteClick,
      visiblePartIds,
      pendingCorrections,
      onAcceptCorrection,
      onRejectCorrection,
      onScoreChange,
      className,
      ...props
    },
    ref,
  ) => {
    const [riffScoreCrashed, setRiffScoreCrashed] = React.useState(false);

    const handleRiffScoreError = React.useCallback(() => {
      setRiffScoreCrashed(true);
    }, []);

    React.useEffect(() => {
      setRiffScoreCrashed(false);
    }, [score]);

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

    // Remove duplicated/crashing conditional block - unify display rendering below

    return (
      <div
        ref={ref}
        className={cn("relative flex-1 min-h-[280px] overflow-hidden score-canvas-container", className)}
        role="img"
        aria-label="Score canvas — SATB grand staff"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("[data-note-hit]")) return;
          if (onStaffClick && score) {
            if (selection?.length) {
              const sel = selection[0];
              const part = score.parts.find((p) => p.id === sel.partId);
              const measure = part?.measures[sel.measureIndex];
              const noteIndex = measure ? Math.min(sel.noteIndex + 1, measure.notes.length) : 0;
              onStaffClick(sel.partId, sel.measureIndex, noteIndex);
            } else {
              const first = score.parts[0];
              if (first?.measures.length) {
                onStaffClick(first.id, 0, 0);
              } else {
                onCanvasClick?.();
              }
            }
          } else {
            onCanvasClick?.();
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        {...props}
      >
        {/* Static mockup — only when no score (placeholder) */}
        {!score && (
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
                style={{ fill: "var(--hf-detail)" }}
              />

              {/* ── Barline 1: x:340 ──────────────────────────── */}
              <rect
                x={340}
                y={40}
                width={1}
                height={255}
                style={{ fill: "var(--hf-detail)" }}
              />

              {/* ── Barline 2: x:600 ──────────────────────────── */}
              <rect
                x={600}
                y={40}
                width={1}
                height={255}
                style={{ fill: "var(--hf-detail)" }}
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

        {/* RiffScore editor when score exists */}
        {score && !riffScoreCrashed && (
          <div className="absolute inset-0 pointer-events-auto min-h-[280px]">
            <RiffScoreEditor
              score={score}
              className="w-full h-full"
              selection={selection}
              onNoteClick={onNoteClick}
              visiblePartIds={visiblePartIds}
              onError={handleRiffScoreError}
              onScoreChange={onScoreChange}
              pendingCorrections={pendingCorrections}
              onAcceptCorrection={onAcceptCorrection}
              onRejectCorrection={onRejectCorrection}
            />
          </div>
        )}

        <SandboxContextMenu />
      </div>
    );
  },
);

ScoreCanvas.displayName = "ScoreCanvas";