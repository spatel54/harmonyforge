/**
 * Integration tests for file pipeline: ensureChords → generateSATB → satbToMusicXML
 */

import { ensureChords } from "./chordInference";
import { parseChord } from "./chordParser";
import { parseConfig } from "./runtime";
import { generateSATB } from "./solver";
import { satbToMusicXML } from "./satbToMusicXML";
import type { ParsedScore } from "./types";

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
    expect(xml.toLowerCase()).not.toContain("<dynamics");
    expect(xml.toLowerCase()).not.toContain("<articulations");
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

  it("satbToMusicXML emits treble-octave-down clef (G/2/-1) for Tenor voice (no accidental mezzo)", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [{ pitch: "C5", beat: 0 }],
      melodyPartName: "Melody",
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
      { Tenor: ["Tenor Voice"] } as Record<string, string[]>,
      withChords,
      { format: "partwise", additiveHarmonies: true },
    );
    const partBodies = [...xml.matchAll(/<part id="P\d+">([\s\S]*?)<\/part>/g)].map((m) => m[1]);
    // The tenor-voice harmony part must emit tenor treble clef (G, line 2, octave-change -1),
    // never an unqualified mezzo C-clef.
    const tenorBody = partBodies[1];
    expect(tenorBody).toMatch(/<sign>G<\/sign>\s*\n\s*<line>2<\/line>\s*\n\s*<clef-octave-change>-1<\/clef-octave-change>/);
    // Guard against the mezzo-soprano clef regression (C on line 2).
    expect(tenorBody).not.toMatch(/<sign>C<\/sign>\s*\n\s*<line>2<\/line>/);
  });

  it("satbToMusicXML emits tenor-treble clef for default Tenor voice (no instrument override)", () => {
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
    const xml = satbToMusicXML(result!, undefined, withChords, { format: "partwise" });
    const partBodies = [...xml.matchAll(/<part id="P\d+">([\s\S]*?)<\/part>/g)].map((m) => m[1]);
    // Default SATB has four parts (S, A, T, B). The tenor part (index 2) must be tenor treble clef.
    const tenorBody = partBodies[2];
    expect(tenorBody).toMatch(/<clef-octave-change>-1<\/clef-octave-change>/);
  });

  it("rhythmDensity='chordal' keeps slot-long harmony events (whole-slot spans)", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [
        { pitch: "C5", beat: 0, duration: 0.5 },
        { pitch: "D5", beat: 0.5, duration: 0.5 },
        { pitch: "E5", beat: 1, duration: 1 },
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
    const xml = satbToMusicXML(result!, undefined, withChords, {
      format: "partwise",
      rhythmDensity: "chordal",
    });
    // Chordal: expect long-duration harmony notes (quarter or larger). No eighth rests triggered by density.
    const altoPart = xml.match(/<part id="P2">[\s\S]*?<\/part>/)?.[0] ?? "";
    expect(altoPart.match(/<type>eighth<\/type>/g)?.length ?? 0).toBe(0);
  });

  it("rhythmDensity='mixed' (default) re-attacks harmony on melody onsets", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [
        { pitch: "C5", beat: 0, duration: 0.5 },
        { pitch: "D5", beat: 0.5, duration: 0.5 },
        { pitch: "E5", beat: 1, duration: 1 },
        { pitch: "F5", beat: 2, duration: 2 },
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
    const xmlDefault = satbToMusicXML(result!, undefined, withChords, {
      format: "partwise",
    });
    // Mixed: harmony should show eighth notes matching the melody's first beat.
    expect(xmlDefault).toContain("<type>eighth</type>");
  });

  it("rhythmDensity='flowing' produces more harmony events than 'chordal'", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [
        { pitch: "C5", beat: 0, duration: 0.5 },
        { pitch: "D5", beat: 0.5, duration: 0.5 },
        { pitch: "E5", beat: 1, duration: 3 },
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
    const countNotes = (xml: string, partId: string): number => {
      const body = xml.match(new RegExp(`<part id="${partId}">[\\s\\S]*?</part>`))?.[0] ?? "";
      return (body.match(/<pitch>/g) ?? []).length;
    };
    const chordalXml = satbToMusicXML(result!, undefined, withChords, {
      format: "partwise",
      rhythmDensity: "chordal",
    });
    const flowingXml = satbToMusicXML(result!, undefined, withChords, {
      format: "partwise",
      rhythmDensity: "flowing",
    });
    expect(countNotes(flowingXml, "P2")).toBeGreaterThan(countNotes(chordalXml, "P2"));
  });

  it("bassRhythmMode='pedal' yields fewer bass attacks than inner voices with rhythmDensity='mixed'", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [
        { pitch: "C5", beat: 0, duration: 0.5 },
        { pitch: "D5", beat: 0.5, duration: 0.5 },
        { pitch: "E5", beat: 1, duration: 1 },
        { pitch: "F5", beat: 2, duration: 2 },
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
    const countPitches = (xml: string, partId: string): number => {
      const body = xml.match(new RegExp(`<part id="${partId}">[\\s\\S]*?</part>`))?.[0] ?? "";
      return (body.match(/<pitch>/g) ?? []).length;
    };
    const pedalXml = satbToMusicXML(result!, undefined, withChords, {
      format: "partwise",
      rhythmDensity: "mixed",
      bassRhythmMode: "pedal",
    });
    const followXml = satbToMusicXML(result!, undefined, withChords, {
      format: "partwise",
      rhythmDensity: "mixed",
      bassRhythmMode: "follow",
    });
    expect(countPitches(pedalXml, "P4")).toBeLessThan(countPitches(followXml, "P4"));
    expect(countPitches(pedalXml, "P2")).toBe(countPitches(followXml, "P2"));
  });

  it("anacrusis: ensureChords skips chord placement inside the pickup", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [
        { pitch: "G4", beat: 0, duration: 1 },
        { pitch: "C5", beat: 1, duration: 1 },
        { pitch: "E5", beat: 2, duration: 1 },
        { pitch: "G5", beat: 3, duration: 1 },
        { pitch: "C5", beat: 4, duration: 1 },
      ],
      timeSignature: { beats: 4, beatType: 4 },
      totalBeats: 5,
      totalMeasures: 2,
      pickupBeats: 1,
    };
    const withChords = ensureChords(parsed);
    expect(withChords.chords.length).toBeGreaterThan(0);
    // Every inferred chord must start on or after the pickup boundary (beat 1).
    for (const chord of withChords.chords) {
      expect(chord.beat).toBeGreaterThanOrEqual(1 - 1e-4);
    }
  });

  it("anacrusis: satbToMusicXML emits implicit measure 0 and shortened first bar", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [
        { pitch: "G4", beat: 0, duration: 1 },
        { pitch: "C5", beat: 1, duration: 1 },
        { pitch: "E5", beat: 2, duration: 1 },
        { pitch: "G5", beat: 3, duration: 1 },
      ],
      timeSignature: { beats: 4, beatType: 4 },
      totalBeats: 4,
      totalMeasures: 2,
      pickupBeats: 1,
      melodyPartName: "Melody",
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
      { Bass: ["Cello"] } as Record<string, string[]>,
      withChords,
      { format: "partwise", additiveHarmonies: true },
    );
    // Pickup measure 0 must be marked implicit.
    expect(xml).toMatch(/<measure number="0" implicit="yes">/);
    // And measure 1 must follow (the real downbeat).
    expect(xml).toMatch(/<measure number="1">/);
    // Cello harmony must NOT emit a pitch during pickup measure 0 — it should only rest there.
    const celloPart = xml.match(/<part id="P2">[\s\S]*?<\/part>/)?.[0] ?? "";
    const firstMeasureBody = celloPart.match(/<measure number="0"[^>]*>[\s\S]*?<\/measure>/)?.[0] ?? "";
    expect(firstMeasureBody).not.toMatch(/<pitch>/);
    expect(firstMeasureBody).toMatch(/<rest\s*\/>/);
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

describe("parseConfig", () => {
  it("accepts pickupBeats between 0 and 3", () => {
    expect(parseConfig({ pickupBeats: 0 })).toEqual({ pickupBeats: 0 });
    expect(parseConfig({ pickupBeats: 3 })).toEqual({ pickupBeats: 3 });
    expect(parseConfig({ pickupBeats: 2.4 })).toEqual({ pickupBeats: 2 });
  });

  it("ignores out-of-range pickupBeats", () => {
    expect(parseConfig({ pickupBeats: 4 })).toBeNull();
    expect(parseConfig({ pickupBeats: -1 })).toBeNull();
  });

  it("keeps other fields when pickupBeats is invalid", () => {
    expect(parseConfig({ mood: "minor", pickupBeats: 9 })).toEqual({ mood: "minor" });
  });
});
