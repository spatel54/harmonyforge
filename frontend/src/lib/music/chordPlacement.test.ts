import { describe, expect, it } from "vitest";
import {
  beatsWhereHarmonyChanges,
  collectSoundingNotes,
  condenseChordTrack,
  ensureChordsOnMeasureDownbeats,
  filterChordPlacementBeats,
  harmonicRhythmStepBeats,
  measureDownbeatBeats,
  pitchClassesSoundingAt,
  snapBeatsToHarmonicRhythm,
} from "./chordPlacement";
import { beatToRiffQuant } from "./chordSymbolFormat";

function pc(pitch: string): number | null {
  const m = pitch.match(/^([A-G])(#|b)?/);
  if (!m) return null;
  const map: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let v = map[m[1]!] ?? 0;
  if (m[2] === "#") v++;
  if (m[2] === "b") v--;
  return ((v % 12) + 12) % 12;
}

describe("chordPlacement", () => {
  it("emits a change only when the vertical pitch-class set changes", () => {
    const score = {
      divisions: 1,
      parts: [
        {
          id: "P1",
          name: "M",
          clef: "treble",
          measures: [
            {
              id: "m1",
              notes: [
                { id: "a", pitch: "C4", duration: "h" as const },
                { id: "b", pitch: "C4", duration: "h" as const },
              ],
              timeSignature: "4/4",
            },
          ],
        },
        {
          id: "P2",
          name: "H",
          clef: "bass",
          measures: [
            {
              id: "m1",
              notes: [
                { id: "c", pitch: "E3", duration: "h" as const },
                { id: "d", pitch: "B3", duration: "h" as const },
              ],
              timeSignature: "4/4",
            },
          ],
        },
        {
          id: "P3",
          name: "H2",
          clef: "bass",
          measures: [
            {
              id: "m1",
              notes: [{ id: "f", pitch: "G3", duration: "w" as const }],
              timeSignature: "4/4",
            },
          ],
        },
      ],
    };
    const { notes } = collectSoundingNotes(score, pc);
    const changes = beatsWhereHarmonyChanges(notes, score);
    expect(changes).toContain(0);
    expect(changes.length).toBeLessThan(6);
    const at2 = pitchClassesSoundingAt(notes, 2);
    expect(at2.size).toBeGreaterThanOrEqual(3);
  });

  it("harmonicRhythmStepBeats matches engine grid for 4/4 and 3/4", () => {
    expect(harmonicRhythmStepBeats("4/4")).toBe(2);
    expect(harmonicRhythmStepBeats("3/4")).toBe(1.5);
  });

  it("snapBeatsToHarmonicRhythm merges nearby changes onto the grid", () => {
    expect(snapBeatsToHarmonicRhythm([0, 2.1], 2)).toEqual([0, 2]);
  });

  it("measureDownbeatBeats uses time-signature length when notation is shorter than the bar", () => {
    const score = {
      divisions: 1,
      parts: [
        {
          id: "P1",
          name: "M",
          clef: "treble",
          measures: [
            {
              id: "m1",
              notes: [{ id: "r", isRest: true, duration: "h" as const, dots: 1 }],
              timeSignature: "4/4",
            },
            {
              id: "m2",
              notes: [{ id: "a", pitch: "C5", duration: "w" as const }],
              timeSignature: "4/4",
            },
          ],
        },
      ],
    };
    expect(measureDownbeatBeats(score)).toEqual([0, 4]);
  });

  it("measureDownbeatBeats lists the start of each measure", () => {
    const score = {
      divisions: 1,
      parts: [
        {
          id: "P1",
          name: "M",
          clef: "treble",
          measures: [
            { id: "m1", notes: [{ id: "a", pitch: "C4", duration: "w" as const }], timeSignature: "4/4" },
            { id: "m2", notes: [{ id: "b", pitch: "D4", duration: "w" as const }], timeSignature: "4/4" },
          ],
        },
      ],
    };
    expect(measureDownbeatBeats(score)).toEqual([0, 4]);
  });

  it("ensureChordsOnMeasureDownbeats adds a symbol on every barline", () => {
    const score = {
      divisions: 1,
      parts: [
        {
          id: "P1",
          name: "M",
          clef: "treble",
          measures: [
            { id: "m1", notes: [{ id: "a", pitch: "C5", duration: "w" as const }], timeSignature: "4/4" },
            { id: "m2", notes: [{ id: "b", pitch: "D5", duration: "w" as const }], timeSignature: "4/4" },
          ],
        },
        {
          id: "P2",
          name: "H",
          clef: "bass",
          measures: [
            {
              id: "m1",
              notes: [{ id: "c", pitch: "E3", duration: "w" as const }],
              timeSignature: "4/4",
            },
            {
              id: "m2",
              notes: [{ id: "f", pitch: "F3", duration: "w" as const }],
              timeSignature: "4/4",
            },
          ],
        },
        {
          id: "P3",
          name: "H2",
          clef: "bass",
          measures: [
            { id: "m1", notes: [{ id: "i", pitch: "G3", duration: "w" as const }], timeSignature: "4/4" },
            { id: "m2", notes: [{ id: "j", pitch: "G3", duration: "w" as const }], timeSignature: "4/4" },
          ],
        },
      ],
    };
    const existing = [{ id: "c1", quant: beatToRiffQuant(2), symbol: "G7" }];
    const out = ensureChordsOnMeasureDownbeats(score, existing, () => "C", () => "new");
    const quants = out.map((c) => c.quant).sort((a, b) => a - b);
    expect(quants).toContain(0);
    expect(quants).toContain(beatToRiffQuant(4));
    expect(out.length).toBeGreaterThanOrEqual(3);
  });

  it("does not place mid-bar candidates on the last beat of the measure", () => {
    const score = {
      divisions: 1,
      parts: [
        {
          id: "P1",
          name: "M",
          clef: "treble",
          measures: [
            {
              id: "m1",
              notes: [
                { id: "a", pitch: "C5", duration: "q" as const },
                { id: "b", pitch: "E5", duration: "q" as const },
                { id: "c", pitch: "G5", duration: "q" as const },
                { id: "d", pitch: "B5", duration: "q" as const },
              ],
              timeSignature: "4/4",
            },
          ],
        },
        {
          id: "P2",
          name: "H",
          clef: "bass",
          measures: [
            {
              id: "m1",
              notes: [
                { id: "e", pitch: "C3", duration: "h" as const },
                { id: "f", pitch: "E3", duration: "h" as const },
                { id: "g", pitch: "G3", duration: "h" as const },
              ],
              timeSignature: "4/4",
            },
          ],
        },
        {
          id: "P3",
          name: "H2",
          clef: "bass",
          measures: [{ id: "m1", notes: [{ id: "h", pitch: "G3", duration: "w" as const }], timeSignature: "4/4" }],
        },
      ],
    };
    const { notes } = collectSoundingNotes(score, pc);
    const raw = beatsWhereHarmonyChanges(notes, score);
    const filtered = filterChordPlacementBeats(snapBeatsToHarmonicRhythm(raw, 2), score);
    expect(filtered).toContain(0);
    expect(filtered).not.toContain(3);
  });

  it("condenseChordTrack drops a repeat of the measure opening chord later in the bar", () => {
    const score = {
      divisions: 1,
      parts: [
        {
          id: "P1",
          name: "M",
          clef: "treble",
          measures: [{ id: "m1", notes: [{ id: "a", pitch: "C5", duration: "w" as const }], timeSignature: "4/4" }],
        },
        {
          id: "P2",
          name: "H1",
          clef: "bass",
          measures: [{ id: "m1", notes: [{ id: "b", pitch: "E3", duration: "w" as const }], timeSignature: "4/4" }],
        },
        {
          id: "P3",
          name: "H2",
          clef: "bass",
          measures: [{ id: "m1", notes: [{ id: "c", pitch: "G3", duration: "w" as const }], timeSignature: "4/4" }],
        },
      ],
    };
    const dense = [
      { id: "a", quant: 0, symbol: "Em" },
      { id: "b", quant: 16, symbol: "Em" },
      { id: "c", quant: 32, symbol: "G7" },
    ];
    const out = condenseChordTrack(score, dense);
    expect(out.map((c) => c.quant)).toEqual([0, 32]);
    expect(out.map((c) => c.symbol)).toEqual(["Em", "G7"]);
  });

  it("condenseChordTrack keeps beat-one symbol even when it matches the prior measure", () => {
    const score = {
      divisions: 1,
      parts: [
        {
          id: "P1",
          name: "M",
          clef: "treble",
          measures: [
            { id: "m1", notes: [{ id: "a", pitch: "C5", duration: "w" as const }], timeSignature: "4/4" },
            { id: "m2", notes: [{ id: "b", pitch: "C5", duration: "w" as const }], timeSignature: "4/4" },
          ],
        },
        {
          id: "P2",
          name: "H1",
          clef: "bass",
          measures: [
            { id: "m1", notes: [{ id: "c", pitch: "E3", duration: "w" as const }], timeSignature: "4/4" },
            { id: "m2", notes: [{ id: "d", pitch: "E3", duration: "w" as const }], timeSignature: "4/4" },
          ],
        },
        {
          id: "P3",
          name: "H2",
          clef: "bass",
          measures: [
            { id: "m1", notes: [{ id: "e", pitch: "G3", duration: "w" as const }], timeSignature: "4/4" },
            { id: "m2", notes: [{ id: "f", pitch: "G3", duration: "w" as const }], timeSignature: "4/4" },
          ],
        },
      ],
    };
    const dense = [
      { id: "a", quant: 0, symbol: "C" },
      { id: "b", quant: 64, symbol: "C" },
    ];
    const out = condenseChordTrack(score, dense);
    expect(out).toHaveLength(2);
  });

  it("condenseChordTrack keeps only beat one when mid-bar repeats the opening symbol", () => {
    const score = {
      divisions: 1,
      parts: [
        {
          id: "P1",
          name: "M",
          clef: "treble",
          measures: [
            { id: "m1", notes: [{ id: "a", pitch: "C5", duration: "w" as const }], timeSignature: "4/4" },
          ],
        },
      ],
    };
    const dense = [
      { id: "a", quant: 0, symbol: "C" },
      { id: "b", quant: 16, symbol: "C" },
      { id: "c", quant: 24, symbol: "C" },
    ];
    const out = condenseChordTrack(score, dense);
    expect(out).toEqual([{ id: "a", quant: 0, symbol: "C" }]);
  });
});
