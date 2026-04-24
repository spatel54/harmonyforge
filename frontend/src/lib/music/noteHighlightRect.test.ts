import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTE_HIGHLIGHT_PAD,
  tightNoteHighlightRect,
} from "./noteHighlightRect";
import type { NotePosition } from "./scoreTypes";

describe("tightNoteHighlightRect", () => {
  it("caps tall DOM boxes to a short pill", () => {
    const pos: NotePosition = {
      x: 100,
      y: 50,
      w: 12,
      h: 120,
      selection: { partId: "p", measureIndex: 0, noteIndex: 0, noteId: "n1" },
    };
    const r = tightNoteHighlightRect(pos, DEFAULT_NOTE_HIGHLIGHT_PAD, DEFAULT_NOTE_HIGHLIGHT_PAD);
    expect(r.height).toBeLessThan(40);
    expect(r.top).toBeGreaterThan(pos.y);
    expect(r.top + r.height).toBeLessThan(pos.y + pos.h);
  });

  it("keeps small boxes readable", () => {
    const pos: NotePosition = {
      x: 0,
      y: 0,
      w: 14,
      h: 14,
      selection: { partId: "p", measureIndex: 0, noteIndex: 0, noteId: "n2" },
    };
    const r = tightNoteHighlightRect(pos, DEFAULT_NOTE_HIGHLIGHT_PAD, DEFAULT_NOTE_HIGHLIGHT_PAD);
    expect(r.width).toBeGreaterThan(10);
    expect(r.height).toBeGreaterThan(10);
  });
});
