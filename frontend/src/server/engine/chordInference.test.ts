/**
 * Chord inference: adaptive grid caps slot count for long scores.
 */

import {
  DEFAULT_MAX_CHORD_SLOTS,
  downsampleChordSlotsToMax,
  ensureChords,
  inferChords,
  resolveAdaptiveBeatsPerChord,
  resolveMaxChordSlots,
} from "./chordInference";
import type { ParsedScore } from "./types";

function minimalParsed(overrides: Partial<ParsedScore>): ParsedScore {
  return {
    key: { tonic: "C", mode: "major" },
    melody: [{ pitch: "C4", beat: 0, duration: 1 }],
    timeSignature: { beats: 4, beatType: 4 },
    totalBeats: 4,
    totalMeasures: 1,
    ...overrides,
  };
}

describe("resolveAdaptiveBeatsPerChord", () => {
  it("keeps base step when estimated slots are under the cap", () => {
    const parsed = minimalParsed({ totalBeats: 16 });
    expect(resolveAdaptiveBeatsPerChord(parsed, 16, 128)).toBe(2);
  });

  it("widens step when lastBeat would exceed max slots at base grid", () => {
    const parsed = minimalParsed({ timeSignature: { beats: 4, beatType: 4 } });
    const lastBeat = 400;
    const max = 128;
    const step = resolveAdaptiveBeatsPerChord(parsed, lastBeat, max);
    expect(step).toBeGreaterThan(2);
    expect(Math.ceil(lastBeat / step)).toBeLessThanOrEqual(max);
  });

  it("respects DEFAULT_MAX_CHORD_SLOTS for very long scores", () => {
    const parsed = minimalParsed({ totalBeats: 10_000 });
    const step = resolveAdaptiveBeatsPerChord(parsed, 10_000);
    expect(Math.ceil(10_000 / step)).toBeLessThanOrEqual(DEFAULT_MAX_CHORD_SLOTS);
  });
});

describe("inferChords", () => {
  it("produces at most resolveMaxChordSlots() chords for a long score", () => {
    const melody: ParsedScore["melody"] = [];
    for (let b = 0; b < 2000; b += 0.5) {
      melody.push({ pitch: "C4", beat: b, duration: 0.25 });
    }
    const parsed = minimalParsed({
      melody,
      totalBeats: 2000,
      timeSignature: { beats: 4, beatType: 4 },
    });
    const chords = inferChords(parsed);
    expect(chords.length).toBeLessThanOrEqual(resolveMaxChordSlots());
  });

  it("still returns a single default chord for empty melody (caller guard)", () => {
    expect(inferChords(minimalParsed({ melody: [] }))).toEqual([{ roman: "I", beat: 0 }]);
  });
});

describe("downsampleChordSlotsToMax", () => {
  it("returns original when under cap", () => {
    const c = [{ roman: "I", beat: 0 }, { roman: "V", beat: 2 }];
    expect(downsampleChordSlotsToMax(c, 10)).toEqual(c);
  });

  it("reduces to max slots preserving beat order and endpoints", () => {
    const many = Array.from({ length: 300 }, (_, i) => ({
      roman: "I",
      beat: i * 0.5,
    }));
    const out = downsampleChordSlotsToMax(many, 128);
    expect(out.length).toBeLessThanOrEqual(128);
    expect(out.length).toBeGreaterThan(60);
    expect(out[0]!.beat).toBe(0);
    expect(out[out.length - 1]!.beat).toBeCloseTo(299 * 0.5, 5);
  });
});

describe("ensureChords preferInferredChords and mode conflict", () => {
  it("keeps file chords when embedded, mode matches, and preferInferredChords is false", () => {
    const parsed = minimalParsed({
      key: { tonic: "C", mode: "major" },
      chords: [{ roman: "I", beat: 0 }],
      melody: [{ pitch: "C4", beat: 0, duration: 4 }],
    });
    const ec = ensureChords(parsed, "major", "classical");
    expect(ec.chords).toEqual([{ roman: "I", beat: 0 }]);
  });

  it("reinfers when preferInferredChords is true even if file has chords", () => {
    const parsed = minimalParsed({
      key: { tonic: "C", mode: "major" },
      chords: [{ roman: "vi", beat: 0 }],
      melody: [{ pitch: "C4", beat: 0, duration: 4 }],
    });
    const keepFile = ensureChords(parsed, "major", "jazz");
    const reinfer = ensureChords(parsed, "major", "jazz", { preferInferredChords: true });
    expect(keepFile.chords[0]!.roman).toBe("vi");
    expect(reinfer.chords[0]!.roman).not.toBe("vi");
  });

  it("reinfers when user mood conflicts with parsed key mode", () => {
    const parsed = minimalParsed({
      key: { tonic: "C", mode: "major" },
      chords: [{ roman: "I", beat: 0 }],
      melody: [{ pitch: "C4", beat: 0, duration: 4 }],
    });
    const ec = ensureChords(parsed, "minor", "classical");
    expect(ec.key.mode).toBe("minor");
    expect(ec.chords.length).toBeGreaterThan(0);
  });
});

describe("ensureChords embedded chords cap", () => {
  it("downsamples when parsed.chords exceed HF_MAX_CHORD_SLOTS", () => {
    const many = Array.from({ length: 250 }, (_, i) => ({
      roman: "I",
      beat: i,
    }));
    const parsed = minimalParsed({ chords: many, melody: [{ pitch: "C4", beat: 0, duration: 400 }] });
    const prev = process.env.HF_MAX_CHORD_SLOTS;
    process.env.HF_MAX_CHORD_SLOTS = "128";
    try {
      const ec = ensureChords(parsed);
      expect(ec.chords.length).toBeLessThanOrEqual(128);
    } finally {
      if (prev === undefined) delete process.env.HF_MAX_CHORD_SLOTS;
      else process.env.HF_MAX_CHORD_SLOTS = prev;
    }
  });
});
