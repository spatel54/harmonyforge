/**
 * Tests for scoreUtils manipulation helpers.
 * Focus: deleteNotesAsRests (Iter2 §2) — delete must preserve surrounding
 * durations by swapping selected events for rests of the same length.
 */
import { describe, expect, it } from "vitest";

import {
  cloneScore,
  convertRestToPitch,
  deleteNotesAsRests,
  enforceMeasureBeatCaps,
  extractMelodyOnlyScore,
  noteBeats,
  normalizeScoreRests,
  propagateMultiSelectPitchDelta,
  replaceHarmonyMeasuresRange,
  spliceHarmonyMeasuresFromAddonScore,
  measureRangeForLocalizedHarmonyRegenerate,
  naturalDiatonicStepNotes,
  restsToNotes,
  scoreHasMeasureOverflow,
  setNoteDynamics,
  setPitchByLetter,
  spellMidiPreferMajorKeySignature,
  toggleNoteDots,
  toggleNoteRests,
  transposeNotes,
  transposeNotesForceNaturalLetters,
} from "./scoreUtils";
import type { EditableScore } from "./scoreTypes";

function makeScore(): EditableScore {
  return {
    parts: [
      {
        id: "p1",
        name: "Melody",
        clef: "treble",
        measures: [
          {
            id: "m1",
            timeSignature: "4/4",
            notes: [
              { id: "n1", pitch: "C5", duration: "q" },
              { id: "n2", pitch: "D5", duration: "q", articulations: ["staccato"] },
              { id: "n3", pitch: "E5", duration: "q", tie: "start" },
              { id: "n4", pitch: "F5", duration: "q", dynamics: "mf" },
            ],
          },
        ],
      },
    ],
    divisions: 4,
  };
}

describe("propagateMultiSelectPitchDelta", () => {
  it("applies the edited note’s chromatic delta to other unchanged selected notes", () => {
    const prev: EditableScore = {
      parts: [
        {
          id: "p1",
          name: "M",
          clef: "treble",
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              notes: [
                { id: "n1", pitch: "C4", duration: "q" },
                { id: "n2", pitch: "D4", duration: "q" },
              ],
            },
          ],
        },
      ],
      divisions: 1,
    };
    const next = cloneScore(prev);
    next.parts[0]!.measures[0]!.notes[0]!.pitch = "D4";
    const out = propagateMultiSelectPitchDelta(prev, next, new Set(["n1", "n2"]));
    expect(out.parts[0]!.measures[0]!.notes[0]!.pitch).toBe("D4");
    // Same +2 semitone delta as n1 (C4→D4): D4 + 2 → E4.
    expect(out.parts[0]!.measures[0]!.notes[1]!.pitch).toBe("E4");
  });

  it("no-ops when fewer than two notes are selected", () => {
    const prev = makeScore();
    const next = cloneScore(prev);
    next.parts[0]!.measures[0]!.notes[0]!.pitch = "D5";
    const out = propagateMultiSelectPitchDelta(prev, next, new Set(["n1"]));
    expect(out).toEqual(next);
  });
});

describe("spellMidiPreferMajorKeySignature", () => {
  it("uses diatonic spelling in G major", () => {
    expect(spellMidiPreferMajorKeySignature(67, 1)).toBe("G4");
    expect(spellMidiPreferMajorKeySignature(69, 1)).toBe("A4");
  });

  it("prefers Bb in F major", () => {
    expect(spellMidiPreferMajorKeySignature(58, -1)).toBe("Bb3");
  });

  it("falls back outside the scale", () => {
    expect(spellMidiPreferMajorKeySignature(61, 0)).toBe("C#4");
  });
});

describe("transposeNotes key-aware spelling", () => {
  it("whole-step up uses key signature spelling", () => {
    const score: EditableScore = {
      divisions: 4,
      parts: [
        {
          id: "p",
          name: "M",
          clef: "treble",
          measures: [
            {
              id: "m1",
              keySignature: 1,
              timeSignature: "4/4",
              notes: [{ id: "n1", pitch: "G4", duration: "q" }],
            },
          ],
        },
      ],
    };
    const out = transposeNotes(score, new Set(["n1"]), 2);
    expect(out.parts[0]!.measures[0]!.notes[0]!.pitch).toBe("A4");
  });
});

const NATURAL_PITCH = /^[A-G]\d+$/;

describe("naturalDiatonicStepNotes (keyboard ↑↓)", () => {
  it("steps up/down along letter names with naturals-only strings", () => {
    const score = makeScore();
    const up = naturalDiatonicStepNotes(score, new Set(["n1"]), 1);
    expect(up.parts[0]!.measures[0]!.notes[0]!.pitch).toBe("D5");
    expect(up.parts[0]!.measures[0]!.notes[0]!.pitch).toMatch(NATURAL_PITCH);
    const down = naturalDiatonicStepNotes(score, new Set(["n1"]), -1);
    expect(down.parts[0]!.measures[0]!.notes[0]!.pitch).toBe("B4");
    expect(down.parts[0]!.measures[0]!.notes[0]!.pitch).toMatch(NATURAL_PITCH);
  });

  it("crosses E–F and B–C by one diatonic step", () => {
    const s: EditableScore = {
      divisions: 4,
      parts: [
        {
          id: "p",
          name: "M",
          clef: "treble",
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              notes: [
                { id: "a", pitch: "E5", duration: "q" },
                { id: "b", pitch: "B4", duration: "q" },
              ],
            },
          ],
        },
      ],
    };
    const eUp = naturalDiatonicStepNotes(s, new Set(["a"]), 1);
    expect(eUp.parts[0]!.measures[0]!.notes[0]!.pitch).toBe("F5");
    const bUp = naturalDiatonicStepNotes(s, new Set(["b"]), 1);
    expect(bUp.parts[0]!.measures[0]!.notes[1]!.pitch).toBe("C5");
  });

  it("from a sharp, snaps to white key then steps (output natural)", () => {
    const s: EditableScore = {
      divisions: 4,
      parts: [
        {
          id: "p",
          name: "M",
          clef: "treble",
          measures: [
            { id: "m1", timeSignature: "4/4", notes: [{ id: "x", pitch: "F#4", duration: "q" }] },
          ],
        },
      ],
    };
    const out = naturalDiatonicStepNotes(s, new Set(["x"]), 1);
    expect(out.parts[0]!.measures[0]!.notes[0]!.pitch).toBe("G4");
    expect(out.parts[0]!.measures[0]!.notes[0]!.pitch).toMatch(NATURAL_PITCH);
  });
});

describe("transposeNotesForceNaturalLetters (⌘/Ctrl arrows)", () => {
  it("octave shift uses natural spellings only", () => {
    const score = makeScore();
    const out = transposeNotesForceNaturalLetters(score, new Set(["n1", "n2"]), 12);
    for (const id of ["n1", "n2"] as const) {
      const n = out.parts[0]!.measures[0]!.notes.find((x) => x.id === id);
      expect(n?.pitch).toMatch(NATURAL_PITCH);
    }
    expect(out.parts[0]!.measures[0]!.notes[0]!.pitch).toBe("C6");
    expect(out.parts[0]!.measures[0]!.notes[1]!.pitch).toBe("D6");
  });
});

describe("enforceMeasureBeatCaps", () => {
  it("splits nine quarter notes in 4/4 into multiple measures", () => {
    const nineQs: EditableScore = {
      parts: [
        {
          id: "p1",
          name: "Melody",
          clef: "treble",
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              notes: Array.from({ length: 9 }, (_, i) => ({
                id: `n${i}`,
                pitch: "B4",
                duration: "q" as const,
              })),
            },
          ],
        },
      ],
      divisions: 4,
    };
    expect(scoreHasMeasureOverflow(nineQs)).toBe(true);
    const fixed = normalizeScoreRests(enforceMeasureBeatCaps(nineQs));
    expect(scoreHasMeasureOverflow(fixed)).toBe(false);
    expect(fixed.parts[0]!.measures.length).toBe(3);
    const beatsPerM = fixed.parts[0]!.measures.map((m) =>
      m.notes.reduce((s, n) => s + noteBeats(n), 0),
    );
    for (const b of beatsPerM) {
      expect(b).toBeCloseTo(4, 5);
    }
  });

  it("keeps a single 4/4 measure when totals equal four beats", () => {
    const ok: EditableScore = {
      parts: [
        {
          id: "p1",
          name: "M",
          clef: "treble",
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              notes: [
                { id: "a", pitch: "C5", duration: "q" },
                { id: "b", pitch: "D5", duration: "q" },
                { id: "c", pitch: "E5", duration: "h" },
              ],
            },
          ],
        },
      ],
      divisions: 4,
    };
    const out = enforceMeasureBeatCaps(ok);
    expect(out.parts[0]!.measures.length).toBe(1);
    expect(scoreHasMeasureOverflow(out)).toBe(false);
  });
});

describe("deleteNotesAsRests", () => {
  it("replaces selected notes with same-duration rests", () => {
    const score = makeScore();
    const next = deleteNotesAsRests(score, new Set(["n2"]));
    const notes = next.parts[0]!.measures[0]!.notes;
    expect(notes.length).toBe(4);
    expect(notes[1]!.isRest).toBe(true);
    expect(notes[1]!.duration).toBe("q");
    // Neighbor durations must not change.
    expect(notes[0]!.duration).toBe("q");
    expect(notes[2]!.duration).toBe("q");
    expect(notes[3]!.duration).toBe("q");
    // Stable note-ids — enables undo + suggestion rollback paths.
    expect(notes.map((n) => n.id)).toEqual(["n1", "n2", "n3", "n4"]);
  });

  it("strips articulation/dynamic/tie metadata on converted rests", () => {
    const score = makeScore();
    const next = deleteNotesAsRests(score, new Set(["n2", "n3", "n4"]));
    const notes = next.parts[0]!.measures[0]!.notes;
    expect(notes[1]!.articulations).toBeUndefined();
    expect(notes[2]!.tie).toBeUndefined();
    expect(notes[3]!.dynamics).toBeUndefined();
  });

  it("no-ops when the id set is empty", () => {
    const score = makeScore();
    const next = deleteNotesAsRests(score, new Set());
    expect(next).toBe(score);
  });

  it("normalizeScoreRests keeps rest fillers aligned to beat boundaries after 8+16", () => {
    const scoreWith816: EditableScore = {
      parts: [
        {
          id: "p1",
          name: "Melody",
          clef: "treble",
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              notes: [
                { id: "a", pitch: "C5", duration: "q" },
                { id: "b", pitch: "D5", duration: "q" },
                { id: "c", pitch: "E5", duration: "8" },
                { id: "d", pitch: "F5", duration: "16" },
              ],
            },
          ],
        },
      ],
      divisions: 4,
    };
    const normalized = normalizeScoreRests(scoreWith816);
    const notes = normalized.parts[0]!.measures[0]!.notes;
    // Sum of real note beats: 1 + 1 + 0.5 + 0.25 = 2.75. Remainder = 1.25 beats.
    // Beat-aware fill must NOT start the filler with a single quarter rest
    // that crosses beat 3 → beat 4; it should place a 16th first (to complete
    // beat 3), then a full-quarter rest for beat 4, in that order.
    const firstFiller = notes[4];
    const secondFiller = notes[5];
    expect(firstFiller?.isRest).toBe(true);
    expect(firstFiller?.duration).toBe("16");
    expect(secondFiller?.isRest).toBe(true);
    expect(secondFiller?.duration).toBe("q");
  });

  it("downstream normalize does not truncate the converted rest", () => {
    const score = makeScore();
    const next = deleteNotesAsRests(score, new Set(["n1", "n4"]));
    const normalized = normalizeScoreRests(next);
    const notes = normalized.parts[0]!.measures[0]!.notes;
    // Four quarter events remain (two original, two now-rest).
    expect(notes.length).toBeGreaterThanOrEqual(4);
    expect(notes[0]!.isRest).toBe(true);
    expect(notes[0]!.duration).toBe("q");
  });
});

describe("toolbar-targeted selection transforms", () => {
  it("toggleNoteRests flips selected notes and preserves non-selected events", () => {
    const score = makeScore();
    const next = toggleNoteRests(score, new Set(["n2", "n3"]));
    const notes = next.parts[0]!.measures[0]!.notes;
    expect(notes[1]!.isRest).toBe(true);
    expect(notes[1]!.pitch).toBe("B4");
    expect(notes[2]!.isRest).toBe(true);
    expect(notes[0]!.isRest).toBeUndefined();
    expect(notes[3]!.isRest).toBeUndefined();
  });

  it("toggleNoteDots only updates selected notes", () => {
    const score = makeScore();
    const next = toggleNoteDots(score, new Set(["n1", "n4"]));
    const notes = next.parts[0]!.measures[0]!.notes;
    expect(notes[0]!.dots).toBe(1);
    expect(notes[3]!.dots).toBe(1);
    expect(notes[1]!.dots).toBeUndefined();
  });

  it("setNoteDynamics writes dynamics for selected ids including rests", () => {
    const score = toggleNoteRests(makeScore(), new Set(["n2"]));
    const next = setNoteDynamics(score, new Set(["n2", "n3"]), "f");
    const notes = next.parts[0]!.measures[0]!.notes;
    expect(notes[1]!.isRest).toBe(true);
    expect(notes[1]!.dynamics).toBe("f");
    expect(notes[2]!.dynamics).toBe("f");
    expect(notes[0]!.dynamics).toBeUndefined();
  });
});

describe("restsToNotes (MuseScore repitch)", () => {
  function makeRestScore(): EditableScore {
    return {
      parts: [
        {
          id: "p1",
          name: "Melody",
          clef: "treble",
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              notes: [
                { id: "n1", pitch: "C5", duration: "q" },
                {
                  id: "n2",
                  pitch: "B4",
                  duration: "h",
                  isRest: true,
                  articulations: ["staccato"],
                  dynamics: "mf",
                  tie: "start",
                },
                { id: "n3", pitch: "E5", duration: "q" },
              ],
            },
          ],
        },
      ],
      divisions: 4,
    };
  }

  it("converts a rest into a note at the same duration", () => {
    const score = makeRestScore();
    const next = restsToNotes(score, new Set(["n2"]), "G");
    const notes = next.parts[0]!.measures[0]!.notes;
    expect(notes[1]!.isRest).toBeFalsy();
    expect(notes[1]!.duration).toBe("h");
    expect(notes[1]!.pitch).toMatch(/^G\d$/);
  });

  it("inherits octave from nearest pitched neighbor", () => {
    const score = makeRestScore();
    const next = restsToNotes(score, new Set(["n2"]), "D");
    const notes = next.parts[0]!.measures[0]!.notes;
    // Neighbors live in octave 5 (C5, E5) → D should resolve to D5 not D4.
    expect(notes[1]!.pitch).toBe("D5");
  });

  it("strips rest metadata (tie/articulation/dynamics) on conversion", () => {
    const score = makeRestScore();
    const next = restsToNotes(score, new Set(["n2"]), "A");
    const note = next.parts[0]!.measures[0]!.notes[1]!;
    expect(note.articulations).toBeUndefined();
    expect(note.dynamics).toBeUndefined();
    expect(note.tie).toBeUndefined();
  });

  it("keeps an empty-measure rest at its declared duration", () => {
    const score: EditableScore = {
      parts: [
        {
          id: "p1",
          name: "Melody",
          clef: "bass",
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              notes: [{ id: "r1", pitch: "B4", duration: "w", isRest: true }],
            },
          ],
        },
      ],
      divisions: 4,
    };
    const next = restsToNotes(score, new Set(["r1"]), "F");
    const note = next.parts[0]!.measures[0]!.notes[0]!;
    expect(note.duration).toBe("w");
    expect(note.isRest).toBeFalsy();
    // Bass clef default octave (D3) → F3.
    expect(note.pitch).toBe("F3");
  });

  it("no-ops on empty id set", () => {
    const score = makeRestScore();
    expect(restsToNotes(score, new Set(), "C")).toBe(score);
  });

  it("setPitchByLetter repitches selected rests as notes", () => {
    const score = makeRestScore();
    const next = setPitchByLetter(score, new Set(["n2"]), "F");
    const note = next.parts[0]!.measures[0]!.notes[1]!;
    expect(note.isRest).toBeFalsy();
    expect(note.duration).toBe("h");
    expect(note.pitch).toMatch(/^F\d$/);
  });

  it("transposeNotes converts a rest before transposing", () => {
    const score = makeRestScore();
    const next = transposeNotes(score, new Set(["n2"]), 1);
    const note = next.parts[0]!.measures[0]!.notes[1]!;
    expect(note.isRest).toBeFalsy();
    expect(note.duration).toBe("h");
  });

  it("convertRestToPitch applies an explicit pitch at the same duration", () => {
    const score = makeRestScore();
    const next = convertRestToPitch(score, "n2", "A3");
    const note = next.parts[0]!.measures[0]!.notes[1]!;
    expect(note.isRest).toBeFalsy();
    expect(note.pitch).toBe("A3");
    expect(note.duration).toBe("h");
  });
});

describe("extractMelodyOnlyScore / replaceHarmonyMeasuresRange", () => {
  it("keeps only the first part for melody export", () => {
    const score: EditableScore = {
      divisions: 4,
      parts: [
        {
          id: "a",
          name: "M",
          clef: "treble",
          measures: [{ id: "m1", notes: [{ id: "n1", pitch: "C5", duration: "q" }] }],
        },
        {
          id: "b",
          name: "H",
          clef: "treble",
          measures: [{ id: "m2", notes: [{ id: "n2", pitch: "E4", duration: "q" }] }],
        },
      ],
    };
    const m = extractMelodyOnlyScore(score);
    expect(m.parts.length).toBe(1);
    expect(m.parts[0]!.name).toBe("M");
  });

  it("splices generated harmony measures into the live score", () => {
    const live: EditableScore = {
      divisions: 4,
      parts: [
        {
          id: "a",
          name: "M",
          clef: "treble",
          measures: [
            { id: "m0", notes: [{ id: "a0", pitch: "C5", duration: "q" }] },
            { id: "m1", notes: [{ id: "a1", pitch: "D5", duration: "q" }] },
          ],
        },
        {
          id: "b",
          name: "H",
          clef: "treble",
          measures: [
            { id: "m0", notes: [{ id: "h0", pitch: "E4", duration: "q" }] },
            { id: "m1", notes: [{ id: "h1", pitch: "F4", duration: "q" }] },
          ],
        },
      ],
    };
    const gen: EditableScore = {
      divisions: 4,
      parts: [
        {
          id: "a",
          name: "M",
          clef: "treble",
          measures: [
            { id: "x0", notes: [{ id: "x0", pitch: "C5", duration: "q" }] },
            { id: "x1", notes: [{ id: "x1", pitch: "D5", duration: "q" }] },
          ],
        },
        {
          id: "b",
          name: "H",
          clef: "treble",
          measures: [
            { id: "y0", notes: [{ id: "y0", pitch: "G4", duration: "q" }] },
            { id: "y1", notes: [{ id: "y1", pitch: "A4", duration: "q" }] },
          ],
        },
      ],
    };
    const out = replaceHarmonyMeasuresRange(live, gen, 0, 0);
    expect(out.parts[1]!.measures[0]!.notes[0]!.pitch).toBe("G4");
    expect(out.parts[1]!.measures[0]!.notes[0]!.id).not.toBe("h0");
    expect(out.parts[1]!.measures[1]!.notes[0]!.pitch).toBe("F4");
  });
});

describe("measureRangeForLocalizedHarmonyRegenerate", () => {
  it("uses fallback when selection is empty", () => {
    expect(measureRangeForLocalizedHarmonyRegenerate([], 3)).toEqual({
      startMeasure: 3,
      endMeasure: 3,
    });
  });

  it("uses single measure when selection is in one bar", () => {
    const sel = [
      { partId: "a", measureIndex: 2, noteIndex: 0, noteId: "n1" },
      { partId: "a", measureIndex: 2, noteIndex: 1, noteId: "n2" },
    ];
    expect(measureRangeForLocalizedHarmonyRegenerate(sel, 0)).toEqual({
      startMeasure: 2,
      endMeasure: 2,
    });
  });

  it("spans min–max when selection crosses measures", () => {
    const sel = [
      { partId: "a", measureIndex: 1, noteIndex: 0, noteId: "n1" },
      { partId: "a", measureIndex: 4, noteIndex: 0, noteId: "n2" },
    ];
    expect(measureRangeForLocalizedHarmonyRegenerate(sel, 2)).toEqual({
      startMeasure: 1,
      endMeasure: 4,
    });
  });
});

describe("spliceHarmonyMeasuresFromAddonScore", () => {
  it("splices one measure by index when part counts match", () => {
    const live: EditableScore = {
      divisions: 4,
      parts: [
        {
          id: "a",
          name: "M",
          clef: "treble",
          measures: [
            { id: "m0", notes: [{ id: "a0", pitch: "C5", duration: "q" }] },
            { id: "m1", notes: [{ id: "a1", pitch: "D5", duration: "q" }] },
          ],
        },
        {
          id: "b",
          name: "H",
          clef: "treble",
          measures: [
            { id: "m0", notes: [{ id: "h0", pitch: "E4", duration: "q" }] },
            { id: "m1", notes: [{ id: "h1", pitch: "F4", duration: "q" }] },
          ],
        },
      ],
    };
    const gen: EditableScore = {
      divisions: 4,
      parts: [
        {
          id: "a",
          name: "M",
          clef: "treble",
          measures: [{ id: "x0", notes: [{ id: "x0", pitch: "C5", duration: "q" }] }],
        },
        {
          id: "b",
          name: "H",
          clef: "treble",
          measures: [{ id: "y0", notes: [{ id: "y0", pitch: "G4", duration: "q" }] }],
        },
      ],
    };
    const r = spliceHarmonyMeasuresFromAddonScore(live, gen, 0);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.score.parts[1]!.measures[0]!.notes[0]!.pitch).toBe("G4");
    expect(r.score.parts[1]!.measures[1]!.notes[0]!.pitch).toBe("F4");
  });

  it("rejects when addon has more parts than the live score", () => {
    const live: EditableScore = {
      divisions: 4,
      parts: [
        {
          id: "a",
          name: "M",
          clef: "treble",
          measures: [{ id: "m0", notes: [{ id: "a0", pitch: "C5", duration: "q" }] }],
        },
        {
          id: "b",
          name: "H1",
          clef: "treble",
          measures: [{ id: "m0", notes: [{ id: "h0", pitch: "E4", duration: "q" }] }],
        },
      ],
    };
    const gen: EditableScore = {
      divisions: 4,
      parts: [
        {
          id: "a",
          name: "M",
          clef: "treble",
          measures: [{ id: "x0", notes: [{ id: "x0", pitch: "C5", duration: "q" }] }],
        },
        {
          id: "b",
          name: "H1",
          clef: "treble",
          measures: [{ id: "y0", notes: [{ id: "y0", pitch: "G4", duration: "q" }] }],
        },
        {
          id: "c",
          name: "H2",
          clef: "bass",
          measures: [{ id: "z0", notes: [{ id: "z0", pitch: "C3", duration: "q" }] }],
        },
      ],
    };
    const r = spliceHarmonyMeasuresFromAddonScore(live, gen, 0);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.score.parts[1]!.measures[0]!.notes[0]!.pitch).toBe("E4");
    expect(r.reason).toContain("Regenerate");
  });

  it("partial merge when addon has fewer harmony parts", () => {
    const live: EditableScore = {
      divisions: 4,
      parts: [
        {
          id: "a",
          name: "M",
          clef: "treble",
          measures: [{ id: "m0", notes: [{ id: "a0", pitch: "C5", duration: "q" }] }],
        },
        {
          id: "b",
          name: "Violin",
          clef: "treble",
          measures: [{ id: "m0", notes: [{ id: "h0", pitch: "E4", duration: "q" }] }],
        },
        {
          id: "c",
          name: "Cello",
          clef: "bass",
          measures: [{ id: "m0", notes: [{ id: "c0", pitch: "C3", duration: "q" }] }],
        },
      ],
    };
    const gen: EditableScore = {
      divisions: 4,
      parts: [
        {
          id: "a",
          name: "M",
          clef: "treble",
          measures: [{ id: "x0", notes: [{ id: "x0", pitch: "C5", duration: "q" }] }],
        },
        {
          id: "b",
          name: "Violin",
          clef: "treble",
          measures: [{ id: "y0", notes: [{ id: "y0", pitch: "G4", duration: "q" }] }],
        },
      ],
    };
    const r = spliceHarmonyMeasuresFromAddonScore(live, gen, 0);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.partialMerge).toBe(true);
    expect(r.skippedHarmonyPartNames).toContain("Cello");
    expect(r.score.parts[1]!.measures[0]!.notes[0]!.pitch).toBe("G4");
    expect(r.score.parts[2]!.measures[0]!.notes[0]!.pitch).toBe("C3");
  });

  it("maps harmony staves by part name when indices disagree", () => {
    const live: EditableScore = {
      divisions: 4,
      parts: [
        {
          id: "a",
          name: "M",
          clef: "treble",
          measures: [{ id: "m0", notes: [{ id: "a0", pitch: "C5", duration: "q" }] }],
        },
        {
          id: "t",
          name: "Tenor",
          clef: "treble",
          measures: [{ id: "m0", notes: [{ id: "t0", pitch: "E4", duration: "q" }] }],
        },
        {
          id: "al",
          name: "Alto",
          clef: "treble",
          measures: [{ id: "m0", notes: [{ id: "al0", pitch: "C4", duration: "q" }] }],
        },
      ],
    };
    const gen: EditableScore = {
      divisions: 4,
      parts: [
        {
          id: "a",
          name: "M",
          clef: "treble",
          measures: [{ id: "x0", notes: [{ id: "x0", pitch: "C5", duration: "q" }] }],
        },
        {
          id: "al",
          name: "Alto",
          clef: "treble",
          measures: [{ id: "y0", notes: [{ id: "y0", pitch: "D4", duration: "q" }] }],
        },
        {
          id: "t",
          name: "Tenor",
          clef: "treble",
          measures: [{ id: "z0", notes: [{ id: "z0", pitch: "F4", duration: "q" }] }],
        },
      ],
    };
    const r = spliceHarmonyMeasuresFromAddonScore(live, gen, 0);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.score.parts[1]!.measures[0]!.notes[0]!.pitch).toBe("F4");
    expect(r.score.parts[2]!.measures[0]!.notes[0]!.pitch).toBe("D4");
  });
});
