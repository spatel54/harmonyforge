import { describe, expect, it } from "vitest";
import {
  parsedScoreForChordInference,
  solveSatbWithRecovery,
} from "./runtime";
import type { ParsedScore } from "./types";

describe("parsedScoreForChordInference", () => {
  it("strips multi-staff inputParts so PDF OMR vertical noise is ignored", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [{ pitch: "G5", beat: 0, duration: 4 }],
      totalBeats: 4,
      inputParts: [
        { partId: "P1", name: "Violin", notes: [{ pitch: "G5", beat: 0, duration: 4 }] },
        { partId: "P2", name: "Cello", notes: [{ pitch: "C3", beat: 0, duration: 4 }] },
      ],
    };
    const forInfer = parsedScoreForChordInference(parsed);
    expect(forInfer.inputParts).toBeUndefined();
    expect(forInfer.melody).toEqual(parsed.melody);
  });

  it("leaves single-part scores unchanged", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [{ pitch: "C4", beat: 0, duration: 4 }],
      totalBeats: 4,
      inputParts: [
        { partId: "P1", name: "Melody", notes: [{ pitch: "C4", beat: 0, duration: 4 }] },
      ],
    };
    expect(parsedScoreForChordInference(parsed)).toBe(parsed);
  });
});

describe("solveSatbWithRecovery multi-part PDF layout", () => {
  it("keeps inputParts on the export score after melody-only inference", () => {
    const melody = [
      { pitch: "E5", beat: 0, duration: 1 },
      { pitch: "D5", beat: 1, duration: 1 },
      { pitch: "C5", beat: 2, duration: 2 },
    ];
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody,
      totalBeats: 4,
      timeSignature: { beats: 4, beatType: 4 },
      sourceMusicXml: "<score-partwise/>",
      melodyPartName: "Violin",
      inputParts: [
        { partId: "P1", name: "Violin", notes: melody },
        {
          partId: "P2",
          name: "Cello",
          notes: [
            { pitch: "C3", beat: 0, duration: 1 },
            { pitch: "G2", beat: 1, duration: 1 },
            { pitch: "C3", beat: 2, duration: 2 },
          ],
        },
      ],
    };

    const out = solveSatbWithRecovery(parsed, { mood: "major", genre: "classical" });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.slots.length).toBeGreaterThan(0);
    expect(out.withChords.inputParts).toHaveLength(2);
    expect(out.withChords.sourceMusicXml).toBe("<score-partwise/>");
    expect(out.withChords.melodyPartName).toBe("Violin");
  });
});
