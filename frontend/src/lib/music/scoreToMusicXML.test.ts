import { describe, expect, it } from "vitest";
import { scoreToMusicXML, scoreToPartwiseMusicXML } from "./scoreToMusicXML";
import type { EditableScore } from "./scoreTypes";

const withChord: EditableScore = {
  divisions: 1,
  chords: [{ id: "c1", quant: 0, symbol: "Am" }],
  parts: [
    {
      id: "P1",
      name: "P1",
      clef: "treble",
      measures: [
        {
          id: "m1",
          notes: [{ id: "n1", pitch: "A4", duration: "q" }],
          timeSignature: "4/4",
        },
      ],
    },
  ],
};

describe("scoreToMusicXML", () => {
  it("includes harmony for chords at measure start quant", () => {
    const xml = scoreToMusicXML(withChord);
    expect(xml).toContain("<harmony>");
    expect(xml).toContain("<root-step>A</root-step>");
  });
});

describe("scoreToPartwiseMusicXML", () => {
  it("emits score-partwise with part ids for OSMD print export", () => {
    const xml = scoreToPartwiseMusicXML(withChord, "My Piece");
    expect(xml).toContain("<score-partwise");
    expect(xml).toContain('id="P1"');
    expect(xml).toContain("<part-name>P1</part-name>");
    expect(xml).toContain("<step>A</step>");
  });

  it("emits a metronome mark from score.bpm on the first measure for OSMD print", () => {
    const xml = scoreToPartwiseMusicXML({ ...withChord, bpm: 120 });
    expect(xml).toContain("<metronome>");
    expect(xml).toContain("<per-minute>120</per-minute>");
    expect(xml).toContain('tempo="120"');
  });

  it("beams consecutive eighth notes by beat for traditional OSMD engraving", () => {
    const score: EditableScore = {
      parts: [
        {
          id: "P1",
          name: "Violin",
          clef: "treble",
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              notes: Array.from({ length: 8 }, (_, i) => ({
                id: `n${i}`,
                pitch: "C4",
                duration: "8",
              })),
            },
          ],
        },
      ],
    };
    const xml = scoreToPartwiseMusicXML(score);
    expect(xml).toContain('<beam number="1">begin</beam>');
    expect(xml).toContain('<beam number="1">end</beam>');
    expect(xml).not.toMatch(/<beam number="1">continue<\/beam>/);
    expect((xml.match(/<beam number="1">begin<\/beam>/g) ?? []).length).toBe(4);
  });

  it("emits a final (light-heavy) barline on the last measure of each part", () => {
    const score: EditableScore = {
      parts: [
        {
          id: "P1",
          name: "Violin",
          clef: "treble",
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              notes: [{ id: "n1", pitch: "C4", duration: "q" }],
            },
            {
              id: "m2",
              notes: [{ id: "n2", pitch: "D4", duration: "q" }],
            },
          ],
        },
        {
          id: "P2",
          name: "Cello",
          clef: "bass",
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              notes: [{ id: "n3", pitch: "C3", duration: "q" }],
            },
            {
              id: "m2",
              notes: [{ id: "n4", pitch: "D3", duration: "q" }],
            },
          ],
        },
      ],
    };
    const xml = scoreToPartwiseMusicXML(score);
    const finals = xml.match(/<bar-style>light-heavy<\/bar-style>/g) ?? [];
    expect(finals).toHaveLength(2);
    expect(xml).not.toContain("<bar-style>light-light</bar-style>");
  });

  it("preserves an explicit final barline when already set", () => {
    const score: EditableScore = {
      parts: [
        {
          id: "P1",
          name: "P1",
          clef: "treble",
          measures: [
            {
              id: "m1",
              notes: [{ id: "n1", pitch: "C4", duration: "q" }],
              barline: "final",
            },
          ],
        },
      ],
    };
    expect(scoreToPartwiseMusicXML(score)).toContain(
      "<bar-style>light-heavy</bar-style>",
    );
  });

  it("does not add a final barline on interior measures", () => {
    const score: EditableScore = {
      parts: [
        {
          id: "P1",
          name: "P1",
          clef: "treble",
          measures: [
            { id: "m1", notes: [{ id: "n1", pitch: "C4", duration: "q" }] },
            { id: "m2", notes: [{ id: "n2", pitch: "D4", duration: "q" }] },
            { id: "m3", notes: [{ id: "n3", pitch: "E4", duration: "q" }] },
          ],
        },
      ],
    };
    const xml = scoreToPartwiseMusicXML(score);
    expect(xml.match(/<bar-style>light-heavy<\/bar-style>/g)?.length).toBe(1);
  });

  it("beams sixteenth notes with continue tags inside a beat", () => {
    const score: EditableScore = {
      parts: [
        {
          id: "P1",
          name: "Violin",
          clef: "treble",
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              notes: Array.from({ length: 4 }, (_, i) => ({
                id: `n${i}`,
                pitch: "C4",
                duration: "16",
              })),
            },
          ],
        },
      ],
    };
    const xml = scoreToPartwiseMusicXML(score);
    expect(xml).toContain('<beam number="1">begin</beam>');
    expect(xml).toContain('<beam number="1">continue</beam>');
    expect(xml).toContain('<beam number="1">end</beam>');
    expect(xml).toContain('<beam number="2">begin</beam>');
  });

  it("emits staccato, hairpin wedges, and tuplet brackets for OSMD print", () => {
    const score: EditableScore = {
      parts: [
        {
          id: "P1",
          name: "Melody",
          clef: "treble",
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              notes: [
                {
                  id: "n1",
                  pitch: "C4",
                  duration: "8",
                  tuplet: 3,
                  articulations: ["a."],
                  lineStart: "cresc-hairpin",
                },
                { id: "n2", pitch: "D4", duration: "8", tuplet: 3 },
                {
                  id: "n3",
                  pitch: "E4",
                  duration: "8",
                  tuplet: 3,
                  lineEnd: "cresc-hairpin",
                },
                { id: "n4", pitch: "F4", duration: "q" },
                { id: "n5", pitch: "G4", duration: "q" },
                { id: "n6", pitch: "A4", duration: "q" },
              ],
            },
          ],
        },
      ],
    };
    const xml = scoreToPartwiseMusicXML(score);
    expect(xml).toContain("<staccato/>");
    expect(xml).toContain('<wedge type="crescendo" number="1"/>');
    expect(xml).toContain('<wedge type="stop" number="1"/>');
    expect(xml).toContain("<actual-notes>3</actual-notes>");
    expect(xml).toContain("<normal-notes>2</normal-notes>");
    expect(xml).toContain('<tuplet type="start" number="1" bracket="yes"/>');
    expect(xml).toContain('<tuplet type="stop" number="1"/>');
    // Triplet eighth sounding duration is 8 at DIVISIONS=24 (three fill one quarter).
    const tupletDurations = [...xml.matchAll(/<duration>(\d+)<\/duration>/g)].map((m) =>
      Number(m[1]),
    );
    expect(tupletDurations.slice(0, 3)).toEqual([8, 8, 8]);
    expect(tupletDurations.slice(0, 3).reduce((a, b) => a + b, 0)).toBe(24);
  });

  it("emits tempo words together with metronome and sound when both are set", () => {
    const score: EditableScore = {
      ...withChord,
      bpm: 76,
      parts: [
        {
          ...withChord.parts[0]!,
          measures: [
            {
              ...withChord.parts[0]!.measures[0]!,
              tempoText: "Andante ♩ = 76",
            },
          ],
        },
      ],
    };
    const xml = scoreToPartwiseMusicXML(score);
    expect(xml).toContain("Andante");
    expect(xml).toContain("<metronome>");
    expect(xml).toContain("<per-minute>76</per-minute>");
    expect(xml).toContain('tempo="76"');
  });
});
