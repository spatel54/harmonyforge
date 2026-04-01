"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SandboxHeader } from "@/components/organisms/SandboxHeader";
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
import { usePlayback } from "@/hooks/usePlayback";
import { TheoryInspectorPanel } from "@/components/organisms/TheoryInspectorPanel";
import { ExportModal } from "@/components/organisms/ExportModal";
import { ChatFAB } from "@/components/atoms/ChatFAB";
import { useTheoryInspector } from "@/hooks/useTheoryInspector";
import { useTheoryInspectorStore } from "@/store/useTheoryInspectorStore";
import { useSuggestionStore } from "@/store/useSuggestionStore";
import { applySuggestion, applySuggestions } from "@/lib/music/scoreUtils";
import { OnboardingCoachmark } from "@/components/organisms/OnboardingCoachmark";
import { completeOnboarding, isOnboardingComplete } from "@/lib/onboarding";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const DURATION_TOOL_ORDER = [
  "duration-32nd",
  "duration-16th",
  "duration-eighth",
  "duration-quarter",
  "duration-half",
  "duration-whole",
] as const;

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
  const {
    messages: inspectorMessages,
    inputValue: chatInput,
    setInputValue: setChatInput,
    isStreaming,
    sendMessage,
    handleChipClick,
    runAudit,
    clearMessages,
  } = useTheoryInspector();
  const suggestionStore = useSuggestionStore();
  const pendingCorrections = suggestionStore.getPendingCorrections();

  // Build suggestion batch map for the panel
  const suggestionBatchMap = React.useMemo(() => {
    const map = new Map<string, { corrections: import("@/lib/music/suggestionTypes").ScoreCorrection[]; summary: string }>();
    for (const batch of suggestionStore.batches) {
      map.set(batch.id, { corrections: batch.corrections, summary: batch.summary });
    }
    return map;
  }, [suggestionStore.batches]);

  // Accept/reject correction handlers
  const handleAcceptCorrection = React.useCallback(
    (correctionId: string) => {
      if (!score) return;
      const allCorrections = suggestionStore.batches.flatMap((b) => b.corrections);
      const correction = allCorrections.find((c) => c.id === correctionId);
      if (!correction) return;
      const nextScore = applySuggestion(score, correction);
      applyScore(nextScore);
      suggestionStore.acceptCorrection(correctionId);
    },
    [score, applyScore, suggestionStore],
  );

  const handleRejectCorrection = React.useCallback(
    (correctionId: string) => {
      suggestionStore.rejectCorrection(correctionId);
    },
    [suggestionStore],
  );

  const handleAcceptAll = React.useCallback(
    (batchId: string) => {
      if (!score) return;
      const batch = suggestionStore.batches.find((b) => b.id === batchId);
      if (!batch) return;
      const pending = batch.corrections.filter(
        (c) => suggestionStore.correctionStatuses[c.id] === "pending",
      );
      if (pending.length === 0) return;
      const nextScore = applySuggestions(score, pending);
      applyScore(nextScore);
      suggestionStore.acceptAll(batchId);
    },
    [score, applyScore, suggestionStore],
  );

  const handleRejectAll = React.useCallback(
    (batchId: string) => {
      suggestionStore.rejectAll(batchId);
    },
    [suggestionStore],
  );

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
  // searchValue and activeFilters removed — RiffScore provides its own toolbar

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

  // Auto-switch to edit mode when suggestions arrive (ghost notes need VexFlow)
  React.useEffect(() => {
    if (pendingCorrections.length > 0 && canvasMode === "view") {
      setCanvasMode("edit");
    }
  }, [pendingCorrections.length, canvasMode]);

  // Zoom
  // Zoom removed — RiffScore provides its own scale controls

  // Run audit when inspector is opened and score exists
  React.useEffect(() => {
    if (isInspectorOpen && inspectorMessages.length === 0) {
      // Welcome message + initial chips before user types anything
      const { addMessage } = useTheoryInspectorStore.getState();
      addMessage({
        id: `sys-welcome-${Date.now()}`,
        type: "system",
        content: "Theory Inspector ready. What would you like to analyze?",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      });
      addMessage({
        id: `chips-welcome-${Date.now()}`,
        type: "chips",
        chips: ["Check voice leading", "Suggest correction", "Explain this chord"],
      });

      // Also run audit if score is available
      if (score) runAudit(score);
    }
  }, [isInspectorOpen, score, inspectorMessages.length, runAudit]);

  const handleSend = React.useCallback(() => {
    sendMessage(chatInput);
  }, [sendMessage, chatInput]);

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
          {/* RiffScore editor — includes its own toolbar, score canvas, and playback */}
          <div className="relative flex-1 min-h-[320px] overflow-hidden">
            <ScoreCanvas
              className="w-full h-full"
              score={scoreForCanvas}
              showViolations={isInspectorOpen}
              onCanvasClick={clearSelection}
              onStaffClick={isNoteInputMode ? handleStaffClick : undefined}
              selection={selection}
              onNoteClick={toggleNoteSelection}
              visiblePartIds={visibleParts.size > 0 ? visibleParts : undefined}
              pendingCorrections={pendingCorrections}
              onAcceptCorrection={handleAcceptCorrection}
              onRejectCorrection={handleRejectCorrection}
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

            {/* ChatFAB — shown only when inspector is closed */}
            {!isInspectorOpen && (
              <div className="absolute bottom-[28px] right-[28px] z-10">
                <ChatFAB onClick={() => setIsInspectorOpen(true)} />
              </div>
            )}
          </div>
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
              messages={inspectorMessages}
              inputValue={chatInput}
              isStreaming={isStreaming}
              onInputChange={setChatInput}
              onSend={handleSend}
              onChipClick={(chip) => handleChipClick(chip, score)}
              onExplainMore={() => handleChipClick("Explain more", score)}
              onSuggestFix={() => handleChipClick("Suggest correction", score)}
              onNewChat={clearMessages}
              onClose={() => setIsInspectorOpen(false)}
              suggestionBatches={suggestionBatchMap}
              correctionStatuses={suggestionStore.correctionStatuses}
              onAcceptCorrection={handleAcceptCorrection}
              onRejectCorrection={handleRejectCorrection}
              onAcceptAllCorrections={handleAcceptAll}
              onRejectAllCorrections={handleRejectAll}
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
