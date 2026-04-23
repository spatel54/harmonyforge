"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Mic, Wind, Bell, Music, Music2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useTheme as useNextTheme } from "next-themes";
import "riffscore/styles.css";
import type { MusicEditorAPI, Selection as RsSelection } from "riffscore";
import type { EditableScore, NotePosition } from "@/lib/music/scoreTypes";
import type { ScoreIssueHighlight } from "@/lib/music/inspectorTypes";
import type { NoteSelection } from "@/store/useScoreStore";
import { useScoreStore } from "@/store/useScoreStore";
import type { ScoreCorrection } from "@/lib/music/suggestionTypes";
import { editableScoreToRiffConfig, shouldShowChordNotation } from "@/lib/music/riffscoreAdapter";
import { cn } from "@/lib/utils";
import { cloneScore, getNoteById, setNoteDynamics, toggleNoteDots, transposeNotes } from "@/lib/music/scoreUtils";
import { scoreToMusicXML } from "@/lib/music/scoreToMusicXML";
import { useRiffScoreSync } from "@/hooks/useRiffScoreSync";
import {
  extractNotePositions,
  extractStaffLabelLayout,
  findNoteInputPreviewLayout,
  getRiffScoreScrollRoots,
  type StaffLabelLayout,
} from "@/lib/music/riffscorePositions";
import { formatLearnerLetterName } from "@/lib/music/learnerPitchLabel";
import { RiffScoreSuggestionOverlay } from "./RiffScoreSuggestionOverlay";
import { PlaybackScrubOverlay } from "./PlaybackScrubOverlay";
import type { RiffScoreSessionHandles } from "@/context/RiffScoreSessionContext";

/** Map an instrument name to a recognisable Lucide icon by family. */
function getInstrumentIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (/\b(flute|oboe|clarinet|bassoon|saxophone|sax|piccolo|recorder)\b/.test(n)) return Wind;
  if (/\b(trumpet|horn|trombone|tuba|cornet|bugle|flugelhorn)\b/.test(n)) return Bell;
  if (/\b(violin|viola|cello|string|guitar|harp|double bass|contrabass|lute)\b/.test(n)) return Music2;
  if (/\b(voice|vocal|singer|soprano|alto|tenor|baritone|mezzo)\b/.test(n) || n.endsWith(" voice")) return Mic;
  return Music;
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
  noteInspectionEnabled?: boolean;
  onError?: (err: Error) => void;
  pendingCorrections?: ScoreCorrection[];
  onAcceptCorrection?: (correctionId: string) => void;
  onRejectCorrection?: (correctionId: string) => void;
  issueHighlights?: ScoreIssueHighlight[];
  /** Theory Inspector: tint these note ids (measure/part focus), separate from violation highlights */
  focusHighlightNoteIds?: readonly string[];
  /** User picked a measure in the inspector strip — parent should set Zustand focus + facts */
  onInspectorSelectMeasure?: (measureIndex: number) => void;
  /** User picked a staff label — 0-based staff index aligned with score.parts */
  onInspectorSelectPart?: (staffIndex: number) => void;
  /** Multi-select in RiffScore inferred measure- or part-wide focus */
  onInspectorInferredRegion?: (
    region:
      | { kind: "measure"; measureIndex: number }
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
  /** Present-only flag: hide editor chrome (toolbar, bars strip, fabs) for export/print capture. */
  presentation?: boolean;
  /** Dropping a notation-panel symbol onto the score runs the same tool id as a click. */
  onPaletteSymbolDrop?: (toolId: string) => void;
  /** Fired when the RiffScore editor API is ready (e.g. document preview playback). */
  onEditorApiReady?: (api: MusicEditorAPI) => void;
  /** Instance id registered on `window.riffScore` — lets parents resolve the API if React state lags. */
  onRiffInstanceId?: (instanceId: string) => void;
}

export function RiffScoreEditor({
  score,
  className,
  selection = [],
  onNoteClick,
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
  onPaletteSymbolDrop,
  onEditorApiReady,
  onRiffInstanceId,
}: RiffScoreEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<MusicEditorAPI | null>(null);
  const [instanceId] = useState(() => `hf-score-${Date.now()}`);
  const [notePositions, setNotePositions] = useState<NotePosition[]>([]);
  const [staffLabelLayouts, setStaffLabelLayouts] = useState<StaffLabelLayout[]>([]);
  const [staffLabelsUseOverlay, setStaffLabelsUseOverlay] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [inputPreviewLabel, setInputPreviewLabel] = useState<{
    pitch: string;
    left: number;
    top: number;
  } | null>(null);
  /** Pixels to clip from the top of the learner overlay so labels never paint over `.riff-Toolbar`. */
  const [learnerClipTopPx, setLearnerClipTopPx] = useState(0);
  const prevScoreRef = useRef<EditableScore | null>(null);

  const { resolvedTheme } = useNextTheme();
  const rsTheme = resolvedTheme === "dark" ? "DARK" as const : "LIGHT" as const;
  const applyScore = useScoreStore((s) => s.applyScore);

  const { pushToRiffScore, getRsToHf, flushToZustand } = useRiffScoreSync(apiRef, score);
  const selectedNoteIds = useMemo(() => new Set(selection.map((s) => s.noteId)), [selection]);
  const hasSelection = selectedNoteIds.size > 0;
  const focusHighlightSet = useMemo(
    () => new Set(focusHighlightNoteIds),
    [focusHighlightNoteIds],
  );
  const measureCount = score?.parts[0]?.measures.length ?? 0;

  const downloadXml = () => {
    if (!score) return;
    const blob = new Blob([scoreToMusicXML(score)], { type: "application/xml" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = "harmony-forge-score.xml";
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  const runSelectMeasureInRiffScore = (measureIndex: number) => {
    const api = apiRef.current;
    if (!api) return;
    api.select(measureIndex + 1, 0, 0);
    api.selectAll("measure");
  };

  const runSelectStaffInRiffScore = (staffIndex: number) => {
    const api = apiRef.current;
    if (!api) return;
    api.select(1, staffIndex, 0);
    api.selectAll("staff");
  };

  const applyOnSelection = (transform: (current: EditableScore, noteIds: Set<string>) => EditableScore) => {
    if (!score || !hasSelection) return;
    const next = transform(score, selectedNoteIds);
    applyScore(next);
  };

  const toggleSelectedRests = () => {
    if (!score || !hasSelection) return;
    const next = cloneScore(score);
    for (const part of next.parts) {
      for (const measure of part.measures) {
        for (const note of measure.notes) {
          if (!selectedNoteIds.has(note.id)) continue;
          note.isRest = !note.isRest;
          if (note.isRest) note.pitch = "B4";
          else if (!note.pitch.match(/^[A-G](#|b)?\d+$/)) note.pitch = "C4";
        }
      }
    }
    applyScore(next);
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
            apiRef.current?.undo();
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
            apiRef.current?.redo();
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
          onClick: () => applyOnSelection((current, ids) => transposeNotes(current, ids, 1)),
        },
        {
          id: "hf-action-transpose-down",
          label: "− Semitone",
          title: "Transpose selected notes down one semitone (↓)",
          icon: <span className="text-[10px] font-semibold">-1</span>,
          disabled: !hasSelection,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () => applyOnSelection((current, ids) => transposeNotes(current, ids, -1)),
        },
        {
          id: "hf-action-octave-up",
          label: "Octave ↑",
          title: "Transpose selected notes up one octave (⌘↑)",
          icon: <span className="text-[10px] font-semibold">8+</span>,
          disabled: !hasSelection,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () => applyOnSelection((current, ids) => transposeNotes(current, ids, 12)),
        },
        {
          id: "hf-action-octave-down",
          label: "Octave ↓",
          title: "Transpose selected notes down one octave (⌘↓)",
          icon: <span className="text-[10px] font-semibold">8-</span>,
          disabled: !hasSelection,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () => applyOnSelection((current, ids) => transposeNotes(current, ids, -12)),
        },
        {
          id: "hf-action-dot-toggle",
          label: "Dotted",
          title: "Add/remove a dot on selected notes (. key)",
          icon: <span className="text-[10px] font-semibold">DOT</span>,
          disabled: !hasSelection,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () => applyOnSelection((current, ids) => toggleNoteDots(current, ids)),
        },
        {
          id: "hf-action-rest-toggle",
          label: "Rest",
          title: "Swap selection between note and rest (0)",
          icon: <span className="text-[10px] font-semibold">RST</span>,
          disabled: !hasSelection,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: toggleSelectedRests,
        },
        {
          id: "hf-action-dyn-p",
          label: "Piano",
          title: "Mark selection piano (soft — p)",
          icon: <span className="text-[10px] font-semibold">p</span>,
          disabled: !hasSelection,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () => applyOnSelection((current, ids) => setNoteDynamics(current, ids, "p")),
        },
        {
          id: "hf-action-dyn-f",
          label: "Forte",
          title: "Mark selection forte (loud — f)",
          icon: <span className="text-[10px] font-semibold">f</span>,
          disabled: !hasSelection,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () => applyOnSelection((current, ids) => setNoteDynamics(current, ids, "f")),
        },
        {
          id: "hf-action-export-xml",
          label: "Export XML",
          title: "Download the score as MusicXML",
          icon: <span className="text-[10px] font-semibold">XML</span>,
          disabled: !score,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: downloadXml,
        },
        {
          id: "hf-action-print",
          label: "Print",
          title: "Print the current score (⌘P)",
          icon: <span className="text-[10px] font-semibold">PRN</span>,
          disabled: !score,
          showLabel: true,
          className: "hf-plugin-btn hf-plugin-btn--action",
          onClick: () => window.print(),
        },
      );

      return plugins;
    },
    // `applyOnSelection` / `downloadXml` / `toggleSelectedRests` are inline helpers
    // closed over the state we already depend on; including them would force the
    // memo to recompute every render and fight RiffScore's toolbar identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasSelection, score, selectedNoteIds],
  );

  // Build config from score, passing current theme
  const config = useMemo(
    () =>
      score
        ? editableScoreToRiffConfig(score, {
            theme: rsTheme,
            toolbarPlugins: presentation ? [] : toolbarPlugins,
            showToolbar: !presentation,
          })
        : undefined,
    [score, rsTheme, toolbarPlugins, presentation],
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

  useEffect(() => {
    onRiffInstanceId?.(instanceId);
  }, [instanceId, onRiffInstanceId]);

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
        apiRef.current?.undo();
      },
      editorRedo: () => {
        apiRef.current?.redo();
      },
    };
    onSessionReady(session);
  }, [isReady, onSessionReady, flushToZustand]);

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

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      for (const el of scrollRoots) {
        el.removeEventListener("scroll", scheduleFromScroll);
      }
    };
  }, [isReady, score, getRsToHf, showNoteNameLabels]);

  useLayoutEffect(() => {
    if (!showNoteNameLabels || presentation) {
      setLearnerClipTopPx(0);
      return;
    }
    const root = containerRef.current;
    if (!root) return;

    const measure = () => {
      const tb = root.querySelector(".riff-Toolbar");
      if (!tb) {
        setLearnerClipTopPx(0);
        return;
      }
      const cr = root.getBoundingClientRect();
      const br = tb.getBoundingClientRect();
      setLearnerClipTopPx(Math.max(0, Math.round(br.bottom - cr.top)));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    const tbEl = root.querySelector(".riff-Toolbar");
    if (tbEl) ro.observe(tbEl);
    return () => ro.disconnect();
  }, [showNoteNameLabels, presentation, isReady, instanceId, score]);

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

  // Subscribe to selection events for onNoteClick + optional measure/part inference
  useEffect(() => {
    const api = apiRef.current;
    if (!api || (!onNoteClick && !onInspectorInferredRegion)) return;

    const unsub = api.on("selection", (sel: unknown) => {
      const rsSel = sel as RsSelection;
      if (rsSel.selectedNotes.length === 0) return;
      if (!score) return;

      const selected = rsSel.selectedNotes;
      if (
        noteInspectionEnabled &&
        onInspectorInferredRegion &&
        selected.length > 1
      ) {
        const m0 = selected[0]!.measureIndex;
        const allSameMeasure = selected.every((n) => n.measureIndex === m0);
        const staffSet = new Set(selected.map((n) => n.staffIndex));
        if (allSameMeasure && staffSet.size > 1) {
          onInspectorInferredRegion({ kind: "measure", measureIndex: m0 });
          return;
        }
        const s0 = selected[0]!.staffIndex;
        const allSameStaff = selected.every((n) => n.staffIndex === s0);
        const measureSet = new Set(selected.map((n) => n.measureIndex));
        if (allSameStaff && measureSet.size > 1) {
          onInspectorInferredRegion({ kind: "part", staffIndex: s0 });
          return;
        }
      }

      if (!onNoteClick) return;

      const first = selected[0]!;
      if (!first.noteId) return;

      // Map RiffScore selection back to HF NoteSelection
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
        noteIndex: 0, // RiffScore uses eventId, not noteIndex — find it
        noteId: hfNoteId,
      };

      // Find actual noteIndex within the measure
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!hasSelection) return;
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const semitones = e.key === "ArrowUp"
        ? (e.shiftKey ? 12 : 1)
        : (e.shiftKey ? -12 : -1);
      applyOnSelection((current, ids) => transposeNotes(current, ids, semitones));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasSelection, score, selectedNoteIds],
  );

  if (!score || !config) return null;

  const selectedIds = new Set(selection.map((s) => s.noteId));

  const chordUiOn = Boolean(score && shouldShowChordNotation(score));

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full min-h-[200px] riffscore-hf-wrapper",
        showNoteNameLabels && (!presentation || allowNoteNameLabelsInPresentation) && "pt-5",
        className,
      )}
      data-hf-chord-ui={chordUiOn ? "1" : "0"}
      style={{ position: "relative" }}
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
          overflow: auto !important;
          min-height: 0 !important;
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
         * Iter1 §1 selection feedback:
         *   - Show a "grab" cursor over the score canvas so users know notes are movable.
         *   - Switch to "grabbing" while a pointer is held down (hints at drag-in-progress).
         *   - Prefer noteheads over stems / beams as hit targets by giving SVG
         *     lines a narrower pointer-events region; glyphs (noteheads) stay
         *     fully clickable.
         */
        .riffscore-hf-wrapper .riff-ScoreCanvas {
          cursor: grab;
        }
        .riffscore-hf-wrapper .riff-ScoreCanvas:active,
        .riffscore-hf-wrapper .riff-ScoreCanvas[data-dragging="true"] {
          cursor: grabbing;
        }
        .riffscore-hf-wrapper .riff-ScoreCanvas__svg text,
        .riffscore-hf-wrapper .riff-ScoreCanvas__svg path {
          cursor: grab;
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
          apiRef={apiRef}
          score={score}
          notePositions={notePositions}
          measureCount={measureCount}
          isReady={isReady}
          contentTopPx={
            noteInspectionEnabled && measureCount > 0 && onInspectorSelectMeasure
              ? 92
              : 52
          }
        />
      )}

      {/* Theory Inspector: click bar numbers to focus the whole measure */}
      {!presentation && noteInspectionEnabled && measureCount > 0 && onInspectorSelectMeasure && (
        <div
          className="absolute left-0 right-0 z-[25] flex flex-wrap items-center gap-1 px-2 py-1"
          style={{
            top: 48,
            backgroundColor: "color-mix(in srgb, var(--hf-bg) 92%, transparent)",
            borderBottom: "1px solid var(--hf-detail)",
          }}
          role="toolbar"
          aria-label="Select measure for Theory Inspector"
        >
          <span
            className="text-[9px] font-medium shrink-0 pr-1"
            style={{ color: "var(--hf-text-secondary)" }}
          >
            Bars
          </span>
          {Array.from({ length: measureCount }, (_, i) => (
            <button
              key={`m-${i}`}
              type="button"
              className="min-w-[22px] h-[22px] rounded text-[10px] font-mono leading-none transition-colors hover:opacity-90"
              style={{
                backgroundColor: "var(--hf-detail)",
                color: "var(--hf-text-primary)",
                border: "1px solid var(--hf-detail)",
              }}
              title={`Focus measure ${i + 1} for chat`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                runSelectMeasureInRiffScore(i);
                onInspectorSelectMeasure(i);
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Part names when SVG staff geometry is unavailable */}
      {!presentation && score.parts.length > 0 && !staffLabelsUseOverlay && (
        <div
          className="absolute left-0 right-0 z-[6] px-2 py-1 pointer-events-none"
          style={{
            top:
              noteInspectionEnabled && measureCount > 0 && onInspectorSelectMeasure ? 92 : 48,
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
          const labelInner = (
            <span className="flex items-center gap-[5px] min-w-0 text-left">
              <InstrumentIcon
                size={13}
                className="shrink-0"
                style={{ color: "var(--hf-text-secondary)", filter: `drop-shadow(0 0 4px var(--hf-bg))` }}
                aria-hidden
              />
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
        <div className="absolute inset-0 pointer-events-none">
          {notePositions
            .filter((pos) => selectedIds.has(pos.selection.noteId))
            .map((pos) => (
              <div
                key={pos.selection.noteId}
                className="absolute rounded pointer-events-none"
                style={{
                  left: pos.x - 4,
                  top: pos.y - 4,
                  width: pos.w + 8,
                  height: pos.h + 8,
                  backgroundColor: "rgba(255, 179, 0, 0.3)",
                }}
                aria-hidden="true"
              />
            ))}
        </div>
      )}

      {noteInspectionEnabled && notePositions.length > 0 && onNoteClick && (
        <div className="absolute inset-0 z-10">
          {notePositions.map((pos) => (
            <button
              key={`inspect-${pos.selection.noteId}`}
              type="button"
              aria-label={`Inspect note ${pos.selection.noteId}`}
              className="absolute cursor-pointer"
              style={{
                left: pos.x - 8,
                top: pos.y - 10,
                width: Math.max(pos.w + 16, 20),
                height: Math.max(pos.h + 16, 24),
                background: "transparent",
                border: "none",
                padding: 0,
                margin: 0,
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNoteClick(pos.selection, e.shiftKey);
              }}
            />
          ))}
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

      {/* Rest repitch hint — "Type A–G to place a note here" (Noteflight/MuseScore). */}
      {restHint && (
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
          Type A–G to place a note
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
        />
      )}

      {/* Theory issue highlights (Grammarly-style nuance/error tinting) */}
      {issueHighlights.length > 0 && notePositions.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {issueHighlights.map((highlight) => {
            const pos = notePositions.find((p) => p.selection.noteId === highlight.noteId);
            if (!pos) return null;
            const isError = highlight.severity === "error";
            return (
              <div
                key={`${highlight.noteId}-${highlight.label}`}
                className="absolute rounded-sm"
                style={{
                  left: pos.x - 2,
                  top: pos.y - 2,
                  width: pos.w + 4,
                  height: pos.h + 6,
                  backgroundColor: isError ? "rgba(239, 68, 68, 0.18)" : "rgba(37, 99, 235, 0.16)",
                  borderBottom: `2px dashed ${isError ? "#ef4444" : "#2563eb"}`,
                }}
                aria-hidden="true"
              />
            );
          })}
        </div>
      )}

      {focusHighlightSet.size > 0 && notePositions.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-[4]">
          {notePositions
            .filter((p) => focusHighlightSet.has(p.selection.noteId))
            .map((pos) => (
              <div
                key={`focus-${pos.selection.noteId}`}
                className="absolute rounded-sm"
                style={{
                  left: pos.x - 3,
                  top: pos.y - 3,
                  width: pos.w + 6,
                  height: pos.h + 8,
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  borderBottom: "2px solid rgba(16, 185, 129, 0.75)",
                }}
                aria-hidden="true"
              />
            ))}
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
              const pitch = hit?.note.pitch?.trim();
              if (!hit || hit.note.isRest || !pitch) return null;
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
  );
}
