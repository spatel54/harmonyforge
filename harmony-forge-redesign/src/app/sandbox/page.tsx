"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ZoomIn, ZoomOut } from "lucide-react";
import { SandboxHeader } from "@/components/organisms/SandboxHeader";
import { ScorePalette } from "@/components/organisms/ScorePalette";
import { ScoreCanvas } from "@/components/organisms/ScoreCanvas";
import { useUploadStore } from "@/store/useUploadStore";
import { useScoreStore, getClipboard, setClipboard, pasteNotes } from "@/store/useScoreStore";
import {
  extractNotes,
  setNoteDurations,
  toggleNoteDots,
  transposeNotes,
  setPitchByLetter,
  addArticulation,
  setNoteDynamics,
  insertMeasureBefore,
  insertMeasureAfter,
  deleteMeasure,
  insertNote,
  noteBeats,
  parseMeasureBeats,
  getInsertIndexAtBeat,
} from "@/lib/music/scoreUtils";
import { useToolStore } from "@/store/useToolStore";
import { useEditCursorStore } from "@/store/useEditCursorStore";
import { parseMusicXML, extractMusicXMLMetadata } from "@/lib/music/musicxmlParser";
import { scoreToMusicXML } from "@/lib/music/scoreToMusicXML";
import { SandboxPlaybackBar } from "@/components/molecules/SandboxPlaybackBar";
import { usePlayback } from "@/hooks/usePlayback";
import { SandboxActionBar } from "@/components/molecules/SandboxActionBar";
import {
  TheoryInspectorPanel,
  type TheoryInspectorMessage,
} from "@/components/organisms/TheoryInspectorPanel";
import { ExportModal } from "@/components/organisms/ExportModal";
import { ChatFAB } from "@/components/atoms/ChatFAB";
import { OnboardingCoachmark } from "@/components/organisms/OnboardingCoachmark";
import { completeOnboarding, isOnboardingComplete } from "@/lib/onboarding";

const TOOL_GROUPS = [
  "SCORE",
  "EDIT",
  "DURATION",
  "PITCH",
  "TEXT",
  "MEASURE",
  "DYNAMICS",
  "ARTICULATION",
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const DURATION_TOOL_ORDER = [
  "duration-32nd",
  "duration-16th",
  "duration-eighth",
  "duration-quarter",
  "duration-half",
  "duration-whole",
] as const;

/** Initial inspector payload (before first user query). */
const INITIAL_MESSAGES: TheoryInspectorMessage[] = [
  {
    id: "init-sys",
    type: "system",
    content: "Theory Inspector ready. Ask for explanations or suggested fixes.",
  },
  {
    id: "init-chips",
    type: "chips",
    chips: ["Validate harmony", "Why is this flagged?", "Suggest correction"],
  },
];

type MeasureHighlight = {
  measureIndex: number;
  color: "red" | "blue";
  label?: string;
};

function parseInspectorHighlights(
  highlights: unknown,
  maxMeasures: number,
): MeasureHighlight[] {
  if (!Array.isArray(highlights) || maxMeasures <= 0) return [];
  const parsed: MeasureHighlight[] = [];
  for (const item of highlights) {
    if (!item || typeof item !== "object") continue;
    const h = item as Record<string, unknown>;
    const indexRaw = h.measureIndex;
    const colorRaw = h.color;
    const measureIndex =
      typeof indexRaw === "number" && Number.isFinite(indexRaw)
        ? Math.max(0, Math.min(maxMeasures - 1, Math.floor(indexRaw)))
        : -1;
    const color =
      colorRaw === "red" || colorRaw === "blue" ? colorRaw : null;
    if (measureIndex >= 0 && color) {
      parsed.push({
        measureIndex,
        color,
        label: typeof h.label === "string" ? h.label : undefined,
      });
    }
  }
  return parsed;
}

function toViolationMessages(
  validation:
    | {
        violations?: unknown;
      }
    | null
    | undefined,
): Array<{ type: string; message: string }> {
  const violations = validation?.violations;
  if (Array.isArray(violations)) {
    return violations
      .filter(
        (v): v is { type: string; message: string } =>
          Boolean(v && typeof v === "object" && "type" in v && "message" in v),
      )
      .slice(0, 4);
  }
  if (violations && typeof violations === "object") {
    return Object.entries(violations)
      .filter(([, value]) => typeof value === "number" && value > 0)
      .slice(0, 4)
      .map(([key, value]) => ({
        type: key,
        message: `${value} issue(s) in ${key}.`,
      }));
  }
  return [];
}

/**
 * TactileSandboxPage
 * Pencil Nodes: dcf2A (with inspector) / AcJnt / FlAan (full-width, inspector closed).
 *
 * New in this revision:
 *  - ScorePalette search + All Tools filter wired with local state
 *  - Zoom in/out controls (level 50–200%)
 *  - Theory Inspector panel is resizable by dragging left edge
 *  - Chat has functional send + simulated AI reply
 *  - Inspector close/open with ChatFAB
 */
export default function TactileSandboxPage() {
  const router = useRouter();
  const generatedMusicXML = useUploadStore((s) => s.generatedMusicXML);
  const sourceFileName = useUploadStore((s) => s.sourceFileName);
  const restoreFromStorage = useUploadStore((s) => s.restoreFromStorage);
  const { score, setScore, undo, redo, canUndo, canRedo, deleteSelection, applyScore, visibleParts, togglePartVisibility } = useScoreStore();
  const { activeTool, setActiveTool, clearSelection, selection, setSelection, toggleNoteSelection } = useToolStore();
  const { cursor, setCursor, clearCursor } = useEditCursorStore();

  // Restore from sessionStorage on mount, then redirect if still no music
  React.useEffect(() => {
    restoreFromStorage();
    const xml = useUploadStore.getState().generatedMusicXML;
    if (!xml) router.replace("/document");
  }, [restoreFromStorage, router]);

  // State for modals/panels — must be declared before handleToolSelect
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [layersPanelOpen, setLayersPanelOpen] = React.useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [inspectorWidth, setInspectorWidth] = React.useState(380);
  const [canvasMode, setCanvasMode] = React.useState<"view" | "edit">("view");
  const [measureHighlights, setMeasureHighlights] = React.useState<
    MeasureHighlight[]
  >([]);

  const durationToBeats = React.useCallback((dur: "w" | "h" | "q" | "8" | "16" | "32") => {
    const map: Record<"w" | "h" | "q" | "8" | "16" | "32", number> = {
      w: 4,
      h: 2,
      q: 1,
      "8": 0.5,
      "16": 0.25,
      "32": 0.125,
    };
    return map[dur] ?? 1;
  }, []);

  const resolveInsertionTarget = React.useCallback(() => {
    if (!score) return null;
    if (cursor) {
      return {
        partId: cursor.partId,
        measureIndex: cursor.measureIndex,
        noteIndex: cursor.noteIndex,
        beat: cursor.beat,
      };
    }
    const selected = selection[0];
    if (selected) {
      return {
        partId: selected.partId,
        measureIndex: selected.measureIndex,
        noteIndex: selected.noteIndex + 1,
        beat: 0,
      };
    }
    const firstPart = score.parts[0];
    if (!firstPart) return null;
    return {
      partId: firstPart.id,
      measureIndex: 0,
      noteIndex: 0,
      beat: 0,
    };
  }, [cursor, score, selection]);

  const handleToolSelect = React.useCallback(
    (toolId: string) => {
      const editHandlers: Record<string, () => void> = {
        "edit-undo": () => undo(),
        "edit-redo": () => redo(),
        "edit-cut": () => {
          if (!score || selection.length === 0) return;
          const noteIds = selection.map((s) => s.noteId);
          setClipboard(extractNotes(score, new Set(noteIds)));
          deleteSelection(noteIds);
          clearSelection();
        },
        "edit-copy": () => {
          if (!score || selection.length === 0) return;
          const noteIds = selection.map((s) => s.noteId);
          setClipboard(extractNotes(score, new Set(noteIds)));
        },
        "edit-paste": () => {
          if (!score || getClipboard().length === 0) return;
          const target = resolveInsertionTarget();
          const partId = target?.partId ?? score.parts[0]?.id;
          const measureIndex = target?.measureIndex ?? 0;
          const noteIndex = target?.noteIndex ?? 0;
          const next = pasteNotes(score, partId, measureIndex, noteIndex);
          applyScore(next);
        },
        "edit-delete": () => {
          if (!score || selection.length === 0) return;
          deleteSelection(selection.map((s) => s.noteId));
          clearSelection();
        },
      };
      const durationMap: Record<string, "w" | "h" | "q" | "8" | "16" | "32"> = {
        "duration-whole": "w",
        "duration-half": "h",
        "duration-quarter": "q",
        "duration-eighth": "8",
        "duration-16th": "16",
        "duration-32nd": "32",
      };
      const pitchHandlers: Record<string, number> = {
        "pitch-up-semitone": 1,
        "pitch-down-semitone": -1,
        "pitch-up-octave": 12,
        "pitch-down-octave": -12,
      };
      if (editHandlers[toolId]) {
        editHandlers[toolId]();
      } else if (durationMap[toolId] && score && selection.length > 0) {
        const noteIds = new Set(selection.map((s) => s.noteId));
        const next = setNoteDurations(score, noteIds, durationMap[toolId]);
        applyScore(next);
      } else if (toolId === "duration-dotted" && score && selection.length > 0) {
        const noteIds = new Set(selection.map((s) => s.noteId));
        const next = toggleNoteDots(score, noteIds);
        applyScore(next);
      } else if (pitchHandlers[toolId] !== undefined && score && selection.length > 0) {
        const noteIds = new Set(selection.map((s) => s.noteId));
        const next = transposeNotes(score, noteIds, pitchHandlers[toolId]);
        applyScore(next);
      } else if (
        ["artic-staccato", "artic-tenuto", "artic-accent", "artic-marcato", "artic-fermata", "artic-trill"].includes(toolId) &&
        score &&
        selection.length > 0
      ) {
        const articMap: Record<string, string> = {
          "artic-staccato": "a.",
          "artic-tenuto": "a-",
          "artic-accent": "a>",
          "artic-marcato": "a^",
          "artic-fermata": "a@a",
          "artic-trill": "a~",
        };
        const noteIds = new Set(selection.map((s) => s.noteId));
        const next = addArticulation(score, noteIds, articMap[toolId] ?? "a.");
        applyScore(next);
      } else if (
        ["dynamics-piano", "dynamics-cresc", "dynamics-decresc"].includes(toolId) &&
        score &&
        selection.length > 0
      ) {
        const dynMap: Record<string, string> = {
          "dynamics-piano": "p",
          "dynamics-cresc": "crescendo",
          "dynamics-decresc": "decrescendo",
        };
        const noteIds = new Set(selection.map((s) => s.noteId));
        const next = setNoteDynamics(score, noteIds, dynMap[toolId] ?? "p");
        applyScore(next);
      } else if (toolId === "measure-insert-before" && score) {
        const mIdx = cursor?.measureIndex ?? selection[0]?.measureIndex ?? 0;
        applyScore(insertMeasureBefore(score, mIdx));
      } else if (toolId === "measure-insert-after" && score) {
        const mIdx = cursor?.measureIndex ?? selection[0]?.measureIndex ?? 0;
        applyScore(insertMeasureAfter(score, mIdx + 1));
      } else if (toolId === "measure-delete" && score && (selection.length > 0 || cursor)) {
        const mIdx = cursor?.measureIndex ?? selection[0]?.measureIndex ?? 0;
        applyScore(deleteMeasure(score, mIdx));
        clearSelection();
      } else if (toolId === "score-copy" && score) {
        navigator.clipboard?.writeText(scoreToMusicXML(score));
      } else if (toolId === "score-print") {
        window.print();
      } else if (toolId === "score-save" && score) {
        const blob = new Blob([scoreToMusicXML(score)], { type: "application/xml" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "harmony-forge-score.xml";
        a.click();
        URL.revokeObjectURL(a.href);
      } else if (toolId === "score-export") {
        setIsExportModalOpen(true);
      } else if (toolId === "score-layers") {
        setLayersPanelOpen((o) => !o);
      } else {
        if (
          toolId.startsWith("duration-") ||
          toolId.startsWith("pitch-") ||
          toolId.startsWith("edit-")
        ) {
          setCanvasMode("edit");
        }
        setActiveTool(toolId);
      }
    },
    [score, selection, undo, redo, deleteSelection, clearSelection, applyScore, setActiveTool, setIsExportModalOpen, setLayersPanelOpen, cursor, resolveInsertionTarget]
  );

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearSelection();
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selection.length > 0 && score) {
          e.preventDefault();
          handleToolSelect("edit-delete");
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        if (getClipboard().length > 0 && score) {
          e.preventDefault();
          handleToolSelect("edit-paste");
        }
      }
      // 2g.3: MuseScore-style keyboard shortcuts (when not in input/textarea)
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      const inputDurationMap: Record<string, "w" | "h" | "q" | "8" | "16" | "32"> = {
        "duration-whole": "w",
        "duration-half": "h",
        "duration-quarter": "q",
        "duration-eighth": "8",
        "duration-16th": "16",
        "duration-32nd": "32",
      };
      const inputDuration =
        activeTool && inputDurationMap[activeTool]
          ? inputDurationMap[activeTool]
          : "q";
      if (e.key === "[" || e.key === "]") {
        e.preventDefault();
        const currentIdx = DURATION_TOOL_ORDER.findIndex((tool) => tool === activeTool);
        const startIdx = currentIdx >= 0 ? currentIdx : 3; // default quarter
        const nextIdx =
          e.key === "["
            ? Math.max(0, startIdx - 1)
            : Math.min(DURATION_TOOL_ORDER.length - 1, startIdx + 1);
        setActiveTool(DURATION_TOOL_ORDER[nextIdx]);
        setCanvasMode("edit");
      }
      if (e.key === "0" && score) {
        e.preventDefault();
        const durationMap: Record<string, "w" | "h" | "q" | "8" | "16" | "32"> = {
          "duration-whole": "w",
          "duration-half": "h",
          "duration-quarter": "q",
          "duration-eighth": "8",
          "duration-16th": "16",
          "duration-32nd": "32",
        };
        const restDuration =
          activeTool && durationMap[activeTool] ? durationMap[activeTool] : "q";
        const target = resolveInsertionTarget();
        const partId = target?.partId ?? score.parts[0]?.id;
        const measureIndex = target?.measureIndex ?? 0;
        const noteIndex = target?.noteIndex ?? 0;
        if (partId) {
          applyScore(
            insertNote(score, partId, measureIndex, noteIndex, {
              duration: restDuration,
              pitch: "B4",
              isRest: true,
            }),
          );
          const nextBeat = (target?.beat ?? 0) + durationToBeats(restDuration);
          setCursor({
            partId,
            measureIndex,
            beat: nextBeat,
            noteIndex: noteIndex + 1,
          });
          setCanvasMode("edit");
        }
      }
      if (score && selection.length === 0) {
        const key = e.key.toUpperCase();
        if (["A", "B", "C", "D", "E", "F", "G"].includes(key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
          const target = resolveInsertionTarget();
          const partId = target?.partId ?? score.parts[0]?.id;
          const measureIndex = target?.measureIndex ?? 0;
          const noteIndex = target?.noteIndex ?? 0;
          if (!partId) return;
          e.preventDefault();
          const next = insertNote(score, partId, measureIndex, noteIndex, {
            duration: inputDuration,
            pitch: `${key}4`,
          });
          applyScore(next);
          const nextBeat = (target?.beat ?? 0) + durationToBeats(inputDuration);
          setCursor({
            partId,
            measureIndex,
            beat: nextBeat,
            noteIndex: noteIndex + 1,
          });
          setCanvasMode("edit");
        }
      }
      if (selection.length === 0 && score && isNoteInputMode) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          moveCursorHorizontally(-1);
          return;
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          moveCursorHorizontally(1);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          moveCursorVertically(-1);
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          moveCursorVertically(1);
        }
      }
      if (selection.length > 0 && score) {
        const key = e.key.toUpperCase();
        if (key >= "1" && key <= "9") {
          const durMap: Record<string, string> = {
            "1": "duration-32nd",
            "2": "duration-16th",
            "3": "duration-eighth",
            "4": "duration-quarter",
            "5": "duration-half",
            "6": "duration-whole",
          };
          const tool = durMap[key];
          if (tool) {
            e.preventDefault();
            handleToolSelect(tool);
          }
        } else if (["A", "B", "C", "D", "E", "F", "G"].includes(key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          const noteIds = new Set(selection.map((s) => s.noteId));
          applyScore(setPitchByLetter(score, noteIds, key));
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            handleToolSelect(e.key === "ArrowUp" ? "pitch-up-semitone" : "pitch-down-semitone");
          } else if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            handleToolSelect(e.key === "ArrowUp" ? "pitch-up-octave" : "pitch-down-octave");
          }
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    clearSelection,
    selection,
    score,
    handleToolSelect,
    undo,
    redo,
    applyScore,
    activeTool,
    setActiveTool,
    resolveInsertionTarget,
    durationToBeats,
    setCursor,
  ]);

  React.useEffect(() => {
    setShowOnboarding(!isOnboardingComplete());
  }, []);

  React.useEffect(() => {
    if (!generatedMusicXML) {
      setScore(null);
      setSelection([]);
      setMeasureHighlights([]);
      clearCursor();
      return;
    }
    const parsed = parseMusicXML(generatedMusicXML);
    setScore(parsed);
    setSelection([]);
    setMeasureHighlights([]);
    clearCursor();
  }, [generatedMusicXML, setScore, setSelection, clearCursor]);

  const scoreForCanvas = score ?? null;

  const playbackMeta = React.useMemo(() => {
    if (!generatedMusicXML) return { title: "Score", subtitle: "" };
    const meta = extractMusicXMLMetadata(generatedMusicXML);
    const title = sourceFileName || meta.title;
    const subtitle = meta.meta || "HarmonyForge arrangement";
    return { title, subtitle };
  }, [generatedMusicXML, sourceFileName]);

  // Playback (audio via Tone.js)
  const { play, pause, stop, isPlaying, canPlay } = usePlayback({
    score: score ?? null,
  });
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = 4;
  const isResizing = React.useRef(false);
  const startX = React.useRef(0);
  const startWidth = React.useRef(380);

  const handleResizeStart = React.useCallback(
    (e: React.MouseEvent) => {
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = inspectorWidth;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    },
    [inspectorWidth],
  );

  React.useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = startX.current - e.clientX; // dragging left → wider
      const newW = Math.max(280, Math.min(600, startWidth.current + delta));
      setInspectorWidth(newW);
    };
    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Search + filter (multi-select)
  const [searchValue, setSearchValue] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState<string[]>([
    "EDIT",
    "DURATION",
    "PITCH",
  ]);

  // Note input: selected duration for click-on-staff placement (Noteflight/MuseScore-style)
  const durationForInput = React.useMemo(() => {
    const map: Record<string, "w" | "h" | "q" | "8" | "16" | "32"> = {
      "duration-whole": "w",
      "duration-half": "h",
      "duration-quarter": "q",
      "duration-eighth": "8",
      "duration-16th": "16",
      "duration-32nd": "32",
    };
    return activeTool && map[activeTool] ? map[activeTool] : "q";
  }, [activeTool]);
  const isNoteInputMode = [
    "duration-whole",
    "duration-half",
    "duration-quarter",
    "duration-eighth",
    "duration-16th",
    "duration-32nd",
  ].includes(activeTool ?? "");

  const partOrderForCursor = React.useMemo(() => {
    if (!score) return [];
    if (!visibleParts || visibleParts.size === 0) return score.parts;
    const filtered = score.parts.filter((part) => visibleParts.has(part.id));
    return filtered.length > 0 ? filtered : score.parts;
  }, [score, visibleParts]);

  // 2g.5: Voice lanes — active part for insertion (part isolation)
  const [activePartId, setActivePartId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (selection.length > 0 && selection[0]) {
      setActivePartId(selection[0].partId);
      const sel = selection[0];
      const part = score?.parts.find((p) => p.id === sel.partId);
      const measure = part?.measures[sel.measureIndex];
      if (measure) {
        let beat = 0;
        for (let idx = 0; idx < Math.max(0, sel.noteIndex); idx++) {
          beat += noteBeats(measure.notes[idx]);
        }
        setCursor({
          partId: sel.partId,
          measureIndex: sel.measureIndex,
          beat,
          noteIndex: sel.noteIndex,
        });
      }
    }
  }, [selection, score, setCursor]);

  const handleStaffClick = React.useCallback(
    (partId: string, measureIndex: number, noteIndex: number) => {
      if (!score) return;
      const targetPartId = activePartId && score.parts.some((p) => p.id === activePartId) ? activePartId : partId;
      const targetPart = score.parts.find((p) => p.id === targetPartId);
      const measure = targetPart?.measures[measureIndex];
      const beatsInMeasure = parseMeasureBeats(measure?.timeSignature);
      const beatStep = durationToBeats(durationForInput);
      let beat = 0;
      if (measure) {
        for (let i = 0; i < Math.max(0, noteIndex); i++) beat += noteBeats(measure.notes[i]);
      }
      const nextScore = insertNote(score, targetPartId, measureIndex, noteIndex, {
        duration: durationForInput,
      });
      applyScore(nextScore);
      const nextBeat = Math.min(beatsInMeasure, beat + beatStep);
      const nextMeasure = nextScore.parts
        .find((p) => p.id === targetPartId)
        ?.measures[measureIndex];
      const nextNoteIndex = nextMeasure
        ? getInsertIndexAtBeat(nextMeasure, nextBeat)
        : noteIndex + 1;
      setCursor({
        partId: targetPartId,
        measureIndex,
        beat: nextBeat,
        noteIndex: nextNoteIndex,
      });
    },
    [score, applyScore, durationForInput, activePartId, durationToBeats, setCursor]
  );

  const moveCursorHorizontally = React.useCallback(
    (direction: -1 | 1) => {
      if (!score) return;
      const step = durationToBeats(durationForInput);
      const defaultPart = partOrderForCursor[0];
      const anchor =
        cursor ??
        (defaultPart
          ? {
              partId: defaultPart.id,
              measureIndex: 0,
              beat: 0,
              noteIndex: 0,
            }
          : null);
      if (!anchor) return;
      const part = score.parts.find((p) => p.id === anchor.partId) ?? score.parts[0];
      if (!part) return;
      let measureIndex = Math.max(0, Math.min(anchor.measureIndex, part.measures.length - 1));
      let beat = anchor.beat + direction * step;

      while (measureIndex > 0 && beat < 0) {
        const prevBeats = parseMeasureBeats(part.measures[measureIndex - 1]?.timeSignature);
        measureIndex -= 1;
        beat += prevBeats;
      }
      while (measureIndex < part.measures.length - 1) {
        const currentBeats = parseMeasureBeats(part.measures[measureIndex]?.timeSignature);
        if (beat <= currentBeats) break;
        beat -= currentBeats;
        measureIndex += 1;
      }

      const targetMeasure = part.measures[measureIndex];
      const beatsInMeasure = parseMeasureBeats(targetMeasure?.timeSignature);
      const clampedBeat = Math.max(0, Math.min(beatsInMeasure, beat));
      const noteIndex = targetMeasure ? getInsertIndexAtBeat(targetMeasure, clampedBeat) : 0;
      setCursor({
        partId: part.id,
        measureIndex,
        beat: clampedBeat,
        noteIndex,
      });
      setCanvasMode("edit");
    },
    [cursor, durationForInput, durationToBeats, partOrderForCursor, score, setCursor],
  );

  const moveCursorVertically = React.useCallback(
    (direction: -1 | 1) => {
      if (!score || partOrderForCursor.length === 0) return;
      const defaultPart = partOrderForCursor[0];
      const anchor =
        cursor ??
        (defaultPart
          ? {
              partId: defaultPart.id,
              measureIndex: 0,
              beat: 0,
              noteIndex: 0,
            }
          : null);
      if (!anchor) return;
      const currentIdx = partOrderForCursor.findIndex((p) => p.id === anchor.partId);
      const startIdx = currentIdx >= 0 ? currentIdx : 0;
      const nextIdx = Math.max(
        0,
        Math.min(partOrderForCursor.length - 1, startIdx + direction),
      );
      const nextPart = partOrderForCursor[nextIdx];
      if (!nextPart) return;
      const measureIndex = Math.max(
        0,
        Math.min(anchor.measureIndex, nextPart.measures.length - 1),
      );
      const targetMeasure = nextPart.measures[measureIndex];
      const beatsInMeasure = parseMeasureBeats(targetMeasure?.timeSignature);
      const clampedBeat = Math.max(0, Math.min(beatsInMeasure, anchor.beat));
      const noteIndex = targetMeasure ? getInsertIndexAtBeat(targetMeasure, clampedBeat) : 0;
      setCursor({
        partId: nextPart.id,
        measureIndex,
        beat: clampedBeat,
        noteIndex,
      });
      setCanvasMode("edit");
    },
    [cursor, partOrderForCursor, score, setCursor],
  );

  const handleNoteDrag = React.useCallback(
    (sel: { noteId: string }, semitoneDelta: number) => {
      if (!score || semitoneDelta === 0) return;
      const noteIds = new Set([sel.noteId]);
      const next = transposeNotes(score, noteIds, semitoneDelta);
      applyScore(next);
      const existing = selection.find((s) => s.noteId === sel.noteId);
      if (existing) setSelection([existing]);
    },
    [score, applyScore, selection, setSelection]
  );

  // Zoom
  const [zoom, setZoom] = React.useState(100);
  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 25));

  // Chat state (edit 4)
  const [chatInput, setChatInput] = React.useState("");
  const [messages, setMessages] = React.useState<TheoryInspectorMessage[]>([]);
  const [inspectorBusy, setInspectorBusy] = React.useState(false);

  // Populate mock data when the inspector is opened
  React.useEffect(() => {
    if (isInspectorOpen && messages.length === 0) {
      setMessages(INITIAL_MESSAGES);
    }
  }, [isInspectorOpen, messages.length]);

  const handleSend = React.useCallback(async () => {
    const text = chatInput.trim();
    if (!text || inspectorBusy) return;
    const now = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const userMsg = {
      id: `u-${Date.now()}`,
      type: "user" as const,
      content: text,
      timestamp: now,
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setInspectorBusy(true);
    try {
      const res = await fetch("/api/theory-inspector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          musicXML: generatedMusicXML,
        }),
      });
      if (!res.ok) throw new Error("Theory Inspector unavailable");
      const data = (await res.json()) as {
        reply?: string;
        validation?: {
          violations?: unknown;
        } | null;
        highlights?: Array<{
          measureIndex: number;
          color: "red" | "blue";
          label?: string;
        }>;
      };

      const timestamp = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const aiMsg: TheoryInspectorMessage = {
        id: `ai-${Date.now()}`,
        type: "ai",
        content: data.reply ?? "I could not generate a response.",
        timestamp,
      };

      const violations = toViolationMessages(data.validation).slice(0, 2).map((v, idx) => ({
        id: `vio-${Date.now()}-${idx}`,
        type: "violation" as const,
        violationType: v.type,
        content: v.message,
        timestamp,
      }));

      setMessages((prev) => [...prev, ...violations, aiMsg]);
      const maxMeasures = Math.max(
        0,
        ...(score?.parts.map((part) => part.measures.length) ?? [0]),
      );
      const parsedHighlights = parseInspectorHighlights(
        data.highlights ?? [],
        maxMeasures,
      );
      if (parsedHighlights.length > 0) {
        setCanvasMode("edit");
      }
      setMeasureHighlights(parsedHighlights);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          type: "ai",
          content:
            "Theory Inspector is temporarily unavailable. You can continue editing, or try again in a moment.",
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setInspectorBusy(false);
    }
  }, [chatInput, generatedMusicXML, inspectorBusy, score]);

  const handleExport = async (format: string) => {
    if (!score) return;
    const downloadBlob = (blob: Blob, filename: string) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    };

    if (format === "xml") {
      const blob = new Blob([scoreToMusicXML(score)], { type: "application/xml" });
      downloadBlob(blob, "harmony-forge-score.xml");
    } else if (format === "json") {
      const blob = new Blob([JSON.stringify(score, null, 2)], { type: "application/json" });
      downloadBlob(blob, "harmony-forge-score.json");
    } else if (format === "pdf") {
      window.print();
    } else if (format === "chord-chart") {
      try {
        const formData = new FormData();
        formData.append(
          "file",
          new Blob([scoreToMusicXML(score)], { type: "application/xml" }),
          "score.xml",
        );
        const res = await fetch(`${API_BASE}/api/export-chord-chart`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Could not generate chord chart");
        const chart = await res.text();
        downloadBlob(new Blob([chart], { type: "text/plain" }), "harmony-forge-chord-chart.txt");
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Chord chart export failed";
        window.alert(msg);
      }
    } else {
      window.alert(
        "This export format is not implemented yet. Use PDF, MusicXML, JSON, or Chord Chart for now.",
      );
    }
    setIsExportModalOpen(false);
  };

  // Don't render sandbox UI while redirecting (no generated music)
  if (!generatedMusicXML) {
    return null;
  }

  return (
    <div
      className="flex flex-col w-full h-screen overflow-hidden"
      style={{ backgroundColor: "var(--hf-bg)" }}
    >
      {/* Zone 1: Header */}
      <SandboxHeader onExportClick={() => setIsExportModalOpen(true)} />

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left column */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* ScorePalette — search & filter wired */}
          <div className="relative shrink-0">
            <ScorePalette
              className="h-[192px]"
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
              filterOptions={["All Tools", ...TOOL_GROUPS]}
              onToolSelect={handleToolSelect}
              activeToolId={activeTool}
              disabledToolIds={[
                ...(!canUndo ? ["edit-undo"] : []),
                ...(!canRedo ? ["edit-redo"] : []),
              ]}
            />
            {layersPanelOpen && score && (
              <div
                className="absolute left-4 top-full mt-1 z-50 rounded-lg px-3 py-2 shadow-lg min-w-[140px]"
                style={{
                  backgroundColor: "var(--hf-bg)",
                  border: "1px solid var(--hf-detail)",
                }}
              >
                <div className="text-[11px] font-medium mb-2" style={{ color: "var(--hf-text-secondary)" }}>
                  Visible parts
                </div>
                {score.parts.map((part) => {
                  const isVisible = visibleParts.size === 0 || visibleParts.has(part.id);
                  return (
                    <label
                      key={part.id}
                      className="flex items-center gap-2 py-1 cursor-pointer text-[13px]"
                      style={{ color: "var(--hf-text-primary)" }}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => togglePartVisibility(part.id)}
                        className="rounded"
                      />
                      {part.name}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2g.4: Action bar — Undo, Redo, Delete always visible (Noteflight pattern) */}
          <div className="shrink-0 flex items-center px-4 py-2">
            <SandboxActionBar
              onUndo={undo}
              onRedo={redo}
              onDelete={() => handleToolSelect("edit-delete")}
              canUndo={canUndo}
              canRedo={canRedo}
              hasSelection={selection.length > 0}
              mode={canvasMode}
              onModeChange={setCanvasMode}
            />
            <span
              className="ml-3 text-[11px] font-mono opacity-70"
              style={{ color: "var(--hf-text-secondary)" }}
            >
              A-G insert/pitch, 1-6 duration, arrows move cursor or transpose selection
            </span>
          </div>

          {/* Canvas wrapper — relative for FAB + zoom controls; min-h ensures visible area */}
          <div className="relative flex-1 min-h-[320px] overflow-auto">
            <div
              className="w-full h-full min-h-[320px]"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top left",
              }}
            >
              <ScoreCanvas
                className="w-full h-full min-h-[320px]"
                score={scoreForCanvas}
                musicXML={generatedMusicXML}
                showViolations={isInspectorOpen}
                onCanvasClick={() => {
                  clearSelection();
                  clearCursor();
                }}
                onStaffClick={isNoteInputMode ? handleStaffClick : undefined}
                selection={selection}
                onNoteClick={toggleNoteSelection}
                onNoteDrag={handleNoteDrag}
                visiblePartIds={visibleParts.size > 0 ? visibleParts : undefined}
                preferEditMode={canvasMode === "edit"}
                measureHighlights={measureHighlights}
                cursor={cursor}
                onCursorChange={setCursor}
              />
            </div>

            {/* Zoom controls — bottom-left of canvas */}
            <div
              className="absolute bottom-[28px] left-[24px] flex items-center gap-[4px] rounded-[6px] px-[8px] py-[6px]"
              style={{
                backgroundColor: "var(--hf-bg)",
                border: "1px solid var(--hf-detail)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="flex items-center justify-center w-[24px] h-[24px] rounded-[4px] transition-opacity hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--hf-accent)"
                aria-label="Zoom out"
              >
                <ZoomOut
                  className="w-[14px] h-[14px]"
                  style={{ color: "var(--hf-text-primary)" }}
                  strokeWidth={1.75}
                />
              </button>

              <span
                className="font-mono text-[11px] font-medium tabular-nums w-[34px] text-center select-none"
                style={{ color: "var(--hf-text-primary)" }}
              >
                {zoom}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="flex items-center justify-center w-[24px] h-[24px] rounded-[4px] transition-opacity hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--hf-accent)"
                aria-label="Zoom in"
              >
                <ZoomIn
                  className="w-[14px] h-[14px]"
                  style={{ color: "var(--hf-text-primary)" }}
                  strokeWidth={1.75}
                />
              </button>
            </div>

            {/* ChatFAB — shown only when inspector is closed */}
            {!isInspectorOpen && (
              <div className="absolute bottom-[28px] right-[28px]">
                <ChatFAB onClick={() => setIsInspectorOpen(true)} />
              </div>
            )}
          </div>

          {/* Playback bar */}
          <SandboxPlaybackBar
            className="shrink-0"
            title={playbackMeta.title}
            subtitle={playbackMeta.subtitle}
            isPlaying={isPlaying}
            currentPage={currentPage}
            totalPages={totalPages}
            onPlayPause={() => (isPlaying ? pause() : play())}
            canPlay={canPlay}
            onSkipBack={() => {
              stop();
              setCurrentPage(1);
            }}
            onSkipForward={() => {
              stop();
              setCurrentPage(totalPages);
            }}
            onRewind={() => stop()}
            onFastForward={() => stop()}
            onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
            onNextPage={() =>
              setCurrentPage((p) => Math.min(totalPages, p + 1))
            }
          />
        </div>

        {/* Right column: Theory Inspector — resizable */}
        {isInspectorOpen && (
          <div
            className="relative shrink-0 h-full overflow-hidden flex"
            style={{ width: inspectorWidth }}
          >
            {/* Drag handle — left edge */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[5px] cursor-col-resize z-10 group"
              onMouseDown={handleResizeStart}
              title="Drag to resize"
            >
              {/* Visual indicator on hover */}
              <div
                className="absolute left-[2px] top-[50%] -translate-y-[50%] w-[1px] h-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: "var(--hf-accent)" }}
              />
            </div>

            <TheoryInspectorPanel
              className="h-full flex-1"
              messages={messages}
              inputValue={chatInput}
              onInputChange={setChatInput}
              onSend={handleSend}
              onChipClick={(chip) => setChatInput(chip)}
              onClose={() => setIsInspectorOpen(false)}
            />
          </div>
        )}
      </div>

      {showOnboarding && (
        <OnboardingCoachmark
          stepLabel="Step 3 of 3"
          title="Edit, listen, and inspect theory"
          description="Use note tools directly on the staff, drag notes up/down to change pitch, use Play for audio preview, and Theory Inspector for explanations."
          primaryCta="Finish tour"
          onPrimary={() => {
            completeOnboarding();
            setShowOnboarding(false);
          }}
          onSecondary={() => {
            completeOnboarding();
            setShowOnboarding(false);
          }}
          secondaryCta="Skip tour"
        />
      )}

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        musicXML={score ? scoreToMusicXML(score) : generatedMusicXML}
      />
    </div>
  );
}
