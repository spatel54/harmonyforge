import { describe, expect, it } from "vitest";
import { coerceChordRoman, normalizeKeyTonic } from "./chordRomanCoerce";
import { generateSATB } from "./solver";
import { ensureChords } from "./chordInference";

describe("normalizeKeyTonic", () => {
  it("maps flat key names to sharp PitchClass", () => {
    expect(normalizeKeyTonic("Bb")).toBe("A#");
    expect(normalizeKeyTonic("Eb")).toBe("D#");
  });
});

describe("coerceChordRoman", () => {
  const cMajor = { tonic: "C" as const, mode: "major" as const };

  it("passes through valid Romans", () => {
    expect(coerceChordRoman("V7", cMajor)).toBe("V7");
    expect(coerceChordRoman("iiø7", cMajor)).toBe("iiø7");
  });

  it("maps lead-sheet symbols to diatonic Romans", () => {
    expect(coerceChordRoman("C", cMajor)).toBe("I");
    expect(coerceChordRoman("Dm", cMajor)).toBe("ii");
    expect(coerceChordRoman("G7", cMajor)).toBe("V7");
    expect(coerceChordRoman("Am", cMajor)).toBe("vi");
  });

  it("returns null for non-chord tokens", () => {
    expect(coerceChordRoman("X", cMajor)).toBeNull();
    expect(coerceChordRoman("", cMajor)).toBeNull();
  });
});

describe("lead-sheet file chords → SATB", () => {
  it("ensureChords coerces lead-sheet labels instead of failing generate", () => {
    const parsed = {
      key: { tonic: "C" as const, mode: "major" as const },
      melody: [
        { pitch: "E4", beat: 0, duration: 1 },
        { pitch: "D4", beat: 1, duration: 1 },
        { pitch: "C4", beat: 2, duration: 2 },
      ],
      chords: [
        { roman: "C", beat: 0 },
        { roman: "G7", beat: 1 },
        { roman: "Am", beat: 2 },
      ],
      totalBeats: 4,
      timeSignature: { beats: 4, beatType: 4 },
    };
    const ec = ensureChords(parsed);
    expect(ec.chords.map((c) => c.roman)).toEqual(["I", "V7", "vi"]);
    const result = generateSATB({
      key: ec.key,
      chords: ec.chords,
      melody: ec.melody,
    });
    expect(result).not.toBeNull();
    expect(result!.slots).toHaveLength(3);
  });

  it("generateSATB coerces lead-sheet Romans directly", () => {
    const result = generateSATB({
      key: { tonic: "C", mode: "major" },
      chords: [
        { roman: "C", beat: 0 },
        { roman: "G7", beat: 1 },
        { roman: "C", beat: 2 },
      ],
      melody: [
        { pitch: "E4", beat: 0, duration: 1 },
        { pitch: "D4", beat: 1, duration: 1 },
        { pitch: "C4", beat: 2, duration: 1 },
      ],
    });
    expect(result).not.toBeNull();
  });

  it("reinfers when file chords are unusable", () => {
    const parsed = {
      key: { tonic: "C" as const, mode: "major" as const },
      melody: [{ pitch: "C4", beat: 0, duration: 4 }],
      chords: [{ roman: "X", beat: 0 }],
      totalBeats: 4,
      timeSignature: { beats: 4, beatType: 4 },
    };
    const ec = ensureChords(parsed);
    expect(ec.chords.every((c) => c.roman !== "X")).toBe(true);
    expect(generateSATB({ key: ec.key, chords: ec.chords, melody: ec.melody })).not.toBeNull();
  });
});
