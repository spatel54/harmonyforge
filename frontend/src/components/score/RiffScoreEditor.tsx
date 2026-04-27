"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Mic, Wind, Bell, Music, Music2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTheme as useNextTheme } from "next-themes";
import "riffscore/styles.css";
import type { MusicEditorAPI, Selection as RsSelection } from "riffscore";

function selectEventsInMeasureOnStaff(
  api: MusicEditorAPI,
  measureIndex: number,
  staffIndex: number,
  eventCount: number,
) {
  api.deselectAll();
  if (eventCount <= 0) {
    api.select(measureIndex + 1, staffIndex, 0);
    return;
  }
  api.select(measureIndex + 1, staffIndex, 0);
  for (let e = 1; e < eventCount; e++) {
    api.addToSelection(measureIndex + 1, staffIndex, e);
  }
}
import type { EditableScore, NotePosition } from "@/lib/music/scoreTypes";
import { laySummaryForIssueHighlight, type ScoreIssueHighlight } from "@/lib/music/inspectorTypes";
import {
  DEFAULT_NOTE_HIGHLIGHT_PAD,
  tightNoteHighlightRect,
} from "@/lib/music/noteHighlightRect";
import type { NoteSelection } from "@/store/useScoreStore";
import { useScoreStore } from "@/store/useScoreStore";
import { useToolStore } from "@/store/useToolStore";
import type { ScoreCorrection } from "@/lib/music/suggestionTypes";
import {
  editableScoreToRiffConfig,
  hfNotePitchFromLiveRsScore,
  shouldShowChordNotation,
} from "@/lib/music/riffscoreAdapter";
import { cn } from "@/lib/utils";
import {
  cloneScore,
  getNoteById,
  setNoteDynamics,
  toggleNoteDots,
  toggleNoteRests,
  transposeNotes,
} from "@/lib/music/scoreUtils";
import { scoreToMusicXML } from "@/lib/music/scoreToMusicXML";
import { getLiveScoreAfterFlush } from "@/lib/music/liveScoreExport";
import { useRiffScoreSync } from "@/hooks/useRiffScoreSync";
import {
  extractNotePositions,
  extractStaffLabelLayout,
  findNoteInputPreviewLayout,
  getRiffScoreScrollRoots,
  pickRestDomHitAt,
  pitchAtStaffVerticalInContainer,
  midStaffDiatonicPitchInContainer,
  restGhostNoteheadLayoutInContainer,
  mapRiffSelectedNotesToHFSelections,
  measurePartFromCanvasPoint,
  type StaffLabelLayout,
} from "@/lib/music/riffscorePositions";
import { formatLearnerLetterName } from "@/lib/music/learnerPitchLabel";
import { RiffScoreSuggestionOverlay } from "./RiffScoreSuggestionOverlay";
import { PlaybackScrubOverlay } from "./PlaybackScrubOverlay";
import type { RiffScoreSessionHandles } from "@/context/RiffScoreSessionContext";
import { mapSandboxToolbarActionToToolId, type SandboxToolbarActionId } from "./toolbarActionMap";

/** Map an instrument name to a recognisable Lucide icon by family. */
function getInstrumentIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (/\b(flute|oboe|clarinet|bassoon|saxophone|sax|piccolo|recorder)\b/.test(n)) return Wind;
  if (/\b(trumpet|horn|trombone|tuba|cornet|bugle|flugelhorn)\b/.test(n)) return Bell;
  if (/\b(violin|viola|cello|string|guitar|harp|double bass|contrabass|lute)\b/.test(n)) return Music2;
  if (/\b(voice|vocal|singer|soprano|alto|tenor|baritone|mezzo)\b/.test(n) || n.endsWith(" voice")) return Mic;
  return Music;
}

/** Generated instrument images — fuzzy-matched by lowercase name fragment. */
const INSTRUMENT_IMAGE_MAP: Array<{ keys: string[]; src: string }> = [
  { keys: ["soprano voice", "soprano"], src: "/instruments/soprano_voice.svg" },
  { keys: ["flute"],                    src: "/instruments/flute.svg" },
  { keys: ["oboe"],                     src: "/instruments/oboe.svg" },
  { keys: ["violin"],                   src: "/instruments/violin_i.svg" },
  { keys: ["alto voice", "alto"],       src: "/instruments/alto_voice.svg" },
  { keys: ["clarinet"],                 src: "/instruments/clarinet.svg" },
  { keys: ["viola"],                    src: "/instruments/viola.svg" },
  { keys: ["french horn", "horn"],      src: "/instruments/french_horn.svg" },
  { keys: ["tenor voice", "tenor"],     src: "/instruments/tenor_voice.svg" },
  { keys: ["trumpet"],                  src: "/instruments/trumpet.svg" },
  { keys: ["cello"],                    src: "/instruments/cello.svg" },
  { keys: ["trombone"],                 src: "/instruments/trombone.svg" },
  { keys: ["bass voice", "bass"],       src: "/instruments/bass_voice.svg" },
  { keys: ["bassoon"],                  src: "/instruments/bassoon.svg" },
  { keys: ["double bass", "contrabass"], src: "/instruments/double_bass.svg" },
  { keys: ["tuba"],                     src: "/instruments/tuba.svg" },
];

function getInstrumentImage(name: string): string | null {
  const n = name.toLowerCase();
  // More specific matches first (longer key wins)
  const sorted = [...INSTRUMENT_IMAGE_MAP].sort((a, b) =>
    Math.max(...b.keys.map((k) => k.length)) - Math.max(...a.keys.map((k) => k.length)),
  );
  for (const entry of sorted) {
    if (entry.keys.some((k) => n.includes(k))) return entry.src;
  }
  return null;
}

/** Hit-test a rendered rest by overlay coordinates (container-relative). */
function pickRestHitAt(
  score: EditableScore,
  notePositions: NotePosition[],
  mx: number,
  my: number,
  pad = 8,
): { sel: NoteSelection; pos: NotePosition; staffIndex: number } | null {
  for (const pos of notePositions) {
    const part = score.parts.find((p) => p.id === pos.selection.partId);
    const measure = part?.measures[pos.selection.measureIndex];
    const n = measure?.notes[pos.selection.noteIndex];
    if (!n?.isRest) continue;
    if (
      mx >= pos.x - pad &&
      my >= pos.y - pad &&
      mx <= pos.x + pos.w + pad &&
      my <= pos.y + pos.h + pad
    ) {
      const staffIndex = score.parts.findIndex((p) => p.id === pos.selection.partId);
      if (staffIndex < 0) continue;
      return { sel: pos.selection, pos, staffIndex };
    }
  }
  return null;
}

/** Union of rest bbox and staff ghost so clicks on the enlarged preview still commit. */
function restGhostCommitHitBox(
  pos: NotePosition,
  ghost: { centerX: number; centerY: number; fontSize: number } | null,
): { left: number; top: number; width: number; height: number } {
  const pad = 8;
  const px = Number.isFinite(pos.x) ? pos.x : 0;
  const py = Number.isFinite(pos.y) ? pos.y : 0;
  const pw = Number.isFinite(pos.w) ? Math.max(pos.w, 1) : 12;
  const ph = Number.isFinite(pos.h) ? Math.max(pos.h, 1) : 12;
  const restL = px - pad;
  const restT = py - pad;
  const restW = Math.max(pw + pad * 2, 24);
  const restH = Math.max(ph + pad * 2, 24);
  const restR = restL + restW;
  const restB = restT + restH;

  if (
    !ghost ||
    !Number.isFinite(ghost.centerX) ||
    !Number.isFinite(ghost.centerY) ||
    !Number.isFinite(ghost.fontSize)
  ) {
    return {
      left: Math.max(0, restL),
      top: Math.max(0, restT),
      width: restW,
      height: restH,
    };
  }

  const half = Math.max(ghost.fontSize * 0.72, 22);
  const labelPadX = ghost.fontSize * 0.95;
  const labelPadY = ghost.fontSize * 0.55;
  const gL = ghost.centerX - half;
  const gR = ghost.centerX + half + labelPadX;
  const gT = ghost.centerY - half;
  const gB = ghost.centerY + half * 0.45 + labelPadY;

  const left = Math.max(0, Math.min(restL, gL));
  const top = Math.max(0, Math.min(restT, gT));
  const right = Math.max(restR, gR);
  const bottom = Math.max(restB, gB);
  return {
    left,
    top,
    width: Math.max(28, right - left),
    height: Math.max(28, bottom - top),
  };
}

/** Padding around extracted note/rest boxes — matches gutter hit slop in riffscorePositions. */
const NOTE_OR_REST_CANVAS_HIT_PAD = 14;

function canvasPointHitsAnyNoteOrRest(
  mx: number,
  my: number,
  positions: readonly NotePosition[],
  pad = NOTE_OR_REST_CANVAS_HIT_PAD,
): boolean {
  for (const pos of positions) {
    if (
      mx >= pos.x - pad &&
      mx <= pos.x + pos.w + pad &&
      my >= pos.y - pad &&
      my <= pos.y + pos.h + pad
    ) {
      return true;
    }
  }
  return false;
}

// Dynamic import — RiffScore manipulates DOM/SVG and cannot SSR
const RiffScoreComponent = dynamic(
  () => import("riffscore").then((mod) => mod.RiffScore),
  { ssr: false },
);

export interface RiffScoreEditorProps {
  score: EditableScore | null;
  className?: string;
  selection?: NoteSelection[];
  onNoteClick?: (sel: NoteSelection, shiftKey: boolean) => void;
  /** Full editor selection (click, shift-range, marquee, Cmd+A in editor) — replaces HF tool-store selection. */
  onEditorSelectionChange?: (selections: NoteSelection[]) => void;
  noteInspectionEnabled?: boolean;
  onError?: (err: Error) => void;
  pendingCorrections?: ScoreCorrection[];
  onAcceptCorrection?: (correctionId: string) => void;
  onRejectCorrection?: (correctionId: string) => void;
  issueHighlights?: ScoreIssueHighlight[];
  /** Theory Inspector: tint these note ids (measure/part focus), separate from violation highlights */
  focusHighlightNoteIds?: readonly string[];
  /** User picked a measure on the canvas — parent sets Zustand focus + facts (optional part = one staff only). */
  onInspectorSelectMeasure?: (measureIndex: number, partId?: string) => void;
  /** User picked a staff label — 0-based staff index aligned with score.parts */
  onInspectorSelectPart?: (staffIndex: number) => void;
  /** Multi-select in RiffScore inferred measure- or part-wide focus */
  onInspectorInferredRegion?: (
    region:
      | { kind: "measure"; measureIndex: number; partId?: string }
      | { kind: "part"; staffIndex: number },
  ) => void;
  /** Exposes flush + RiffScore-native undo/redo for sandbox / Theory Inspector. */
  onSessionReady?: (session: RiffScoreSessionHandles) => void;
  /** Show scientific pitch next to RiffScore's note-input preview ghost */
  noteInputPitchLabelEnabled?: boolean;
  /** Show letter + accidental (e.g. C, F#, Bb) above each notehead — learner aid; off for export when parent passes false. */
  showNoteNameLabels?: boolean;
  /**
   * When `presentation` is true, pitch labels are hidden unless this is true (Document preview only).
   * Never set on export/print roots.
   */
  allowNoteNameLabelsInPresentation?: boolean;
  /** Present-only flag: hide editor chrome (toolbar, fabs) for export/print capture. */
  presentation?: boolean;
  /** When false, RiffScore does not accept edits (View mode in sandbox). Default true. */
  enableScoreEditing?: boolean;
  /** Dropping a notation-panel symbol onto the score runs the same tool id as a click. */
  onPaletteSymbolDrop?: (toolId: string) => void;
  /** Fired when the RiffScore editor API is ready (e.g. document preview playback). */
  onEditorApiReady?: (api: MusicEditorAPI) => void;
  /** Instance id registered on `window.riffScore` — lets parents resolve the API if React state lags. */
  onRiffInstanceId?: (instanceId: string) => void;
  /**
   * Hover a rest to show a pitch ghost from pointer Y on the staff; click commits replacement
   * (MuseScore / Noteflight-style). Parent should use the slot’s duration/dots, not a toolbar duration.
   */
  onRestInputCommit?: (selection: NoteSelection, pitch: string) => void;
  /**
   * Pointer went down on “empty” score canvas (not a note/rest hit, not measure-bar pick).
   * Parent should clear tool selection, RiffScore selection, and any inspector score focus tint.
   */
  onScoreBackgroundInteract?: () => void;
  /**
   * Optional: intercept toolbar actions before editor fallbacks. Return `false` to run
   * fallbacks (flush + `getActiveNoteIds` for transforms). Prefer leaving unset on sandbox.
   */
  onToolbarAction?: (toolId: string, sourceActionId: SandboxToolbarActionId) => boolean | void;
  /** Score-only print (e.g. sandbox `printScoreOnly`); falls back to `window.print` if unset. */
  onToolbarPrint?: () => void;
}

export function RiffScoreEditor({
  score,
  className,
  selection = [],
  onNoteClick,
  onEditorSelectionChange,
  noteInspectionEnabled = false,
  onError,
  pendingCorrections,
  onAcceptCorrection,
  onRejectCorrection,
  issueHighlights = [],
  focusHighlightNoteIds = [],
  onInspectorSelectMeasure,
  onInspectorSelectPart,
  onInspectorInferredRegion,
  onSessionReady,
  noteInputPitchLabelEnabled = false,
  showNoteNameLabels = false,
  allowNoteNameLabelsInPresentation = false,
  presentation = false,
  enableScoreEditing = true,
  onPaletteSymbolDrop,
  onEditorApiReady,
  onRiffInstanceId,
  onRestInputCommit,
  onScoreBackgroundInteract,
  onToolbarAction,
  onToolbarPrint,
}: RiffScoreEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<MusicEditorAPI | null>(null);
  const [instanceId] = useState(() => `hf-score-${Date.now()}`);
  const [notePositions, setNotePositions] = useState<NotePosition[]>([]);
  const scoreHoverRef = useRef<EditableScore | null>(score);
  scoreHoverRef.current = score;
  const notePositionsHoverRef = useRef<NotePosition[]>(notePositions);
  notePositionsHoverRef.current = notePositions;
  const onRestInputCommitRef = useRef(onRestInputCommit);
  onRestInputCommitRef.current = onRestInputCommit;
  const onScoreBackgroundInteractRef = useRef(onScoreBackgroundInteract);
  onScoreBackgroundInteractRef.current = onScoreBackgroundInteract;
  const [staffLabelLayouts, setStaffLabelLayouts] = useState<StaffLabelLayout[]>([]);
  const [staffLabelsUseOverlay, setStaffLabelsUseOverlay] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const restHoverGateRef = useRef({
    presentation,
    noteInspectionEnabled,
    enableScoreEditing,
    isReady,
  });
  restHoverGateRef.current = { presentation, noteInspectionEnabled, enableScoreEditing, isReady };
  const hasScore = score != null;
  const [inputPreviewLabel, setInputPreviewLabel] = useState<{
    pitch: string;
    left: number;
    top: number;
  } | null>(null);
  /** Pixels to clip from the top of the learner overlay so labels never paint over `.riff-Toolbar`. */
  const [learnerClipTopPx, setLearnerClipTopPx] = useState(0);
  /** Same inset for theory/selection/focus pills — overlays are sibling to RiffScore and would otherwise paint over the toolbar when scrolling. */
  const [scoreOverlayClipTopPx, setScoreOverlayClipTopPx] = useState(0);
  /** Mount target for playback scrub (inside `.riff-ScoreEditor__content`, below the toolbar). */
  const [playbackScrubPortalHost, setPlaybackScrubPortalHost] = useState<HTMLElement | null>(null);
  const prevScoreRef = useRef<EditableScore | null>(null);
  /** HF ids from the last true multi-select; retained while RiffScore reports only the dragged primary note. */
  const pitchGroupRef = useRef<Set<string>>(new Set());
  /** Score snapshot at pointerdown for live multi-note pitch drag (propagate vs frozen baseline). */
  const multiPitchBaselineRef = useRef<EditableScore | null>(null);

  const { resolvedTheme } = useNextTheme();
  /** Print / export preview must stay on light “paper” so RiffScore’s black glyphs remain visible. */
  const rsTheme =
    presentation || resolvedTheme !== "dark" ? ("LIGHT" as const) : ("DARK" as const);
  const applyScore = useScoreStore((s) => s.applyScore);

  const getPitchGroupNoteIds = useCallback((): Set<string> => {
    const fromSel = new Set(selection.map((s) => s.noteId));
    if (fromSel.size >= 2) {
      pitchGroupRef.current = new Set(fromSel);
      return new Set(pitchGroupRef.current);
    }
    if (pitchGroupRef.current.size >= 2) return new Set(pitchGroupRef.current);
    return fromSel;
  }, [selection]);

  const { pushToRiffScore, getRsToHf, flushToZustand, syncMultiPitchFromBaseline, resetMultiPitchDragSync } =
    useRiffScoreSync(apiRef, score, getPitchGroupNoteIds);
  const flushToZustandRef = useRef(flushToZustand);
  flushToZustandRef.current = flushToZustand;
  const runEditorHistoryOp = useCallback((op: "undo" | "redo") => {
    const api = apiRef.current;
    if (!api) return;
    // Ensure the latest editor state is in Zustand first, then execute history,
    // then sync back so toolbar/hotkeys feel single-press reliable.
    flushToZustandRef.current();
    requestAnimationFrame(() => {
      if (op === "undo") api.undo();
      else api.redo();
      requestAnimationFrame(() => flushToZustandRef.current());
    });
  }, []);
  const getRsToHfRef = useRef(getRsToHf);
  getRsToHfRef.current = getRsToHf;
  const syncMultiPitchFromBaselineRef = useRef(syncMultiPitchFromBaseline);
  syncMultiPitchFromBaselineRef.current = syncMultiPitchFromBaseline;
  const getPitchGroupNoteIdsRef = useRef(getPitchGroupNoteIds);
  getPitchGroupNoteIdsRef.current = getPitchGroupNoteIds;
  const selectedNoteIds = useMemo(() => new Set(selection.map((s) => s.noteId)), [selection]);
  const hasSelection = selectedNoteIds.size > 0;
  const focusHighlightSet = useMemo(
    () => new Set(focusHighlightNoteIds),
    [focusHighlightNoteIds],
  );
  const measureCount = score?.parts[0]?.measures.length ?? 0;
  const notePositionsRef = useRef(notePositions);
  notePositionsRef.current = notePositions;
  const issueHighlightsRef = useRef(issueHighlights);
  issueHighlightsRef.current = issueHighlights;
  const [issueHighlightTooltip, setIssueHighlightTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const onInspectorSelectMeasureRef = useRef(onInspectorSelectMeasure);
  onInspectorSelectMeasureRef.current = onInspectorSelectMeasure;

  const downloadXml = () => {
    const live = getLiveScoreAfterFlush(
      { flushToZustand: () => flushToZustandRef.current() },
      () => useScoreStore.getState().score ?? score,
    );
    if (!live) return;
    const blob = new Blob([scoreToMusicXML(live)], { type: "application/xml" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = "harmony-forge-score.xml";
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  const runToolbarAction = useCallback(
    (actionId: SandboxToolbarActionId, fallback: () => void) => {
      const toolId = mapSandboxToolbarActionToToolId(actionId);
      if (toolId && onToolbarAction) {
        const handled = onToolbarAction(toolId, actionId);
        if (handled !== false) return;
      }
      fallback();
    },
    [onToolbarAction],
  );

  const runSelectStaffInRiffScore = (staffIndex: number) => {
    const api = apiRef.current;
    if (!api) return;
    api.select(1, staffIndex, 0);
    api.selectAll("staff");
  };

  const getActiveNoteIds = (): Set<string> => {
    const fromGroup = getPitchGroupNoteIdsRef.current();
    if (fromGroup.size > 0) return fromGroup;
    const api = apiRef.current;
    const liveScore = useScoreStore.getState().score ?? score;
    if (api && liveScore) {
      try {
        const sel = api.getSelection() as {
          selectedNotes?: Array<{
            staffIndex: number;
            measureIndex: number;
            eventId: string;
            noteId: string | null;
          }>;
        };
        const sn = sel.selectedNotes ?? [];
        if (sn.length > 0) {
          const mapped = mapRiffSelectedNotesToHFSelections(liveScore, sn, getRsToHfRef.current());
          const fromApi = new Set(mapped.map((m) => m.noteId));
          if (fromApi.size > 0) return fromApi;
        }
      } catch {
        /* ignore */
      }
    }
    const fromStore = new Set(useToolStore.getState().selection.map((s) => s.noteId));
    if (fromStore.size > 0) return fromStore;
    return selectedNoteIds;
  };

  const getActiveNoteIdsRef = useRef(getActiveNoteIds);
  getActiveNoteIdsRef.current = getActiveNoteIds;

  const getTransposeTargetNoteIds = useCallback((): Set<string> => {
    flushToZustandRef.current();
    return getActiveNoteIdsRef.current();
  }, []);

  const applyOnSelection = (transform: (current: EditableScore, noteIds: Set<string>) => EditableScore) => {
    if (!score) return;
    // Toolbar clicks can race with selection sync; flush first, then apply on next
    // frame using live editor/store selection so actions fire on first click.
    flushToZustandRef.current();
    requestAnimationFrame(() => {
      const liveScore = useScoreStore.getState().score ?? score;
      const ids = getActiveNoteIds();
      if (ids.size === 0) return;
      const next = transform(liveScore, ids);
      applyScore(next);
    });
  };

  const toggleSelectedRests = () => {
    if (!score) return;
    flushToZustandRef.current();
    requestAnimationFrame(() => {
      const liveScore = useScoreStore.getState().score ?? score;
      const ids = getActiveNoteIds();
      if (ids.size === 0) return;
      applyScore(toggleNoteRests(liveScore, ids));
    });
  };

  /* RiffScore toolbar: onClick handlers read apiRef only when the user clicks, not during render. */
  const toolbarPlugins = useMemo(
    () => {
      const plugins: Array<{
        id: string;
        label: string;
        title: string;
        icon: ReactNode;
        onClick: () => void;
        showLabel?: boolean;
        isActive?: boolean;
        disabled?: boolean;
        isEmphasized?: boolean;
        isDashed?: boolean;
        className?: string;
      }> = [];

      plugins.push(
        {
          id: "hf-action-undo",
          label: "Undo",
          title: "Undo last edit (⌘Z)",
          icon: <span className="text-[10px] font-semibold">UN</span>,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () => {
            runToolbarAction("hf-action-undo", () => runEditorHistoryOp("undo"));
          },
        },
        {
          id: "hf-action-redo",
          label: "Redo",
          title: "Redo last edit (⇧⌘Z)",
          icon: <span className="text-[10px] font-semibold">RE</span>,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () => {
            runToolbarAction("hf-action-redo", () => runEditorHistoryOp("redo"));
          },
        },
        {
          id: "hf-action-transpose-up",
          label: "+ Semitone",
          title: "Transpose selected notes up one semitone (↑)",
          icon: <span className="text-[10px] font-semibold">+1</span>,
          disabled: !hasSelection,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () =>
            runToolbarAction("hf-action-transpose-up", () =>
              applyOnSelection((current, ids) => transposeNotes(current, ids, 1)),
            ),
        },
        {
          id: "hf-action-transpose-down",
          label: "− Semitone",
          title: "Transpose selected notes down one semitone (↓)",
          icon: <span className="text-[10px] font-semibold">-1</span>,
          disabled: !hasSelection,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () =>
            runToolbarAction("hf-action-transpose-down", () =>
              applyOnSelection((current, ids) => transposeNotes(current, ids, -1)),
            ),
        },
        {
          id: "hf-action-octave-up",
          label: "Octave ↑",
          title: "Transpose selected notes up one octave (⌘/Ctrl+↑ — also handled in sandbox keys)",
          icon: <span className="text-[10px] font-semibold">8+</span>,
          disabled: !hasSelection,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () =>
            runToolbarAction("hf-action-octave-up", () =>
              applyOnSelection((current, ids) => transposeNotes(current, ids, 12)),
            ),
        },
        {
          id: "hf-action-octave-down",
          label: "Octave ↓",
          title: "Transpose selected notes down one octave (⌘/Ctrl+↓ — also handled in sandbox keys)",
          icon: <span className="text-[10px] font-semibold">8-</span>,
          disabled: !hasSelection,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () =>
            runToolbarAction("hf-action-octave-down", () =>
              applyOnSelection((current, ids) => transposeNotes(current, ids, -12)),
            ),
        },
        {
          id: "hf-action-dot-toggle",
          label: "Dotted",
          title: "Add/remove a dot on selected notes (. key)",
          icon: <span className="text-[10px] font-semibold">DOT</span>,
          disabled: !hasSelection,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () =>
            runToolbarAction("hf-action-dot-toggle", () =>
              applyOnSelection((current, ids) => toggleNoteDots(current, ids)),
            ),
        },
        {
          id: "hf-action-rest-toggle",
          label: "Rest",
          title: "Swap selection between note and rest (0)",
          icon: <span className="text-[10px] font-semibold">RST</span>,
          disabled: !hasSelection,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () => runToolbarAction("hf-action-rest-toggle", toggleSelectedRests),
        },
        {
          id: "hf-action-dyn-p",
          label: "Piano",
          title: "Mark selection piano (soft — p)",
          icon: <span className="text-[10px] font-semibold">p</span>,
          disabled: !hasSelection,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () =>
            runToolbarAction("hf-action-dyn-p", () =>
              applyOnSelection((current, ids) => setNoteDynamics(current, ids, "p")),
            ),
        },
        {
          id: "hf-action-dyn-f",
          label: "Forte",
          title: "Mark selection forte (loud — f)",
          icon: <span className="text-[10px] font-semibold">f</span>,
          disabled: !hasSelection,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () =>
            runToolbarAction("hf-action-dyn-f", () =>
              applyOnSelection((current, ids) => setNoteDynamics(current, ids, "f")),
            ),
        },
        {
          id: "hf-action-export-xml",
          label: "Export XML",
          title: "Download the score as MusicXML",
          icon: <span className="text-[10px] font-semibold">XML</span>,
          disabled: !score,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () => runToolbarAction("hf-action-export-xml", downloadXml),
        },
        {
          id: "hf-action-print",
          label: "Print",
          title: "Print the current score (⌘P)",
          icon: <span className="text-[10px] font-semibold">PRN</span>,
          disabled: !score,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () =>
            runToolbarAction("hf-action-print", () => {
              if (onToolbarPrint) onToolbarPrint();
              else window.print();
            }),
        },
      );

      return plugins;
    },
    // `applyOnSelection` / `downloadXml` / `toggleSelectedRests` are inline helpers
    // closed over the state we already depend on; including them would force the
    // memo to recompute every render and fight RiffScore's toolbar identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasSelection, score, selectedNoteIds, runEditorHistoryOp, runToolbarAction, onToolbarPrint],
  );

  // Build config from score, passing current theme
  const config = useMemo(
    () =>
      score
        ? editableScoreToRiffConfig(score, {
            theme: rsTheme,
            toolbarPlugins: presentation ? [] : toolbarPlugins,
            showToolbar: !presentation,
            enableScoreEditing: presentation ? false : enableScoreEditing,
          })
        : undefined,
    [score, rsTheme, toolbarPlugins, presentation, enableScoreEditing],
  );

  /**
   * Noteflight / MuseScore repitch hint — when exactly one rest is selected
   * tell the user they can type A–G to put a note back in its place.
   */
  const restHint = useMemo(() => {
    if (presentation) return null;
    if (!score || selection.length !== 1) return null;
    const only = selection[0]!;
    const part = score.parts.find((p) => p.id === only.partId);
    const measure = part?.measures[only.measureIndex];
    const note = measure?.notes.find((n) => n.id === only.noteId);
    if (!note?.isRest) return null;
    const pos = notePositions.find((p) => p.selection.noteId === only.noteId);
    if (!pos) return null;
    return { left: pos.x, top: pos.y + pos.h + 6 };
  }, [presentation, score, selection, notePositions]);

  const [restHoverGhost, setRestHoverGhost] = useState<{
    sel: NoteSelection;
    pos: NotePosition;
    pitch: string;
    ghostLayout: { centerX: number; centerY: number; fontSize: number } | null;
  } | null>(null);

  // Primitives-only deps: avoid Next 16 + Turbopack + React 19 "dependency array changed size"
  // when `score` / callbacks would be rewritten by the compiler (see docs/progress.md).
  useEffect(() => {
    const gate = restHoverGateRef.current;
    if (
      gate.presentation ||
      gate.noteInspectionEnabled ||
      !gate.enableScoreEditing ||
      !scoreHoverRef.current ||
      !gate.isReady ||
      !hasScore
    ) {
      setRestHoverGhost(null);
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;
    let pending: PointerEvent | null = null;

    const flush = (e: PointerEvent) => {
      const g = restHoverGateRef.current;
      const commitFn = onRestInputCommitRef.current;
      const s = scoreHoverRef.current;
      if (!commitFn || g.presentation || g.noteInspectionEnabled || !g.enableScoreEditing || !s || !g.isReady) {
        setRestHoverGhost(null);
        return;
      }
      const positions = notePositionsHoverRef.current;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const target = e.target as HTMLElement | null;

      if (target?.closest?.("[data-hf-rest-ghost-root]")) {
        setRestHoverGhost((prev) => {
          if (!prev) return null;
          const si = s.parts.findIndex((p) => p.id === prev.sel.partId);
          if (si < 0) return prev;
          const pitch =
            pitchAtStaffVerticalInContainer(el, s, si, my) ??
            midStaffDiatonicPitchInContainer(el, s, si) ??
            prev.pitch;
          if (prev.pitch === pitch) return prev;
          const ax = prev.pos.x + prev.pos.w / 2;
          const ghostLayout = Number.isFinite(ax)
            ? restGhostNoteheadLayoutInContainer(el, s, si, ax, pitch, my)
            : null;
          return { ...prev, pitch, ghostLayout };
        });
        return;
      }

      let hit = pickRestHitAt(s, positions, mx, my);
      if (!hit) {
        hit = pickRestDomHitAt(el, s, e.clientX, e.clientY, getRsToHfRef.current());
      }
      if (!hit) {
        setRestHoverGhost(null);
        return;
      }
      const pitch =
        pitchAtStaffVerticalInContainer(el, s, hit.staffIndex, my) ??
        midStaffDiatonicPitchInContainer(el, s, hit.staffIndex);
      if (!pitch) {
        setRestHoverGhost(null);
        return;
      }
      setRestHoverGhost((prev) => {
        if (
          prev &&
          prev.sel.noteId === hit.sel.noteId &&
          prev.pitch === pitch &&
          prev.pos.x === hit.pos.x &&
          prev.pos.y === hit.pos.y
        ) {
          return prev;
        }
        const ax = hit.pos.x + hit.pos.w / 2;
        const ghostLayout = Number.isFinite(ax)
          ? restGhostNoteheadLayoutInContainer(el, s, hit.staffIndex, ax, pitch, my)
          : null;
        return { sel: hit.sel, pos: hit.pos, pitch, ghostLayout };
      });
    };

    const onMove = (e: PointerEvent) => {
      pending = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (pending) flush(pending);
        pending = null;
      });
    };

    /** Touch has no hover—run one hit-test on contact so the rest ghost appears immediately. */
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      flush(e);
    };

    const onLeave = () => {
      pending = null;
      setRestHoverGhost(null);
    };

    // Capture: RiffScore may stop propagation on the SVG; we still need moves for rest hit-test.
    el.addEventListener("pointermove", onMove, { capture: true });
    el.addEventListener("pointerdown", onDown, { capture: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove, { capture: true });
      el.removeEventListener("pointerdown", onDown, { capture: true });
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [isReady, presentation, noteInspectionEnabled, enableScoreEditing, hasScore]);

  /** Hover tooltip for Theory Inspector issue tints — pointer-events stay on the score for editing. */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || presentation || issueHighlights.length === 0) {
      setIssueHighlightTooltip(null);
      return;
    }
    let raf = 0;
    const flush = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const positions = notePositionsRef.current;
      for (const h of issueHighlightsRef.current) {
        const pos = positions.find((p) => p.selection.noteId === h.noteId);
        if (!pos) continue;
        const box = tightNoteHighlightRect(pos, DEFAULT_NOTE_HIGHLIGHT_PAD, DEFAULT_NOTE_HIGHLIGHT_PAD);
        if (
          mx >= box.left &&
          mx <= box.left + box.width &&
          my >= box.top &&
          my <= box.top + box.height
        ) {
          setIssueHighlightTooltip({
            text: laySummaryForIssueHighlight(h),
            x: e.clientX,
            y: e.clientY,
          });
          return;
        }
      }
      setIssueHighlightTooltip(null);
    };
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        flush(e);
      });
    };
    const onLeave = () => setIssueHighlightTooltip(null);
    el.addEventListener("pointermove", onMove, { capture: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove, { capture: true });
      el.removeEventListener("pointerleave", onLeave);
      setIssueHighlightTooltip(null);
    };
  }, [presentation, issueHighlights.length, isReady]);

  useEffect(() => {
    onRiffInstanceId?.(instanceId);
  }, [instanceId, onRiffInstanceId]);

  /**
   * Multi-note pitch drag: capture a baseline on pointerdown, sync on RiffScore `score` events so every
   * selected note moves with the dragged one, then flush once on pointerup.
   */
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !isReady || presentation) return;
    let moveRaf = 0;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      resetMultiPitchDragSync();
      const toolLen = useToolStore.getState().selection.length;
      const groupOk = pitchGroupRef.current.size >= 2 || toolLen >= 2;
      if (!groupOk) {
        multiPitchBaselineRef.current = null;
        return;
      }
      const live = useScoreStore.getState().score;
      multiPitchBaselineRef.current = live ? cloneScore(live) : null;
    };
    const onMove = (e: PointerEvent) => {
      if ((e.buttons & 1) === 0) return;
      const baseline = multiPitchBaselineRef.current;
      if (!baseline) return;
      if (moveRaf) return;
      moveRaf = requestAnimationFrame(() => {
        moveRaf = 0;
        const b = multiPitchBaselineRef.current;
        if (!b) return;
        const groupIds = getPitchGroupNoteIdsRef.current();
        if (groupIds.size < 2) return;
        syncMultiPitchFromBaselineRef.current(b, groupIds);
      });
    };
    const onUp = (e: PointerEvent) => {
      if (e.button !== 0) return;
      multiPitchBaselineRef.current = null;
      resetMultiPitchDragSync();
      const toolLen = useToolStore.getState().selection.length;
      if (pitchGroupRef.current.size < 2 && toolLen < 2) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => flushToZustandRef.current());
      });
    };
    root.addEventListener("pointerdown", onDown, { capture: true });
    root.addEventListener("pointermove", onMove, { capture: true });
    root.addEventListener("pointerup", onUp, { capture: true });
    return () => {
      if (moveRaf) cancelAnimationFrame(moveRaf);
      root.removeEventListener("pointerdown", onDown, { capture: true });
      root.removeEventListener("pointermove", onMove, { capture: true });
      root.removeEventListener("pointerup", onUp, { capture: true });
    };
  }, [isReady, presentation, resetMultiPitchDragSync]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api || !isReady || presentation || !enableScoreEditing) return;
    let raf = 0;
    const onScore = () => {
      const baseline = multiPitchBaselineRef.current;
      if (!baseline) return;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const groupIds = getPitchGroupNoteIds();
        if (groupIds.size < 2) return;
        syncMultiPitchFromBaseline(baseline, groupIds);
      });
    };
    const unsub = api.on("score", onScore);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      unsub();
    };
  }, [isReady, presentation, enableScoreEditing, getPitchGroupNoteIds, syncMultiPitchFromBaseline]);

  // Acquire the API handle once RiffScore mounts
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tryAcquire = () => {
      const registry = (window as unknown as Record<string, unknown>).riffScore as
        | { get: (id: string) => MusicEditorAPI | undefined }
        | undefined;
      if (registry) {
        const api = registry.get(instanceId);
        if (api) {
          apiRef.current = api;
          setIsReady(true);
          return true;
        }
      }
      return false;
    };

    if (tryAcquire()) return;

    // Poll briefly if not immediately available (dynamic import + Strict Mode can exceed a few hundred ms)
    const interval = setInterval(() => {
      if (tryAcquire()) clearInterval(interval);
    }, 50);
    const timeout = setTimeout(() => clearInterval(interval), 10_000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [instanceId]);

  useEffect(() => {
    if (!isReady || !onSessionReady) return;
    const session: RiffScoreSessionHandles = {
      flushToZustand,
      editorUndo: () => {
        runEditorHistoryOp("undo");
      },
      editorRedo: () => {
        runEditorHistoryOp("redo");
      },
      editorSelectAll: () => {
        apiRef.current?.selectAll("score");
      },
      editorDeselectAll: () => {
        apiRef.current?.deselectAll();
      },
      getPitchGroupNoteIds,
      getTransposeTargetNoteIds,
    };
    onSessionReady(session);
  }, [isReady, onSessionReady, flushToZustand, getPitchGroupNoteIds, getTransposeTargetNoteIds, runEditorHistoryOp]);

  useEffect(() => {
    if (!isReady || !onEditorApiReady) return;
    const api = apiRef.current;
    if (api) onEditorApiReady(api);
  }, [isReady, onEditorApiReady, score]);

  // Push score to RiffScore when it changes externally (e.g., undo/redo, file load)
  useEffect(() => {
    if (!isReady || !score) return;
    // Only push if the score reference actually changed (not from our own pull)
    if (score !== prevScoreRef.current) {
      prevScoreRef.current = score;
      pushToRiffScore();
    }
  }, [isReady, score, pushToRiffScore]);

  // Extract note positions after renders for overlay positioning
  useEffect(() => {
    if (!isReady || !containerRef.current || !score) return;

    let scrollRaf = 0;
    const updatePositions = () => {
      if (!containerRef.current) return;
      const positions = extractNotePositions(containerRef.current, score, getRsToHf());
      setNotePositions(positions);
      const layouts = extractStaffLabelLayout(containerRef.current, score.parts.length);
      const overlayOk =
        layouts.length === score.parts.length &&
        layouts.every((l) => l.height >= 4);
      setStaffLabelsUseOverlay(overlayOk);
      setStaffLabelLayouts(overlayOk ? layouts : []);
    };

    const scheduleFromScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        updatePositions();
      });
    };

    // Wait for RiffScore to render
    const timer = setTimeout(updatePositions, 200);

    // Re-extract on resize
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updatePositions, 100);
    });
    resizeObserver.observe(containerRef.current);

    const scrollRoots = getRiffScoreScrollRoots(containerRef.current);
    for (const el of scrollRoots) {
      el.addEventListener("scroll", scheduleFromScroll, { passive: true });
    }

    const svg =
      containerRef.current.querySelector<SVGSVGElement>("svg.riff-ScoreCanvas__svg") ??
      containerRef.current.querySelector<SVGSVGElement>(".riff-ScoreCanvas svg");
    let mutationObserver: MutationObserver | null = null;
    if (showNoteNameLabels && svg) {
      mutationObserver = new MutationObserver(scheduleFromScroll);
      mutationObserver.observe(svg, { subtree: true, childList: true, attributes: true });
    }

    const skipLearnerPositionRefresh = new Set([
      "init",
      "select",
      "selectAtQuant",
      "selectById",
      "selectEvent",
      "selectRangeTo",
      "addToSelection",
      "deselectAll",
      "selectAll",
      "extendSelectionUp",
      "extendSelectionDown",
      "extendSelectionAllStaves",
      "selectFullEvents",
      "play",
      "pause",
      "stop",
      "rewind",
      "setTheme",
      "setZoom",
      "setInputMode",
      "clearStatus",
      "debug",
      "jump",
      "move",
    ]);
    const api = apiRef.current;
    let unsubOperation: (() => void) | undefined;
    if (showNoteNameLabels && api) {
      unsubOperation = api.on("operation", (r) => {
        if (r.ok === false) return;
        if (skipLearnerPositionRefresh.has(r.method)) return;
        scheduleFromScroll();
      });
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      mutationObserver?.disconnect();
      unsubOperation?.();
      for (const el of scrollRoots) {
        el.removeEventListener("scroll", scheduleFromScroll);
      }
    };
  }, [isReady, score, getRsToHf, showNoteNameLabels]);

  useLayoutEffect(() => {
    if (presentation) {
      setLearnerClipTopPx(0);
      setScoreOverlayClipTopPx(0);
      return;
    }
    const root = containerRef.current;
    if (!root) return;

    const measure = () => {
      const tb = root.querySelector(".riff-Toolbar");
      if (!tb) {
        setLearnerClipTopPx(0);
        setScoreOverlayClipTopPx(0);
        return;
      }
      const cr = root.getBoundingClientRect();
      const br = tb.getBoundingClientRect();
      const clipTop = Math.max(0, Math.round(br.bottom - cr.top));
      setScoreOverlayClipTopPx(clipTop);
      setLearnerClipTopPx(showNoteNameLabels ? clipTop : 0);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    const tbEl = root.querySelector(".riff-Toolbar");
    if (tbEl) ro.observe(tbEl);
    return () => ro.disconnect();
  }, [showNoteNameLabels, presentation, isReady, instanceId, score]);

  useLayoutEffect(() => {
    if (presentation || !isReady) {
      setPlaybackScrubPortalHost(null);
      return;
    }
    const root = containerRef.current;
    if (!root) return;

    const syncHost = () => {
      const content = root.querySelector<HTMLElement>(".riff-ScoreEditor__content");
      setPlaybackScrubPortalHost((prev) => (prev === content ? prev : content ?? null));
    };

    syncHost();
    const ro = new ResizeObserver(syncHost);
    ro.observe(root);
    const contentEl = root.querySelector(".riff-ScoreEditor__content");
    if (contentEl) ro.observe(contentEl);
    return () => ro.disconnect();
  }, [presentation, isReady, instanceId, score]);

  useEffect(() => {
    if (!noteInputPitchLabelEnabled || !isReady || !score) {
      setInputPreviewLabel(null);
      return;
    }
    let frame = 0;
    const loop = () => {
      const el = containerRef.current;
      if (el) {
        const layout = findNoteInputPreviewLayout(el, score);
        setInputPreviewLabel((prev) => {
          if (
            prev?.pitch === layout?.pitch &&
            prev?.left === layout?.left &&
            prev?.top === layout?.top
          ) {
            return prev;
          }
          return layout;
        });
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      setInputPreviewLabel(null);
    };
  }, [noteInputPitchLabelEnabled, isReady, score]);

  // Subscribe to selection events — sync multi-select / marquee to HF; optional inspector region hints
  useEffect(() => {
    const api = apiRef.current;
    if (!api || (!onEditorSelectionChange && !onNoteClick && !onInspectorInferredRegion)) return;

    const unsub = api.on("selection", (sel: unknown) => {
      const rsSel = sel as RsSelection;
      if (!score) return;

      const selected = rsSel.selectedNotes;
      if (selected.length === 0) {
        pitchGroupRef.current = new Set();
        onEditorSelectionChange?.([]);
        return;
      }

      if (noteInspectionEnabled && onInspectorInferredRegion && selected.length > 1 && score) {
        const m0 = selected[0]!.measureIndex;
        const allSameMeasure = selected.every((n) => n.measureIndex === m0);
        if (allSameMeasure) {
          const staffSet = new Set(selected.map((n) => n.staffIndex));
          if (staffSet.size === 1) {
            const si = selected[0]!.staffIndex;
            const partId = score.parts[si]?.id;
            onInspectorInferredRegion({
              kind: "measure",
              measureIndex: m0,
              ...(partId ? { partId } : {}),
            });
          } else {
            onInspectorInferredRegion({ kind: "measure", measureIndex: m0 });
          }
        } else {
          const s0 = selected[0]!.staffIndex;
          const allSameStaff = selected.every((n) => n.staffIndex === s0);
          const measureSet = new Set(selected.map((n) => n.measureIndex));
          if (allSameStaff && measureSet.size > 1) {
            onInspectorInferredRegion({ kind: "part", staffIndex: s0 });
          }
        }
      }

      if (onEditorSelectionChange) {
        const mapped = mapRiffSelectedNotesToHFSelections(score, selected, getRsToHf());
        const ids = mapped.map((m) => m.noteId);
        if (ids.length >= 2) {
          pitchGroupRef.current = new Set(ids);
        } else if (ids.length === 1) {
          const id = ids[0]!;
          if (pitchGroupRef.current.size >= 2 && pitchGroupRef.current.has(id)) {
            /* keep group — RiffScore often collapses to the dragged primary note */
          } else {
            pitchGroupRef.current = new Set(ids);
          }
        } else {
          pitchGroupRef.current = new Set();
        }
        onEditorSelectionChange(mapped);
        return;
      }

      if (!onNoteClick) return;

      const first = selected[0]!;
      if (!first.noteId) return;

      const hfNoteId = getRsToHf().get(first.noteId) ?? first.noteId;
      const found = getNoteById(score, hfNoteId);
      if (found) {
        onNoteClick(
          {
            partId: found.part.id,
            measureIndex: found.measureIdx,
            noteIndex: found.noteIdx,
            noteId: hfNoteId,
          },
          false,
        );
        return;
      }

      const part = score.parts[first.staffIndex];
      if (!part) return;

      const hfSel: NoteSelection = {
        partId: part.id,
        measureIndex: first.measureIndex,
        noteIndex: 0,
        noteId: hfNoteId,
      };

      const measure = part.measures[first.measureIndex];
      if (measure) {
        const idx = measure.notes.findIndex((n) => n.id === hfNoteId);
        if (idx >= 0) hfSel.noteIndex = idx;
      }

      onNoteClick(hfSel, false);
    });

    return unsub;
  }, [
    isReady,
    noteInspectionEnabled,
    onInspectorInferredRegion,
    onEditorSelectionChange,
    onNoteClick,
    score,
    getRsToHf,
  ]);

  // Subscribe to errors
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !onError) return;

    const unsub = api.on("error", (result: unknown) => {
      const r = result as { message?: string };
      onError(new Error(r.message ?? "RiffScore error"));
    });

    return unsub;
  }, [isReady, onError]);

  /**
   * Measure gutter: select full bar on that staff. Empty canvas: dismiss HF + RiffScore selection
   * and inspector tint (parent `onScoreBackgroundInteract`). Clicks rarely bubble to ScoreCanvas.
   */
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !isReady || presentation || !score) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (e.shiftKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as Node | null;
      if (root.querySelector(".riff-Toolbar")?.contains(t)) return;
      if (t instanceof Element && t.closest("[data-hf-rest-ghost-root]")) return;
      if (t instanceof Element && t.closest("button,a,input,textarea,select,[role='button']")) {
        return;
      }

      const rect = root.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (enableScoreEditing && measureCount > 0) {
        const hit = measurePartFromCanvasPoint(notePositionsRef.current, mx, my);
        if (hit) {
          const staffIndex = score.parts.findIndex((p) => p.id === hit.partId);
          if (staffIndex >= 0) {
            e.preventDefault();
            e.stopPropagation();
            const api = apiRef.current;
            const nEvents =
              score.parts[staffIndex]?.measures[hit.measureIndex]?.notes.length ?? 0;
            if (api) {
              selectEventsInMeasureOnStaff(api, hit.measureIndex, staffIndex, nEvents);
            }
            onInspectorSelectMeasureRef.current?.(hit.measureIndex, hit.partId);
            return;
          }
        }
      }

      const dismiss = onScoreBackgroundInteractRef.current;
      if (!dismiss) return;
      const positionsNow = notePositionsRef.current;
      if (positionsNow.length === 0) return;
      if (canvasPointHitsAnyNoteOrRest(mx, my, positionsNow)) return;

      e.preventDefault();
      e.stopPropagation();
      dismiss();
    };

    root.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => root.removeEventListener("pointerdown", onPointerDown, { capture: true });
  }, [isReady, presentation, enableScoreEditing, measureCount, score]);

  const onPaletteDragOverCapture = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!onPaletteSymbolDrop) return;
      if (![...e.dataTransfer.types].includes("application/x-hf-palette-item")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    [onPaletteSymbolDrop],
  );

  const onPaletteDropCapture = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!onPaletteSymbolDrop) return;
      const raw = e.dataTransfer.getData("application/x-hf-palette-item");
      if (!raw) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        const parsed = JSON.parse(raw) as { toolId?: string };
        if (parsed.toolId) onPaletteSymbolDrop(parsed.toolId);
      } catch {
        /* ignore malformed drop payload */
      }
    },
    [onPaletteSymbolDrop],
  );

  // ↑/↓ pitch (and other score shortcuts): rely on RiffScore interaction.enableKeyboard only.
  // Document preview never passes HF `selection`, so native behavior matches Configuration there.
  // A window-level transpose listener here conflicted with RiffScore when `selection` was set (sandbox).

  const handleKeyDown = useCallback(() => {
    // Reserved for wrapper-level shortcuts if needed.
  }, []);

  if (!score || !config) return null;

  const selectedIds = new Set(selection.map((s) => s.noteId));

  const chordUiOn = Boolean(score && shouldShowChordNotation(score));

  const clipUnderRiffToolbarStyle: CSSProperties | undefined =
    !presentation && scoreOverlayClipTopPx > 0
      ? { clipPath: `inset(${scoreOverlayClipTopPx}px 0 0 0)` }
      : undefined;

  return (
    <>
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full min-h-[200px] riffscore-hf-wrapper",
        presentation && "riffscore-hf-wrapper--presentation",
        showNoteNameLabels && (!presentation || allowNoteNameLabelsInPresentation) && "pt-5",
        className,
      )}
      data-hf-chord-ui={chordUiOn ? "1" : "0"}
      style={{
        position: "relative",
        ...(presentation ? {} : { touchAction: "none" as const }),
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onDragOverCapture={onPaletteSymbolDrop ? onPaletteDragOverCapture : undefined}
      onDropCapture={onPaletteSymbolDrop ? onPaletteDropCapture : undefined}
    >
      {/* Override RiffScore styles to match HarmonyForge design system */}
      <style>{`
        .riffscore-hf-wrapper .RiffScore {
          --riff-color-primary: var(--hf-accent, #ffb300) !important;
          --riff-color-primary-hover: #e6a200 !important;
          --riff-color-active-bg: var(--hf-accent, #ffb300) !important;
        }
        .riffscore-hf-wrapper .RiffScore,
        .riffscore-hf-wrapper .RiffScore > div,
        .riffscore-hf-wrapper .riff-ScoreEditor,
        .riffscore-hf-wrapper .riff-ScoreEditor__content {
          background: transparent !important;
        }
        /* Multi-staff scores: RiffScore defaults to overflow:hidden on __content, which
           clips lower instruments. Let the editor body scroll vertically (and horizontally
           for wide scores) inside the sandbox column. */
        .riffscore-hf-wrapper .RiffScore {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          min-height: 0 !important;
        }
        .riffscore-hf-wrapper .riff-ScoreEditor {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          height: 100% !important;
        }
        .riffscore-hf-wrapper .riff-ScoreEditor__content {
          position: relative !important;
          overflow: auto !important;
          min-height: 0 !important;
          scroll-behavior: smooth !important;
          overscroll-behavior: contain !important;
        }
        /* Presentation preview: use RiffScore's native horizontal scroller target. */
        .riffscore-hf-wrapper.riffscore-hf-wrapper--presentation .riff-ScoreEditor__content {
          overflow: hidden !important;
        }
        .riffscore-hf-wrapper.riffscore-hf-wrapper--presentation .riff-ScoreCanvas {
          overflow-x: auto !important;
          overflow-y: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          pointer-events: auto !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .riffscore-hf-wrapper .riff-ScoreEditor__content {
            scroll-behavior: auto !important;
          }
        }
        .riffscore-hf-wrapper .riff-ScoreCanvas {
          background: transparent !important;
        }
        /* Draggable HarmonyForge scrub line replaces the built-in cursor hit-testing */
        .riffscore-hf-wrapper [data-testid="playback-cursor"] {
          opacity: 0 !important;
        }
        /* Fewer than 3 staves: hide RiffScore chord track (avoids misleading Cm7 hover). */
        .riffscore-hf-wrapper[data-hf-chord-ui="0"] g.riff-ChordTrack,
        .riffscore-hf-wrapper[data-hf-chord-ui="0"] [data-testid="chord-track"] {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        /* Hide RiffScore "Library" (melody presets) — scores come from upload/generate, not bundled melodies. */
        .riffscore-hf-wrapper .riff-Toolbar__library-wrapper {
          display: none !important;
        }
        .riffscore-hf-wrapper .riff-Toolbar__row > *:has(+ .riff-Toolbar__library-wrapper) {
          display: none !important;
        }
        /*
         * Iter6 cursor fix:
         *   - Default cursor for the whole wrapper (beats any crosshair/+ from RiffScore).
         *   - Grab cursor only on SVG noteheads (path/text elements) so the user knows
         *     those are interactive — not the whole canvas area.
         *   - Grabbing while pointer is held down.
         */
        .riffscore-hf-wrapper {
          cursor: default !important;
        }
        .riffscore-hf-wrapper .riff-ScoreCanvas {
          cursor: default !important;
        }
        .riffscore-hf-wrapper .riff-ScoreCanvas__svg text,
        .riffscore-hf-wrapper .riff-ScoreCanvas__svg path {
          cursor: pointer !important;
        }
        .riffscore-hf-wrapper .riff-ScoreCanvas__svg text:active,
        .riffscore-hf-wrapper .riff-ScoreCanvas__svg path:active {
          cursor: grabbing !important;
        }
        /* Toolbar: show caption under native RiffScore tool buttons */
        /* Keep native toolbar above HF absolute overlays (siblings paint after RiffScore). */
        .riffscore-hf-wrapper .riff-Toolbar {
          position: relative !important;
          z-index: 60 !important;
          background: var(--hf-bg) !important;
          box-shadow: 0 1px 0 color-mix(in srgb, var(--hf-detail) 40%, transparent) !important;
        }
        .riffscore-hf-wrapper .riff-ToolbarButton {
          flex-direction: column !important;
          gap: 1px !important;
          align-items: center !important;
        }
        .riffscore-hf-wrapper .riff-ToolbarButton .riff-ToolbarButton__label {
          display: block !important;
          font-size: 8px !important;
          line-height: 1.05 !important;
          font-weight: 500 !important;
          max-width: 64px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          opacity: 0.92;
        }
        /* Iter1 §1: selection should prefer noteheads over stems. Stems render as
           SVG <line> elements; giving them pointer-events:none pushes hit-testing
           down to the notehead path/glyph. Beams (also <line>) become visual-only. */
        .riffscore-hf-wrapper .riff-ScoreCanvas__svg line {
          pointer-events: none;
        }
        /* Restore interactivity on elements that genuinely need line-level hit-testing:
           staff cursor, playback line, measure bar selection overlays. */
        .riffscore-hf-wrapper .riff-ScoreCanvas__svg line[data-testid="playback-cursor"],
        .riffscore-hf-wrapper .riff-ScoreCanvas__svg line[data-measure-bar],
        .riffscore-hf-wrapper .riff-ScoreCanvas__svg line[data-editable] {
          pointer-events: stroke;
        }
        .riffscore-hf-wrapper .riff-ToolbarButton.hf-plugin-btn {
          border-color: color-mix(in srgb, var(--hf-detail, rgba(255,255,255,0.2)) 75%, transparent);
          transition: background-color 120ms ease, border-color 120ms ease, transform 120ms ease;
        }
        .riffscore-hf-wrapper .riff-ToolbarButton.hf-plugin-btn .riff-ToolbarButton__icon {
          opacity: 0.85;
        }
        .riffscore-hf-wrapper .riff-ToolbarButton.hf-plugin-btn:hover:not(:disabled) {
          border-color: var(--hf-accent, #ffb300);
          background: color-mix(in srgb, var(--hf-accent, #ffb300) 14%, transparent);
          transform: translateY(-1px);
        }
        .riffscore-hf-wrapper .riff-ToolbarButton.hf-plugin-btn.riff-ToolbarButton--active {
          border-color: var(--hf-accent, #ffb300);
          background: color-mix(in srgb, var(--hf-accent, #ffb300) 22%, transparent);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--hf-accent, #ffb300) 42%, transparent);
        }
        .riffscore-hf-wrapper .riff-ToolbarButton.hf-plugin-btn--unsupported {
          border-color: color-mix(in srgb, #f97316 50%, var(--hf-detail, rgba(255,255,255,0.2)));
          background: color-mix(in srgb, #f97316 8%, transparent);
        }
        .riffscore-hf-wrapper .riff-ToolbarButton.hf-plugin-btn--menu.riff-ToolbarButton--active {
          background: color-mix(in srgb, #0ea5e9 18%, transparent);
          border-color: color-mix(in srgb, #0ea5e9 60%, var(--hf-detail, rgba(255,255,255,0.2)));
        }
      `}</style>
      <RiffScoreComponent
        id={instanceId}
        config={config}
      />

      {!presentation && (
        <PlaybackScrubOverlay
          containerRef={containerRef}
          portalHost={playbackScrubPortalHost}
          apiRef={apiRef}
          score={score}
          notePositions={notePositions}
          measureCount={measureCount}
          isReady={isReady}
        />
      )}

      {/* Part names when SVG staff geometry is unavailable */}
      {!presentation && score.parts.length > 0 && !staffLabelsUseOverlay && (
        <div
          className="absolute left-0 right-0 z-[6] px-2 py-1 pointer-events-none"
          style={{
            top: 48,
            backgroundColor: "color-mix(in srgb, var(--hf-bg) 94%, transparent)",
            borderBottom: "1px solid var(--hf-detail)",
          }}
          aria-label="Staff order and instrument names"
        >
          <div className="text-[10px] font-medium mb-0.5" style={{ color: "var(--hf-text-secondary)" }}>
            Staves (top → bottom)
            {noteInspectionEnabled && onInspectorSelectPart ? " — click a line to focus the part" : ""}
          </div>
          <ol
            className="m-0 pl-4 text-[11px] leading-snug list-decimal"
            style={{ color: "var(--hf-text-primary)" }}
          >
            {score.parts.map((p, i) => {
              const multi = score.parts.length > 1;
              const showMelody = multi && i === 0;
              const PartIcon = getInstrumentIcon(p.name);
              const clickable = noteInspectionEnabled && Boolean(onInspectorSelectPart);
              const melodyName = (
                <span className="flex flex-col items-start gap-0">
                  <span className="font-medium">Melody</span>
                  <span className="text-[10px] opacity-85 font-mono">{p.name}</span>
                </span>
              );
              const nameContent = showMelody ? melodyName : p.name;
              return (
              <li key={p.id} className={cn("flex items-center gap-[5px]", clickable && "pointer-events-auto")}>
                <PartIcon size={11} className="shrink-0 opacity-60" aria-hidden={true} />
                {clickable ? (
                  <button
                    type="button"
                    className="text-left underline-offset-2 hover:underline bg-transparent border-none p-0 cursor-pointer font-inherit"
                    style={{ color: "var(--hf-text-primary)" }}
                    title={showMelody ? `Melody — ${p.name} — focus this part for chat` : `Focus whole part "${p.name}" for chat`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      runSelectStaffInRiffScore(i);
                      onInspectorSelectPart!(i);
                    }}
                  >
                    {nameContent}
                  </button>
                ) : (
                  nameContent
                )}
              </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Part names aligned to each staff */}
      {!presentation && staffLabelsUseOverlay &&
        staffLabelLayouts.map((layout, si) => {
          const part = score.parts[si];
          if (!part) return null;
          const centerY = layout.top + layout.height / 2;
          const multi = score.parts.length > 1;
          const primaryLabel = multi && si === 0 ? "Melody" : part.name;
          const secondaryLabel = multi && si === 0 ? part.name : null;
          const labelTitle = multi && si === 0 ? `Melody — ${part.name}` : part.name;
          const canPartInspect = noteInspectionEnabled && onInspectorSelectPart;
          const textShadow =
            "0 0 8px var(--hf-bg), 0 0 10px var(--hf-bg), 0 1px 2px var(--hf-bg)";
          const InstrumentIcon = getInstrumentIcon(part.name);
          const instrumentImgSrc = getInstrumentImage(part.name);
          const labelInner = (
            <span className="flex items-center gap-[6px] min-w-0 text-left">
              {/* Instrument image or fallback Lucide icon */}
              {instrumentImgSrc ? (
                <span
                  className="shrink-0 flex items-center justify-center rounded-[4px] overflow-hidden"
                  style={{
                    width: 32,
                    height: 32,
                    background: "color-mix(in srgb, var(--hf-bg) 80%, transparent)",
                    backdropFilter: "blur(4px)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                  }}
                >
                  <Image
                    src={instrumentImgSrc}
                    alt={part.name}
                    width={28}
                    height={28}
                    className="object-contain"
                    style={{ filter: `drop-shadow(0 0 3px var(--hf-bg))` }}
                    draggable={false}
                  />
                </span>
              ) : (
                <InstrumentIcon
                  size={13}
                  className="shrink-0"
                  style={{ color: "var(--hf-text-secondary)", filter: `drop-shadow(0 0 4px var(--hf-bg))` }}
                  aria-hidden
                />
              )}
              <span className="flex flex-col items-start gap-0 min-w-0">
                <span
                  className="truncate font-body text-[11px] font-semibold leading-tight"
                  style={{ color: "var(--hf-text-primary)", textShadow }}
                >
                  {primaryLabel}
                </span>
                {secondaryLabel ? (
                  <span
                    className="truncate font-mono text-[9px] leading-tight opacity-90"
                    style={{ color: "var(--hf-text-secondary)", textShadow }}
                  >
                    {secondaryLabel}
                  </span>
                ) : null}
              </span>
            </span>
          );
          return (
            <div
              key={part.id}
              className={`absolute z-[25] flex items-center gap-1 max-w-[min(180px,36vw)] ${canPartInspect ? "" : "pointer-events-none"}`}
              style={{
                left: 4,
                top: centerY,
                transform: "translateY(-50%)",
              }}
              title={canPartInspect ? `${labelTitle} — click to focus this part in Theory Inspector` : labelTitle}
            >
              {canPartInspect ? (
                <button
                  type="button"
                  className="flex max-w-full text-left bg-transparent border-none p-0 cursor-pointer rounded-sm hover:opacity-90"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    runSelectStaffInRiffScore(si);
                    onInspectorSelectPart(si);
                  }}
                >
                  {labelInner}
                </button>
              ) : (
                labelInner
              )}
            </div>
          );
        })}

      {/* Selection highlights */}
      {notePositions.length > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={clipUnderRiffToolbarStyle}
        >
          {notePositions
            .filter((pos) => selectedIds.has(pos.selection.noteId))
            .map((pos) => {
              const r = tightNoteHighlightRect(pos, DEFAULT_NOTE_HIGHLIGHT_PAD, DEFAULT_NOTE_HIGHLIGHT_PAD);
              return (
                <div
                  key={pos.selection.noteId}
                  className="hf-score-overlay-pill absolute rounded-full pointer-events-none"
                  style={{
                    left: r.left,
                    top: r.top,
                    width: r.width,
                    height: r.height,
                    backgroundColor: "rgba(255, 179, 0, 0.38)",
                    boxShadow: "0 0 0 1px rgba(255, 179, 0, 0.35)",
                  }}
                  aria-hidden="true"
                />
              );
            })}
        </div>
      )}

      {noteInputPitchLabelEnabled && inputPreviewLabel && (
        <div
          className="absolute pointer-events-none font-mono text-[11px] font-semibold z-[8] whitespace-nowrap"
          style={{
            left: inputPreviewLabel.left,
            top: inputPreviewLabel.top,
            color: "var(--hf-accent)",
            textShadow: "0 0 4px var(--hf-bg), 0 0 8px var(--hf-bg)",
          }}
          aria-live="polite"
          aria-label={`Input pitch ${inputPreviewLabel.pitch}`}
        >
          {inputPreviewLabel.pitch}
        </div>
      )}

      {restHoverGhost && onRestInputCommit && (
        <>
          {restHoverGhost.ghostLayout &&
          Number.isFinite(restHoverGhost.ghostLayout.centerX) &&
          Number.isFinite(restHoverGhost.ghostLayout.centerY) &&
          Number.isFinite(restHoverGhost.ghostLayout.fontSize) ? (
            <>
              {/* Ghost sits above the score canvas but under the hit target; centered on staff pitch. */}
              <div
                className="absolute z-[24] pointer-events-none leading-none select-none"
                style={{
                  left: restHoverGhost.ghostLayout.centerX,
                  top: restHoverGhost.ghostLayout.centerY,
                  transform: "translate(-50%, -52%)",
                }}
                aria-hidden="true"
              >
                <span
                  className="block"
                  style={{
                    fontFamily: "Bravura, Bravura Text, Leland, serif",
                    fontSize: restHoverGhost.ghostLayout.fontSize,
                    lineHeight: 1,
                    color: "color-mix(in srgb, var(--hf-accent, #c9a227) 35%, var(--hf-text-primary))",
                    opacity: 0.92,
                    filter: "drop-shadow(0 0 1px var(--hf-bg)) drop-shadow(0 0 10px color-mix(in srgb, var(--hf-bg) 92%, transparent))",
                    textShadow:
                      "0 0 0 2px var(--hf-bg), 0 0 0 3px color-mix(in srgb, var(--hf-accent, #c9a227) 45%, transparent), 0 2px 8px rgba(0,0,0,0.35)",
                  }}
                >
                  {"\uE0A4"}
                </span>
              </div>
              <div
                className="absolute z-[24] pointer-events-none font-mono font-semibold whitespace-nowrap"
                style={{
                  left: restHoverGhost.ghostLayout.centerX + restHoverGhost.ghostLayout.fontSize * 0.52,
                  top: restHoverGhost.ghostLayout.centerY - restHoverGhost.ghostLayout.fontSize * 0.42,
                  fontSize: Math.max(12, Math.min(16, restHoverGhost.ghostLayout.fontSize * 0.34)),
                  color: "var(--hf-text-primary)",
                  opacity: 0.95,
                  textShadow:
                    "0 0 6px var(--hf-bg), 0 0 10px var(--hf-bg), 0 1px 2px rgba(0,0,0,0.45)",
                }}
                aria-hidden="true"
              >
                {formatLearnerLetterName(restHoverGhost.pitch)}
              </div>
            </>
          ) : (
            <div
              className="absolute z-[24] flex flex-col items-center justify-center pointer-events-none gap-1"
              style={{
                left: restHoverGhost.pos.x + restHoverGhost.pos.w / 2,
                top: restHoverGhost.pos.y + restHoverGhost.pos.h / 2,
                transform: "translate(-50%, -50%)",
              }}
              aria-hidden="true"
            >
              <span
                className="leading-none block"
                style={{
                  fontFamily: "Bravura, Bravura Text, Leland, serif",
                  fontSize: 34,
                  lineHeight: 1,
                  color: "color-mix(in srgb, var(--hf-accent, #c9a227) 40%, var(--hf-text-primary))",
                  opacity: 0.9,
                  filter: "drop-shadow(0 0 8px var(--hf-bg))",
                  textShadow: "0 0 0 2px var(--hf-bg), 0 2px 6px rgba(0,0,0,0.35)",
                }}
              >
                {"\uE0A4"}
              </span>
              <span
                className="font-mono text-[11px] font-semibold leading-none"
                style={{
                  color: "var(--hf-text-primary)",
                  textShadow: "0 0 8px var(--hf-bg), 0 1px 2px rgba(0,0,0,0.4)",
                }}
              >
                {formatLearnerLetterName(restHoverGhost.pitch)}
              </span>
            </div>
          )}
          {/* Invisible hit target on top so clicks still commit (includes large ghost). */}
          <button
            type="button"
            data-hf-rest-ghost-root
            className="absolute z-[28] cursor-pointer border-0 p-0 outline-offset-2 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--hf-accent)]"
            style={{
              ...restGhostCommitHitBox(restHoverGhost.pos, restHoverGhost.ghostLayout),
              background: "transparent",
              opacity: 0.001,
            }}
            aria-label={`Place ${restHoverGhost.pitch} on this rest — click to replace`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRestInputCommit(restHoverGhost.sel, restHoverGhost.pitch);
            }}
          />
        </>
      )}

      {/* Rest repitch hint — "Type A–G to place a note here" (Noteflight/MuseScore). */}
      {restHint && !restHoverGhost && (
        <div
          className="absolute pointer-events-none z-[7] rounded-[4px] font-mono text-[10px] font-semibold px-2 py-1 whitespace-nowrap"
          style={{
            left: restHint.left,
            top: restHint.top,
            backgroundColor: "color-mix(in srgb, var(--hf-accent, #ffb300) 22%, var(--hf-bg))",
            color: "var(--hf-text-primary)",
            border: "1px solid color-mix(in srgb, var(--hf-accent, #ffb300) 60%, var(--hf-detail))",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}
          aria-live="polite"
        >
          Hover this rest to preview pitch, click to place, or type A–G
        </div>
      )}

      {/* Ghost note correction overlays */}
      {pendingCorrections && pendingCorrections.length > 0 && (
        <RiffScoreSuggestionOverlay
          corrections={pendingCorrections}
          notePositions={notePositions}
          containerRef={containerRef}
          onAccept={onAcceptCorrection}
          onReject={onRejectCorrection}
          overlayClipStyle={clipUnderRiffToolbarStyle}
        />
      )}

      {/* Theory issue highlights (Grammarly-style nuance/error tinting) */}
      {issueHighlights.length > 0 && notePositions.length > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={clipUnderRiffToolbarStyle}
        >
          {issueHighlights.map((highlight) => {
            const pos = notePositions.find((p) => p.selection.noteId === highlight.noteId);
            if (!pos) return null;
            const isError = highlight.severity === "error";
            const r = tightNoteHighlightRect(pos, DEFAULT_NOTE_HIGHLIGHT_PAD, DEFAULT_NOTE_HIGHLIGHT_PAD);
            return (
              <div
                key={`${highlight.noteId}-${highlight.label}`}
                className="hf-score-overlay-pill absolute rounded-full"
                style={{
                  left: r.left,
                  top: r.top,
                  width: r.width,
                  height: r.height,
                  backgroundColor: isError ? "rgba(239, 68, 68, 0.28)" : "rgba(37, 99, 235, 0.24)",
                  borderBottom: `2px dashed ${isError ? "#ef4444" : "#2563eb"}`,
                  boxShadow: isError
                    ? "0 0 0 1px rgba(239, 68, 68, 0.22)"
                    : "0 0 0 1px rgba(37, 99, 235, 0.2)",
                }}
                aria-hidden="true"
              />
            );
          })}
        </div>
      )}

      {focusHighlightSet.size > 0 && notePositions.length > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={clipUnderRiffToolbarStyle}
        >
          {notePositions
            .filter((p) => focusHighlightSet.has(p.selection.noteId))
            .map((pos) => {
              const r = tightNoteHighlightRect(pos, DEFAULT_NOTE_HIGHLIGHT_PAD, DEFAULT_NOTE_HIGHLIGHT_PAD);
              return (
                <div
                  key={`focus-${pos.selection.noteId}`}
                  className="hf-score-overlay-pill absolute rounded-full"
                  style={{
                    left: r.left,
                    top: r.top,
                    width: r.width,
                    height: r.height,
                    backgroundColor: "rgba(16, 185, 129, 0.3)",
                    borderBottom: "2px solid rgba(16, 185, 129, 0.88)",
                    boxShadow: "0 0 0 1px rgba(16, 185, 129, 0.2)",
                  }}
                  aria-hidden="true"
                />
              );
            })}
        </div>
      )}

      {/* Learner overlay: letter + accidental above each notehead (centered). */}
      {showNoteNameLabels &&
        notePositions.length > 0 &&
        (!presentation || allowNoteNameLabelsInPresentation) && (
          <div
            className="absolute inset-0 pointer-events-none z-[3]"
            style={
              learnerClipTopPx > 0
                ? { clipPath: `inset(${learnerClipTopPx}px 0 0 0)` }
                : undefined
            }
            aria-hidden="true"
          >
            {notePositions.map((pos) => {
              const hit = getNoteById(score, pos.selection.noteId);
              if (!hit || hit.note.isRest) return null;
              const api = apiRef.current;
              const livePitch =
                api != null
                  ? hfNotePitchFromLiveRsScore(api.getScore(), getRsToHf(), pos.selection.noteId)
                  : null;
              const pitch = (livePitch ?? hit.note.pitch)?.trim();
              if (!pitch) return null;
              const label = formatLearnerLetterName(pitch);
              if (!label) return null;
              const labelAnchorY = pos.y + pos.h * 0.49 - 5;
              return (
                <div
                  key={`pitch-label-${pos.selection.noteId}`}
                  className="absolute font-mono text-[12px] font-semibold leading-none whitespace-nowrap"
                  style={{
                    left: pos.x + pos.w / 2,
                    top: labelAnchorY,
                    transform: "translate(-50%, -100%)",
                    color: "var(--hf-text-primary)",
                    textShadow:
                      "0 0 4px var(--hf-bg), 0 0 8px var(--hf-bg), 0 1px 2px var(--hf-bg)",
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        )}
    </div>
    {issueHighlightTooltip
      ? createPortal(
          <div
            role="tooltip"
            className="hf-hover-tooltip fixed z-[13000] pointer-events-none max-w-[min(240px,calc(100vw-24px))] rounded-lg px-3 py-2 font-sans text-[11px] leading-snug"
            style={{
              left: issueHighlightTooltip.x + 12,
              top: issueHighlightTooltip.y + 12,
              backgroundColor: "var(--hf-panel-bg)",
              border: "1px solid color-mix(in srgb, var(--hf-detail) 65%, transparent)",
              color: "var(--hf-text-primary)",
              boxShadow:
                "0 4px 16px color-mix(in srgb, var(--hf-detail) 28%, transparent), 0 12px 40px rgba(45,24,23,0.08)",
            }}
          >
            {issueHighlightTooltip.text}
          </div>,
          document.body,
        )
      : null}
    </>
  );
}
