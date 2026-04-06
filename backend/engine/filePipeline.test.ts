/**
 * Integration tests for file pipeline: ensureChords → generateSATB → satbToMusicXML
 */

import { ensureChords } from "./chordInference.js";
import { parseChord } from "./chordParser.js";
import { generateSATB } from "./solver.js";
import { satbToMusicXML } from "./satbToMusicXML.js";
import type { ParsedScore } from "./types.js";

describe("File pipeline", () => {
  it("ensureChords → generateSATB → satbToMusicXML produces valid MusicXML", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [
        { pitch: "C5", beat: 0 },
        { pitch: "E5", beat: 1 },
        { pitch: "G5", beat: 2 },
        { pitch: "C5", beat: 3 },
      ],
    };
    const withChords = ensureChords(parsed);
    expect(withChords.chords.length).toBeGreaterThan(0);
    const result = generateSATB({
      key: withChords.key,
      chords: withChords.chords,
      melody: withChords.melody,
    });
    expect(result).not.toBeNull();
    const xml = satbToMusicXML(result!, undefined, withChords);
    expect(xml).toContain("<score-timewise");
    expect(xml).toContain("<part id=\"P1\">");
    expect(xml).toContain("<measure");
    expect(xml).toContain("<pitch>");
    expect(xml).toContain("<measure number=\"2\">");
  });

  it("ensureChords with mood=minor uses minor progressions", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [{ pitch: "C4", beat: 0 }, { pitch: "G4", beat: 4 }],
    };
    const withChords = ensureChords(parsed, "minor");
    expect(withChords.key.mode).toBe("minor");
    expect(withChords.chords.some((c) => c.roman === "i" || c.roman === "iv" || c.roman === "v")).toBe(true);
  });

  it("ensureChords with genre=jazz prefers 7th chords", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [{ pitch: "C5", beat: 0 }, { pitch: "D4", beat: 2 }, { pitch: "G4", beat: 4 }],
      timeSignature: { beats: 4, beatType: 4 },
      totalBeats: 8,
    };
    const withChords = ensureChords(parsed, "major", "jazz");
    expect(withChords.chords.some((c) => c.roman.includes("7"))).toBe(true);
  });

  it("ensureChords with genre=pop produces valid chords", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [{ pitch: "C5", beat: 0 }, { pitch: "A4", beat: 2 }, { pitch: "F4", beat: 4 }, { pitch: "G4", beat: 6 }],
      timeSignature: { beats: 4, beatType: 4 },
      totalBeats: 8,
    };
    const withChords = ensureChords(parsed, "major", "pop");
    expect(withChords.chords.length).toBeGreaterThan(0);
    expect(withChords.chords.every((c) => typeof c.roman === "string" && c.roman.length > 0)).toBe(true);
  });

  it("ensureChords chooses chords that contain the active melody pitch", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [
        { pitch: "C5", beat: 0, duration: 2 },
        { pitch: "A4", beat: 2, duration: 2 },
      ],
      timeSignature: { beats: 4, beatType: 4 },
      totalBeats: 4,
    };

    const withChords = ensureChords(parsed);
    expect(withChords.chords).toHaveLength(2);

    const firstChord = parseChord(withChords.chords[0].roman, withChords.key);
    const secondChord = parseChord(withChords.chords[1].roman, withChords.key);

    expect(firstChord.chordTones).toContain(0);
    expect(secondChord.chordTones).toContain(9);
  });

  it("satbToMusicXML uses custom instrument names", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [{ pitch: "C5", beat: 0 }],
    };
    const withChords = ensureChords(parsed);
    const result = generateSATB({
      key: withChords.key,
      chords: withChords.chords,
      melody: withChords.melody,
    });
    expect(result).not.toBeNull();
    const instruments = {
      Soprano: ["Flute"],
      Alto: ["Clarinet"],
      Tenor: ["Trumpet"],
      Bass: ["Bassoon"],
    };
    const xml = satbToMusicXML(result!, instruments, withChords);
    expect(xml).toContain("<part-name>Flute</part-name>");
    expect(xml).toContain("<part-name>Clarinet</part-name>");
  });

  it("satbToMusicXML partwise format produces MuseScore-compatible output", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [{ pitch: "C5", beat: 0 }],
    };
    const withChords = ensureChords(parsed);
    const result = generateSATB({
      key: withChords.key,
      chords: withChords.chords,
      melody: withChords.melody,
    });
    expect(result).not.toBeNull();
    const xml = satbToMusicXML(result!, undefined, withChords, {
      format: "partwise",
      version: "2.0",
    });
    expect(xml).toContain("<score-partwise");
    expect(xml).toContain('version="2.0"');
    expect(xml).toContain("<part id=\"P1\">");
    expect(xml).toContain("<measure number=\"1\">");
    expect(xml).toContain("<mode>major</mode>");
  });

  it("satbToMusicXML additiveHarmonies outputs melody first then harmony parts", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [{ pitch: "C5", beat: 0 }],
      melodyPartName: "Violin",
    };
    const withChords = ensureChords(parsed);
    const result = generateSATB({
      key: withChords.key,
      chords: withChords.chords,
      melody: withChords.melody,
    });
    expect(result).not.toBeNull();
    const xml = satbToMusicXML(result!, { Soprano: ["Flute"], Bass: ["Cello"] } as Record<string, string[]>, withChords, {
      format: "partwise",
      additiveHarmonies: true,
    });
    expect(xml).toContain("<part-name>Violin</part-name>");
    expect(xml).toContain("<part-name>Flute</part-name>");
    expect(xml).toContain("<part-name>Cello</part-name>");
    const violinIdx = xml.indexOf("<part-name>Violin</part-name>");
    const fluteIdx = xml.indexOf("<part-name>Flute</part-name>");
    const celloIdx = xml.indexOf("<part-name>Cello</part-name>");
    expect(violinIdx).toBeLessThan(fluteIdx);
    expect(fluteIdx).toBeLessThan(celloIdx);
  });

  it("satbToMusicXML emits alto/bass clefs for viola, cello, bassoon (not all treble)", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [{ pitch: "C5", beat: 0 }],
      melodyPartName: "Violin I",
    };
    const withChords = ensureChords(parsed);
    const result = generateSATB({
      key: withChords.key,
      chords: withChords.chords,
      melody: withChords.melody,
    });
    expect(result).not.toBeNull();
    const xml = satbToMusicXML(
      result!,
      { Alto: ["Viola"], Tenor: ["Cello"], Bass: ["Bassoon"] } as Record<string, string[]>,
      withChords,
      { format: "partwise", additiveHarmonies: true },
    );
    const partBodies = [...xml.matchAll(/<part id="P\d+">([\s\S]*?)<\/part>/g)].map((m) => m[1]);
    expect(partBodies.length).toBe(4);
    expect(partBodies[0]).toMatch(/<sign>G<\/sign>\s*\n\s*<line>2<\/line>/);
    expect(partBodies[1]).toMatch(/<sign>C<\/sign>\s*\n\s*<line>3<\/line>/);
    expect(partBodies[2]).toMatch(/<sign>F<\/sign>\s*\n\s*<line>4<\/line>/);
    expect(partBodies[3]).toMatch(/<sign>F<\/sign>\s*\n\s*<line>4<\/line>/);
  });

  it("satbToMusicXML gives unique parts when multiple instruments share voice range (Flute+Violin soprano)", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [{ pitch: "G4", beat: 0 }, { pitch: "A4", beat: 1 }],
      melodyPartName: "Melody",
      timeSignature: { beats: 4, beatType: 4 },
      totalBeats: 4,
      totalMeasures: 1,
    };
    const withChords = ensureChords(parsed);
    const result = generateSATB({
      key: withChords.key,
      chords: withChords.chords,
      melody: withChords.melody,
    });
    expect(result).not.toBeNull();
    const xml = satbToMusicXML(result!, {
      Soprano: ["Flute", "Violin"],
      Bass: ["Cello"],
    } as Record<string, string[]>, withChords, {
      format: "partwise",
      additiveHarmonies: true,
    });
    expect(xml).toContain("<part-name>Flute</part-name>");
    expect(xml).toContain("<part-name>Violin</part-name>");
    const extractPitches = (partXml: string): string[] => {
      const steps = [...partXml.matchAll(/<step>([A-G])<\/step>\s*(?:<alter>-?\d+<\/alter>)?\s*<octave>(\d+)<\/octave>/g)];
      return steps.map((m) => `${m[1]}${m[2]}`);
    };
    const flutePart = xml.match(/<part id="P2">[\s\S]*?<\/part>/)?.[0] ?? "";
    const violinPart = xml.match(/<part id="P3">[\s\S]*?<\/part>/)?.[0] ?? "";
    const flutePitches = extractPitches(flutePart);
    const violinPitches = extractPitches(violinPart);
    expect(flutePitches.length).toBeGreaterThan(0);
    expect(violinPitches.length).toBeGreaterThan(0);
    expect(flutePitches.join(",")).not.toBe(violinPitches.join(","));
  });

  it("satbToMusicXML preserves dotted melody durations when source timing is provided", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [
        { pitch: "C5", beat: 0, duration: 1.5 },
        { pitch: "E5", beat: 1.5, duration: 0.5 },
      ],
      timeSignature: { beats: 4, beatType: 4 },
      totalBeats: 4,
      totalMeasures: 1,
    };
    const withChords = ensureChords(parsed);
    const result = generateSATB({
      key: withChords.key,
      chords: withChords.chords,
      melody: withChords.melody,
    });

    expect(result).not.toBeNull();
    const xml = satbToMusicXML(result!, undefined, withChords);
    expect(xml).toContain("<dot/>");
    expect(xml).toContain("<type>quarter</type>");
    expect(xml).toContain("<type>eighth</type>");
  });
});
