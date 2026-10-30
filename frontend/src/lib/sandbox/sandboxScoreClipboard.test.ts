import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RiffScoreSessionHandles } from "@/context/RiffScoreSessionContext";
import type { EditableScore } from "@/lib/music/scoreTypes";
import {
  copyEditorSelection,
  cutEditorSelection,
  pasteEditorClipboard,
  resolvePasteAnchor,
} from "./sandboxScoreClipboard";
import { getClipboard, setClipboard, useScoreStore } from "@/store/useScoreStore";

const baseScore: EditableScore = {
  divisions: 1,
  bpm: 96,
  parts: [
    {
      id: "P1",
      name: "Melody",
      clef: "treble",
      measures: [
        {
          id: "m1",
          timeSignature: "4/4",
          keySignature: 0,
          notes: [
            { id: "n1", pitch: "C4", duration: "q" },
            { id: "n2", pitch: "E4", duration: "q" },
            { id: "n3", pitch: "G4", duration: "q", isRest: true },
          ],
        },
      ],
    },
  ],
};

function mockSession(
  score: EditableScore,
  noteIds: Set<string>,
): RiffScoreSessionHandles {
  return {
    flushToZustand: vi.fn(),
    editorUndo: vi.fn(),
    editorRedo: vi.fn(),
    editorSelectAll: vi.fn(),
    editorDeselectAll: vi.fn(),
    getPitchGroupNoteIds: () => noteIds,
    getTransposeTargetNoteIds: () => noteIds,
    peekTransposeTargetNoteIds: () => noteIds,
    getDurationTargetNoteIds: () => noteIds,
    readLiveScore: () => score,
  };
}

describe("sandboxScoreClipboard", () => {
  beforeEach(() => {
    setClipboard([]);
    useScoreStore.setState({
      score: structuredClone(baseScore),
      history: [structuredClone(baseScore)],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    });
  });

  it("copies from live peek ids even when the HF selection fallback is empty", () => {
    const session = mockSession(baseScore, new Set(["n1"]));
    expect(copyEditorSelection(session, new Set())).toBe(true);
    expect(getClipboard()).toHaveLength(1);
    expect(getClipboard()[0]?.pitch).toBe("C4");
  });

  it("pastes after the selected note", () => {
    const session = mockSession(baseScore, new Set(["n1"]));
    copyEditorSelection(session, new Set(["n1"]));
    expect(pasteEditorClipboard(session, new Set(["n1"]))).toBe(true);
    const notes = useScoreStore.getState().score?.parts[0]?.measures[0]?.notes ?? [];
    expect(notes).toHaveLength(4);
    expect(notes[1]?.pitch).toBe("C4");
    expect(notes[1]?.id).not.toBe("n1");
  });

  it("replaces a selected rest in place", () => {
    const session = mockSession(baseScore, new Set(["n1"]));
    copyEditorSelection(session, new Set(["n1"]));
    const restSession = mockSession(baseScore, new Set(["n3"]));
    expect(resolvePasteAnchor(baseScore, restSession, new Set(["n3"]))).toEqual({
      partId: "P1",
      measureIndex: 0,
      noteIndex: 2,
    });
    pasteEditorClipboard(restSession, new Set(["n3"]));
    const notes = useScoreStore.getState().score?.parts[0]?.measures[0]?.notes ?? [];
    expect(notes[2]?.pitch).toBe("C4");
    expect(notes[2]?.isRest).not.toBe(true);
  });

  it("cuts by copying then turning the source into a rest", () => {
    const session = mockSession(structuredClone(baseScore), new Set(["n2"]));
    expect(cutEditorSelection(session, new Set(["n2"]))).toBe(true);
    expect(getClipboard()[0]?.pitch).toBe("E4");
    const notes = useScoreStore.getState().score?.parts[0]?.measures[0]?.notes ?? [];
    expect(notes[1]?.isRest).toBe(true);
  });
});
