import { describe, expect, it } from "vitest";
import {
  buildIdMap,
  editableScoreToRsScore,
  hfNotePitchFromLiveRsScore,
  riffScoreToEditableScore,
} from "./riffscoreAdapter";
import type { EditableScore } from "./scoreTypes";

const measure = {
  id: "m1",
  notes: [{ id: "n1", pitch: "C4", duration: "q" as const }],
  timeSignature: "4/4",
  keySignature: 0,
};

const minimalOnePart: EditableScore = {
  divisions: 1,
  bpm: 96,
  chords: [{ id: "c1", quant: 0, symbol: "Cmaj7" }],
  parts: [
    {
      id: "P1",
      name: "Melody",
      clef: "treble",
      measures: [measure],
    },
  ],
};

const twoPartsWithChords: EditableScore = {
  divisions: 1,
  bpm: 100,
  chords: [{ id: "c1", quant: 0, symbol: "Dm7" }],
  parts: [
    {
      id: "P1",
      name: "Melody",
      clef: "treble",
      measures: [measure],
    },
    {
      id: "P2",
      name: "Harmony",
      clef: "bass",
      measures: [measure],
    },
  ],
};

const threePartsWithChords: EditableScore = {
  divisions: 1,
  bpm: 96,
  chords: [
    { id: "c1", quant: 0, symbol: "Cmaj7" },
    { id: "c2", quant: 16, symbol: "F7" },
  ],
  parts: [
    {
      id: "P1",
      name: "Melody",
      clef: "treble",
      measures: [measure],
    },
    {
      id: "P2",
      name: "Alto",
      clef: "treble",
      measures: [measure],
    },
    {
      id: "P3",
      name: "Bass",
      clef: "bass",
      measures: [measure],
    },
  ],
};

describe("riffscoreAdapter", () => {
  it("omits chordTrack on RsScore when fewer than 3 parts", () => {
    const rs = editableScoreToRsScore(minimalOnePart);
    expect(rs.bpm).toBe(96);
    expect(rs.chordTrack).toBeUndefined();
  });

  it("omits chordTrack for 2 parts even when EditableScore has chords", () => {
    const rs = editableScoreToRsScore(twoPartsWithChords);
    expect(rs.chordTrack).toBeUndefined();
  });

  it("embeds chordTrack on RsScore when there are 3+ parts and chords", () => {
    const rs = editableScoreToRsScore(threePartsWithChords);
    expect(rs.bpm).toBe(96);
    expect(rs.chordTrack?.length).toBe(2);
    expect(rs.chordTrack?.[0]?.symbol).toBe("Cmaj7");
    expect(rs.chordTrack?.[1]?.symbol).toBe("F7");
  });

  it("does not map chords from RiffScore or previous score when fewer than 3 parts", () => {
    const rs = editableScoreToRsScore(minimalOnePart);
    const hf = riffScoreToEditableScore(rs, new Map(), minimalOnePart.parts, minimalOnePart);
    expect(hf.bpm).toBe(96);
    expect(hf.chords).toBeUndefined();
  });

  it("maps chordTrack and bpm back to EditableScore when 3+ parts", () => {
    const rs = editableScoreToRsScore(threePartsWithChords);
    const hf = riffScoreToEditableScore(rs, new Map(), threePartsWithChords.parts, threePartsWithChords);
    expect(hf.bpm).toBe(96);
    expect(hf.chords?.length).toBe(2);
    expect(hf.chords?.[0]?.symbol).toBe("Cmaj7");
    expect(hf.chords?.[1]?.symbol).toBe("F7");
  });

  it("maps viola alto C-clef to RiffScore alto staff (not SATB voice default treble)", () => {
    const score: EditableScore = {
      divisions: 1,
      bpm: 96,
      parts: [
        {
          id: "P2",
          name: "Viola",
          clef: "alto",
          measures: [measure],
        },
      ],
    };
    const rs = editableScoreToRsScore(score);
    expect(rs.staves[0]?.clef).toBe("alto");
  });

  it("reads pitch from live RiffScore snapshot by HarmonyForge note id", () => {
    const rs = editableScoreToRsScore(minimalOnePart);
    const { rsToHf } = buildIdMap(minimalOnePart, rs);
    const note = rs.staves[0]!.measures[0]!.events[0]!.notes[0]!;
    note.pitch = "G4";
    expect(hfNotePitchFromLiveRsScore(rs, rsToHf, "n1")).toBe("G4");
    note.pitch = "G4";
    note.accidental = "sharp";
    expect(hfNotePitchFromLiveRsScore(rs, rsToHf, "n1")).toBe("G#4");
  });

  it("maps rare C-clefs to nearest RiffScore shape (mezzo→alto, baritone_c→tenor)", () => {
    const mezzo: EditableScore = {
      divisions: 1,
      bpm: 96,
      parts: [{ id: "P1", name: "Vox", clef: "mezzo", measures: [measure] }],
    };
    const bari: EditableScore = {
      divisions: 1,
      bpm: 96,
      parts: [{ id: "P1", name: "Vox", clef: "baritone_c", measures: [measure] }],
    };
    expect(editableScoreToRsScore(mezzo).staves[0]?.clef).toBe("alto");
    expect(editableScoreToRsScore(bari).staves[0]?.clef).toBe("tenor");
  });

  it("buildIdMap maps RiffScore event id (rse-…) for rests to HF note id", () => {
    const hfScore: EditableScore = {
      divisions: 1,
      bpm: 96,
      parts: [
        {
          id: "p1",
          name: "S",
          clef: "treble",
          measures: [
            {
              id: "m0",
              notes: [{ id: "rest-a", pitch: "B4", duration: "q", isRest: true }],
            },
          ],
        },
      ],
    };
    const rs = editableScoreToRsScore(hfScore);
    const { rsToHf } = buildIdMap(hfScore, rs);
    const eventId = rs.staves[0]!.measures[0]!.events[0]!.id;
    expect(eventId).toMatch(/^rse-rest-a/);
    expect(rsToHf.get(eventId)).toBe("rest-a");
    expect(rsToHf.get("rs-rest-a")).toBe("rest-a");
  });
});
