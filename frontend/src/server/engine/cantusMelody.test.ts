import { describe, expect, it } from "vitest";
import { extractCantusMelody } from "./cantusMelody";
import { solveSatbWithRecovery } from "./runtime";
import type { ParsedScore } from "./types";

describe("extractCantusMelody", () => {
  it("drops bass-register notes from a wide piano reduction", () => {
    const melody = [
      { pitch: "B4", beat: 0, duration: 1 },
      { pitch: "F#5", beat: 1, duration: 0.5 },
      { pitch: "B2", beat: 2, duration: 2 },
      { pitch: "F#3", beat: 2.5, duration: 0.5 },
      { pitch: "D5", beat: 4, duration: 1 },
    ];
    const cantus = extractCantusMelody(melody);
    expect(cantus.every((n) => !n.pitch.endsWith("2") && !n.pitch.endsWith("3"))).toBe(true);
    expect(cantus.some((n) => n.pitch === "B4" || n.pitch === "F#5" || n.pitch === "D5")).toBe(true);
  });

  it("keeps a simple treble melody intact", () => {
    const melody = [
      { pitch: "C5", beat: 0, duration: 1 },
      { pitch: "D5", beat: 1, duration: 1 },
      { pitch: "E5", beat: 2, duration: 2 },
    ];
    expect(extractCantusMelody(melody).map((n) => n.pitch)).toEqual(["C5", "D5", "E5"]);
  });
});

describe("solveSatbWithRecovery piano OMR reduction", () => {
  it("succeeds when interleaved bass notes would otherwise poison soprano lock", () => {
    const melody = [];
    for (let i = 0; i < 24; i++) {
      melody.push({ pitch: i % 2 === 0 ? "E5" : "B2", beat: i, duration: 1 });
    }
    const parsed: ParsedScore = {
      key: { tonic: "D", mode: "major" },
      melody,
      totalBeats: 24,
      timeSignature: { beats: 4, beatType: 4 },
      melodyPartName: "Piano",
      inputParts: [{ partId: "P1", name: "Piano", notes: melody }],
    };
    const out = solveSatbWithRecovery(parsed, { mood: "major", genre: "classical" });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.slots.length).toBeGreaterThan(0);
  });
});
