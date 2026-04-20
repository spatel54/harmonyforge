import { describe, expect, it } from "vitest";
import { resolveInstrumentTranspose, satbToMusicXML } from "./satbToMusicXML";
import type { SolverResult } from "./solver";
import type { ParsedScore } from "./types";

describe("resolveInstrumentTranspose", () => {
  it("detects Bb clarinet by common names", () => {
    expect(resolveInstrumentTranspose("Bb Clarinet")).toEqual({ diatonic: -1, chromatic: -2 });
    expect(resolveInstrumentTranspose("Clarinet in B-flat")).toEqual({ diatonic: -1, chromatic: -2 });
    expect(resolveInstrumentTranspose("Clarinet")).toEqual({ diatonic: -1, chromatic: -2 });
  });

  it("detects F horn and Eb alto sax", () => {
    expect(resolveInstrumentTranspose("French Horn")).toEqual({ diatonic: -4, chromatic: -7 });
    expect(resolveInstrumentTranspose("Alto Saxophone")).toEqual({ diatonic: -5, chromatic: -9 });
  });

  it("returns null for concert-pitch instruments", () => {
    expect(resolveInstrumentTranspose("Flute")).toBeNull();
    expect(resolveInstrumentTranspose("Cello")).toBeNull();
    expect(resolveInstrumentTranspose("Violin")).toBeNull();
  });
});

describe("satbToMusicXML transposition", () => {
  const source: ParsedScore = {
    key: { tonic: "C", mode: "major" },
    melody: [{ pitch: "C5", beat: 0, duration: 4, measure: 0 }],
    chords: [{ roman: "I", beat: 0 }],
    timeSignature: { beats: 4, beatType: 4 },
    totalBeats: 4,
  };
  const result: SolverResult = {
    slots: [
      {
        chord: source.chords![0],
        voices: { soprano: "C5", alto: "E4", tenor: "G3", bass: "C3" },
      },
    ],
  };

  it("emits <transpose> for Bb clarinet part", () => {
    const xml = satbToMusicXML(
      result,
      { Soprano: ["Flute"], Alto: ["Clarinet"], Tenor: [], Bass: [] },
      source,
      { format: "partwise", additiveHarmonies: true, version: "2.0" },
    );
    expect(xml).toContain("<transpose>");
    expect(xml).toContain("<diatonic>-1</diatonic>");
    expect(xml).toContain("<chromatic>-2</chromatic>");
  });

  it("does not emit <transpose> for concert-pitch flute/cello", () => {
    const xml = satbToMusicXML(
      result,
      { Soprano: ["Flute"], Alto: [], Tenor: [], Bass: ["Cello"] },
      source,
      { format: "partwise", additiveHarmonies: true, version: "2.0" },
    );
    expect(xml).not.toContain("<transpose>");
  });
});
