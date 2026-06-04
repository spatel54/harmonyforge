import { beforeEach, describe, expect, it } from "vitest";
import type { EditableScore } from "@/lib/music/scoreTypes";
import { useScoreDisplayStore } from "@/store/useScoreDisplayStore";
import {
  SANDBOX_EXPORT_FORMATS,
  isSandboxExportFormatId,
  scoreToBrandedExportMusicXML,
  scoreToExportMusicXML,
} from "./exportFormats";

const tinyScore: EditableScore = {
  divisions: 1,
  bpm: 120,
  parts: [
    {
      id: "p1",
      name: "Piano",
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

describe("SANDBOX_EXPORT_FORMATS", () => {
  it("lists only the supported sandbox export targets", () => {
    expect(SANDBOX_EXPORT_FORMATS.map((f) => f.id)).toEqual([
      "pdf",
      "xml",
      "wav",
      "midi",
    ]);
  });
});

describe("isSandboxExportFormatId", () => {
  it("accepts known ids and rejects legacy formats", () => {
    expect(isSandboxExportFormatId("midi")).toBe(true);
    expect(isSandboxExportFormatId("zip")).toBe(false);
    expect(isSandboxExportFormatId("json")).toBe(false);
  });
});

const scoreWithChord: EditableScore = {
  divisions: 1,
  chords: [{ id: "c1", quant: 0, symbol: "C" }],
  parts: [
    {
      id: "p1",
      name: "Piano",
      clef: "treble",
      measures: [
        {
          id: "m0",
          notes: [{ id: "n1", pitch: "C4", duration: "q" }],
          timeSignature: "4/4",
        },
      ],
    },
    {
      id: "p2",
      name: "Bass",
      clef: "bass",
      measures: [
        {
          id: "m0",
          notes: [{ id: "n2", pitch: "E3", duration: "q" }],
          timeSignature: "4/4",
        },
      ],
    },
  ],
};

describe("scoreToExportMusicXML", () => {
  beforeEach(() => {
    useScoreDisplayStore.setState({ showNoteNameLabels: false, showChordSymbols: true });
  });

  it("emits partwise MusicXML", () => {
    const xml = scoreToExportMusicXML(tinyScore, "demo.xml");
    expect(xml).toContain("score-partwise");
    expect(xml).toContain("<part-list>");
    expect(xml).toContain("<identification>");
    expect(xml).toContain("<software>HarmonyForge</software>");
  });

  it("keeps harmony in branded XML for preview toggling", () => {
    useScoreDisplayStore.setState({ showChordSymbols: false });
    const xml = scoreToBrandedExportMusicXML(scoreWithChord, "demo.xml");
    expect(xml).toContain("<harmony");
  });

  it("omits harmony in export XML when chord symbols are toggled off", () => {
    useScoreDisplayStore.setState({ showChordSymbols: false });
    const xml = scoreToExportMusicXML(scoreWithChord, "demo.xml");
    expect(xml).not.toContain("<harmony");
  });
});
