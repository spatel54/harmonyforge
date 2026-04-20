import { describe, expect, it } from "vitest";
import { resolveIdeaActionNoteId } from "./ideaActionResolve";
import type { EditableScore } from "./scoreTypes";
import type { NoteInsight } from "@/store/useTheoryInspectorStore";

function m(ts: string, notes: { id: string; pitch: string; duration: "q" }[]) {
  return { timeSignature: ts, notes };
}

describe("resolveIdeaActionNoteId", () => {
  it("returns action.noteId when it exists in score", () => {
    const score: EditableScore = {
      parts: [
        {
          id: "p0",
          name: "Melody",
          clef: "treble",
          measures: [m("4/4", [{ id: "n0", pitch: "C4", duration: "q" }])],
        },
      ],
    };
    const r = resolveIdeaActionNoteId(
      score,
      {
        id: "ia1",
        noteId: "n0",
        suggestedPitch: "D4",
        summary: "Move melody",
      },
      null,
    );
    expect(r).toBe("n0");
  });

  it("resolves by staff name in summary at same beat as clicked note", () => {
    const score: EditableScore = {
      parts: [
        {
          id: "p0",
          name: "Violin",
          clef: "treble",
          measures: [
            m("4/4", [
              { id: "v0", pitch: "C4", duration: "q" },
              { id: "v1", pitch: "D4", duration: "q" },
            ]),
          ],
        },
        {
          id: "p1",
          name: "Clarinet",
          clef: "treble",
          measures: [
            m("4/4", [
              { id: "c0", pitch: "E4", duration: "q" },
              { id: "c1", pitch: "F4", duration: "q" },
            ]),
          ],
        },
      ],
    };
    const insight: NoteInsight = {
      noteId: "v1",
      noteLabel: "D4",
      voice: "melody",
      slotIndex: 1,
      inspectorMode: "melody-context",
      source: "local-fallback",
      deterministicExplanation: "",
      evidenceLines: [],
      insightKind: "melody-guide",
      currentPitch: "D4",
      originalEnginePitch: null,
      userModifiedPitch: false,
      currentPitchGuideExplanation: "",
    };
    const r = resolveIdeaActionNoteId(
      score,
      {
        id: "ia1",
        noteId: "wrong-id",
        suggestedPitch: "G4",
        summary: "Transition to G4 in Clarinet",
      },
      insight,
    );
    expect(r).toBe("c1");
  });

  it("prefers longest matching part name when several names are substrings of the summary", () => {
    const score: EditableScore = {
      parts: [
        {
          id: "p0",
          name: "Violin",
          clef: "treble",
          measures: [
            m("4/4", [
              { id: "v0", pitch: "C4", duration: "q" },
              { id: "v1", pitch: "D4", duration: "q" },
            ]),
          ],
        },
        {
          id: "p1",
          name: "Violin II",
          clef: "treble",
          measures: [
            m("4/4", [
              { id: "w0", pitch: "E4", duration: "q" },
              { id: "w1", pitch: "F4", duration: "q" },
            ]),
          ],
        },
      ],
    };
    const insight: NoteInsight = {
      noteId: "v1",
      noteLabel: "D4",
      voice: "melody",
      slotIndex: 1,
      inspectorMode: "melody-context",
      source: "local-fallback",
      deterministicExplanation: "",
      evidenceLines: [],
      insightKind: "melody-guide",
      currentPitch: "D4",
      originalEnginePitch: null,
      userModifiedPitch: false,
      currentPitchGuideExplanation: "",
    };
    const r = resolveIdeaActionNoteId(
      score,
      {
        id: "ia1",
        noteId: "wrong",
        suggestedPitch: "G4",
        summary: "Raise second violin (Violin II) to G4",
      },
      insight,
    );
    expect(r).toBe("w1");
  });

  it("falls back to the nearest sounding note in the clicked part's measure when names tie", () => {
    const score: EditableScore = {
      parts: [
        {
          id: "p0",
          name: "Alto",
          clef: "treble",
          measures: [m("4/4", [{ id: "a0", pitch: "C4", duration: "q" }])],
        },
        {
          id: "p1",
          name: "Alto",
          clef: "treble",
          measures: [m("4/4", [{ id: "a1", pitch: "D4", duration: "q" }])],
        },
      ],
    };
    const insight: NoteInsight = {
      noteId: "a0",
      noteLabel: "C4",
      voice: "x",
      slotIndex: 1,
      inspectorMode: "melody-context",
      source: "local-fallback",
      deterministicExplanation: "",
      evidenceLines: [],
      insightKind: "melody-guide",
      currentPitch: "C4",
      originalEnginePitch: null,
      userModifiedPitch: false,
      currentPitchGuideExplanation: "",
    };
    const r = resolveIdeaActionNoteId(
      score,
      {
        id: "ia1",
        noteId: "wrong",
        suggestedPitch: "E4",
        summary: "Fix Alto line",
      },
      insight,
    );
    // Duplicate "Alto" names rule out the name-match path; the fallback picks the
    // nearest sounding note in the measure the user clicked (part p0).
    expect(r).toBe("a0");
  });

  it("uses staffIndex hint when present to disambiguate duplicates", () => {
    const score: EditableScore = {
      parts: [
        {
          id: "p0",
          name: "Alto",
          clef: "treble",
          measures: [m("4/4", [{ id: "a0", pitch: "C4", duration: "q" }])],
        },
        {
          id: "p1",
          name: "Alto",
          clef: "treble",
          measures: [m("4/4", [{ id: "a1", pitch: "D4", duration: "q" }])],
        },
      ],
    };
    const insight: NoteInsight = {
      noteId: "a0",
      noteLabel: "C4",
      voice: "x",
      slotIndex: 1,
      inspectorMode: "melody-context",
      source: "local-fallback",
      deterministicExplanation: "",
      evidenceLines: [],
      insightKind: "melody-guide",
      currentPitch: "C4",
      originalEnginePitch: null,
      userModifiedPitch: false,
      currentPitchGuideExplanation: "",
    };
    const r = resolveIdeaActionNoteId(
      score,
      {
        id: "ia1",
        noteId: "wrong",
        suggestedPitch: "E4",
        summary: "Fix Alto line",
        staffIndex: 1,
      },
      insight,
    );
    expect(r).toBe("a1");
  });
});
