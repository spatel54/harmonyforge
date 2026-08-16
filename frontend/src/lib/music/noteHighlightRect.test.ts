import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTE_HIGHLIGHT_PAD,
  notationAboveStaffY,
  notationBelowStaffY,
  noteheadAnchor,
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

  it("anchors glyphs to the clamped notehead, not the stem column", () => {
    const pos: NotePosition = {
      x: 342.8,
      y: 79.5,
      w: 14.2,
      h: 193,
      selection: { partId: "p", measureIndex: 0, noteIndex: 0, noteId: "n1" },
    };
    const a = noteheadAnchor(pos);
    expect(a.top).toBeGreaterThan(140);
    expect(a.bottom).toBeLessThan(200);
    expect(a.bottom - a.top).toBeLessThan(25);
  });

  it("parks articulations above the staff, not on an in-staff notehead", () => {
    // Logged E4: head.top 302.9 sits inside a staff whose top line is ~270.
    expect(notationAboveStaffY(270, 302.9, 10)).toBe(260);
    expect(notationAboveStaffY(270, 240, 10)).toBe(230);
    expect(notationBelowStaffY(318, 314, 10)).toBe(328);
    expect(notationBelowStaffY(318, 340, 10)).toBe(350);
  });
});
