import { describe, expect, it } from "vitest";
import type { EditableScore } from "@/lib/music/scoreTypes";
import {
  SANDBOX_EXPORT_FORMATS,
  isSandboxExportFormatId,
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

describe("scoreToExportMusicXML", () => {
  it("emits partwise MusicXML", () => {
    const xml = scoreToExportMusicXML(tinyScore, "demo.xml");
    expect(xml).toContain("score-partwise");
    expect(xml).toContain("<part-list>");
    expect(xml).toContain("<identification>");
    expect(xml).toContain("<software>HarmonyForge</software>");
  });
});
