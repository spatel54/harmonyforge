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
} from "@/lib/music/scoreUtils";
import { useToolStore } from "@/store/useToolStore";
import { parseMusicXML, extractMusicXMLMetadata } from "@/lib/music/musicxmlParser";
import { scoreToMusicXML } from "@/lib/music/scoreToMusicXML";
import { SandboxPlaybackBar } from "@/components/molecules/SandboxPlaybackBar";
import { usePlayback } from "@/hooks/usePlayback";
import { SandboxActionBar } from "@/components/molecules/SandboxActionBar";
import { TheoryInspectorPanel } from "@/components/organisms/TheoryInspectorPanel";
import { ExportModal } from "@/components/organisms/ExportModal";
import { ChatFAB } from "@/components/atoms/ChatFAB";
import { useTheoryInspector } from "@/hooks/useTheoryInspector";
import { useTheoryInspectorStore } from "@/store/useTheoryInspectorStore";
import { useSuggestionStore } from "@/store/useSuggestionStore";
import { applySuggestion, applySuggestions } from "@/lib/music/scoreUtils";

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
  const [inspectorWidth, setInspectorWidth] = React.useState(380);

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
          const target = selection[0];
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
        const mIdx = selection[0]?.measureIndex ?? 0;
        applyScore(insertMeasureBefore(score, mIdx));
      } else if (toolId === "measure-insert-after" && score) {
        const mIdx = selection[0]?.measureIndex ?? 0;
        applyScore(insertMeasureAfter(score, mIdx + 1));
      } else if (toolId === "measure-delete" && score && selection.length > 0) {
        const mIdx = selection[0].measureIndex;
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
        setActiveTool(toolId);
      }
    },
    [score, selection, undo, redo, deleteSelection, clearSelection, applyScore, setActiveTool, setIsExportModalOpen, setLayersPanelOpen]
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
  }, [clearSelection, selection, score, handleToolSelect, undo, redo, applyScore]);

  React.useEffect(() => {
    if (!generatedMusicXML) {
      setScore(null);
      setSelection([]);
      return;
    }
    const parsed = parseMusicXML(generatedMusicXML);
    setScore(parsed);
    setSelection([]);
  }, [generatedMusicXML, setScore, setSelection]);

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
  const [activeFilters, setActiveFilters] = React.useState<string[]>(["All Tools"]);

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

  // 2g.5: Voice lanes — active part for insertion (part isolation)
  const [activePartId, setActivePartId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (selection.length > 0 && selection[0]) {
      setActivePartId(selection[0].partId);
    }
  }, [selection]);

  const handleStaffClick = React.useCallback(
    (partId: string, measureIndex: number, noteIndex: number) => {
      if (!score) return;
      const targetPartId = activePartId && score.parts.some((p) => p.id === activePartId) ? activePartId : partId;
      applyScore(insertNote(score, targetPartId, measureIndex, noteIndex, { duration: durationForInput }));
    },
    [score, applyScore, durationForInput, activePartId]
  );

  // Display mode: view (OSMD) vs edit (VexFlow with note tools)
  const [displayMode, setDisplayMode] = React.useState<"view" | "edit">("view");

  // Auto-switch to edit mode when suggestions arrive (ghost notes need VexFlow)
  React.useEffect(() => {
    if (pendingCorrections.length > 0 && displayMode === "view") {
      setDisplayMode("edit");
    }
  }, [pendingCorrections.length, displayMode]);

  // Zoom
  const [zoom, setZoom] = React.useState(100);
  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 25));

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

  const handleExport = (format: string) => {
    if (!score) return;
    if (format === "xml") {
      const blob = new Blob([scoreToMusicXML(score)], { type: "application/xml" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "harmony-forge-score.xml";
      a.click();
      URL.revokeObjectURL(a.href);
    } else if (format === "json") {
      const blob = new Blob([JSON.stringify(score, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "harmony-forge-score.json";
      a.click();
      URL.revokeObjectURL(a.href);
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
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
            />
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
                displayMode={displayMode}
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
