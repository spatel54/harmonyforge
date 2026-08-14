import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RiffScoreSessionHandles } from "@/context/RiffScoreSessionContext";
import type { EditableScore } from "@/lib/music/scoreTypes";
import { applyTransposeSelectedNotes } from "./sandboxScoreTranspose";
import { useScoreStore } from "@/store/useScoreStore";

vi.mock("@/lib/sandbox/sandboxPitchPreview", () => ({
  previewSandboxPitches: vi.fn(),
}));

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
          notes: [{ id: "n1", pitch: "C4", duration: "q" }],
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

describe("applyTransposeSelectedNotes", () => {
  beforeEach(() => {
    useScoreStore.setState({
      score: baseScore,
      history: [structuredClone(baseScore)],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    });
  });

  it("transposes synchronously without calling flush", () => {
    const session = mockSession(baseScore, new Set(["n1"]));
    const applied = applyTransposeSelectedNotes(session, -12);
    expect(applied).toBe(true);
    expect(session.flushToZustand).not.toHaveBeenCalled();
    expect(useScoreStore.getState().score?.parts[0]?.measures[0]?.notes[0]?.pitch).toBe("C3");
  });

  it("applies whole-step transpose on first click path", () => {
    const session = mockSession(baseScore, new Set(["n1"]));
    applyTransposeSelectedNotes(session, 2);
    expect(useScoreStore.getState().score?.parts[0]?.measures[0]?.notes[0]?.pitch).toBe("D4");
  });

  it("returns false when no note ids resolve", () => {
    const session = mockSession(baseScore, new Set());
    expect(applyTransposeSelectedNotes(session, -12)).toBe(false);
  });
});
