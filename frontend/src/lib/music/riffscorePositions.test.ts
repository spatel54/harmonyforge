import { describe, expect, it, vi } from "vitest";

import {
  extractNotePositions,
  isPreviewNotehead,
  mapRiffSelectedNotesToHFSelections,
  resolveRsNoteIdToHfNoteId,
} from "./riffscorePositions";
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

  it("resolveRsNoteIdToHfNoteId resolves rse- event ids (RiffScore rest DOM)", () => {
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
              notes: [{ id: "r1", pitch: "B4", duration: "q", isRest: true }],
            },
          ],
        },
      ],
    };
    expect(resolveRsNoteIdToHfNoteId("rse-r1", new Map(), score)).toBe("r1");
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

  it("extractNotePositions merges rest hit-rects when data-note-id only covers pitched notes", () => {
    const container = document.createElement("div");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "riff-ScoreCanvas__svg");
    container.appendChild(svg);

    const staff = document.createElementNS("http://www.w3.org/2000/svg", "g");
    staff.setAttribute("class", "staff");
    svg.appendChild(staff);

    const grpPitch = document.createElementNS("http://www.w3.org/2000/svg", "g");
    grpPitch.setAttribute("class", "note-group-container");
    const head = document.createElementNS("http://www.w3.org/2000/svg", "text");
    head.setAttribute("class", "NoteHead");
    head.setAttribute("data-note-id", "rs-nPitch");
    grpPitch.appendChild(head);
    staff.appendChild(grpPitch);
    vi.spyOn(head, "getBoundingClientRect").mockReturnValue({
      left: 100,
      top: 100,
      width: 10,
      height: 10,
      right: 110,
      bottom: 110,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    } as DOMRect);

    const grpRest = document.createElementNS("http://www.w3.org/2000/svg", "g");
    grpRest.setAttribute("class", "note-group-container");
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    hit.setAttribute("data-testid", "note-rs-nRest");
    grpRest.appendChild(hit);
    staff.appendChild(grpRest);
    vi.spyOn(hit, "getBoundingClientRect").mockReturnValue({
      left: 160,
      top: 100,
      width: 14,
      height: 14,
      right: 174,
      bottom: 114,
      x: 160,
      y: 100,
      toJSON: () => ({}),
    } as DOMRect);

    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 400,
      right: 500,
      bottom: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

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
              notes: [
                { id: "nPitch", pitch: "C4", duration: "q" },
                { id: "nRest", pitch: "B4", duration: "q", isRest: true },
              ],
            },
          ],
        },
      ],
    };

    const empty = new Map<string, string>();
    const positions = extractNotePositions(container, score, empty);
    expect(positions.length).toBe(2);
    const restPos = positions.find((p) => p.selection.noteId === "nRest");
    expect(restPos).toBeDefined();
    expect(restPos!.x).toBe(160);
  });

  it("extractNotePositions maps RiffScore g.rest-group data-testid rest-* to rests", () => {
    const container = document.createElement("div");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "riff-ScoreCanvas__svg");
    container.appendChild(svg);

    const staff = document.createElementNS("http://www.w3.org/2000/svg", "g");
    staff.setAttribute("class", "staff");
    svg.appendChild(staff);

    const restG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    restG.setAttribute("class", "Rest rest-group");
    restG.setAttribute("data-testid", "rest-rse-r1");
    const rrect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rrect.setAttribute("width", "24");
    rrect.setAttribute("height", "32");
    restG.appendChild(rrect);
    staff.appendChild(restG);

    vi.spyOn(rrect, "getBoundingClientRect").mockReturnValue({
      left: 200,
      top: 120,
      width: 24,
      height: 32,
      right: 224,
      bottom: 152,
      x: 200,
      y: 120,
      toJSON: () => ({}),
    } as DOMRect);

    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 600,
      height: 500,
      right: 600,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

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
              notes: [{ id: "r1", pitch: "B4", duration: "q", isRest: true }],
            },
          ],
        },
      ],
    };

    const positions = extractNotePositions(container, score, new Map());
    expect(positions.length).toBe(1);
    expect(positions[0]!.selection.noteId).toBe("r1");
    expect(positions[0]!.x).toBe(200);
  });

  it("mapRiffSelectedNotesToHFSelections maps multiple RiffScore notes to HF selections", () => {
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
              notes: [
                { id: "n1", pitch: "C4", duration: "q" },
                { id: "n2", pitch: "D4", duration: "q" },
              ],
            },
          ],
        },
      ],
    };
    const rsToHf = new Map<string, string>([
      ["rs-n1", "n1"],
      ["rs-n2", "n2"],
    ]);
    const mapped = mapRiffSelectedNotesToHFSelections(
      score,
      [
        { staffIndex: 0, measureIndex: 0, eventId: "e1", noteId: "rs-n1" },
        { staffIndex: 0, measureIndex: 0, eventId: "e2", noteId: "rs-n2" },
      ],
      rsToHf,
    );
    expect(mapped).toHaveLength(2);
    expect(mapped.map((m) => m.noteId).sort()).toEqual(["n1", "n2"]);
  });
});
