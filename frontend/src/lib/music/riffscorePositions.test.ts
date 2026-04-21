import { describe, expect, it } from "vitest";

import { isPreviewNotehead, resolveRsNoteIdToHfNoteId } from "./riffscorePositions";
import type { EditableScore } from "./scoreTypes";

describe("isPreviewNotehead", () => {
  it("returns false for a real notehead (RiffScore wraps the head in pointer-events:none inside g.note-group-container)", () => {
    const outer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    outer.setAttribute("class", "note-group-container");
    const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
    wrap.style.pointerEvents = "none";
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("class", "NoteHead");
    outer.appendChild(wrap);
    wrap.appendChild(text);
    expect(isPreviewNotehead(text)).toBe(false);
  });

  it("resolveRsNoteIdToHfNoteId uses rs- prefix when map is empty", () => {
    const score: EditableScore = {
      divisions: 1,
      parts: [
        {
          id: "p1",
          name: "S",
          clef: "treble",
          measures: [
            {
              id: "m0",
              notes: [{ id: "n1", pitch: "C4", duration: "q" }],
            },
          ],
        },
      ],
    };
    const empty = new Map<string, string>();
    expect(resolveRsNoteIdToHfNoteId("rs-n1", empty, score)).toBe("n1");
    expect(resolveRsNoteIdToHfNoteId("rs-missing", empty, score)).toBe(null);
  });

  it("returns true for ghost/preview noteheads (no g.note-group-container ancestor)", () => {
    const chord = document.createElementNS("http://www.w3.org/2000/svg", "g");
    chord.setAttribute("class", "chord-group chord-group--ghost");
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("class", "NoteHead");
    chord.appendChild(text);
    expect(isPreviewNotehead(text)).toBe(true);
  });
});
