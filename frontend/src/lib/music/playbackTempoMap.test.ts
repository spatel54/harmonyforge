import { describe, expect, it } from "vitest";
import type { EditableScore } from "./scoreTypes";
import {
  beatsToSeconds,
  bpmAtBeat,
  buildLiveTempoMap,
  buildTempoMap,
  midiVelocityToSamplerGain,
  parseTempoBpmFromText,
  remapPlaybackTimeline,
  secondsToBeat,
} from "./playbackTempoMap";

function twoBarScore(): EditableScore {
  return {
    divisions: 4,
    parts: [
      {
        id: "p1",
        name: "Melody",
        clef: "treble",
        measures: [
          {
            id: "m1",
            timeSignature: "4/4",
            tempoText: "Adagio ♩ = 66",
            tempoBpm: 66,
            notes: [{ id: "n1", pitch: "C4", duration: "w" }],
          },
          {
            id: "m2",
            timeSignature: "4/4",
            tempoText: "Allegro ♩ = 132",
            tempoBpm: 132,
            notes: [{ id: "n2", pitch: "E4", duration: "w" }],
          },
        ],
      },
    ],
  };
}

describe("playbackTempoMap", () => {
  it("parses palette tempo text", () => {
    expect(parseTempoBpmFromText("Adagio ♩ = 66")).toBe(66);
    expect(parseTempoBpmFromText("Andante")).toBe(76);
  });

  it("builds a map that keeps Adagio then Allegro", () => {
    const map = buildTempoMap(twoBarScore());
    expect(map).toEqual([
      { startBeat: 0, bpm: 66 },
      { startBeat: 4, bpm: 132 },
    ]);
    expect(bpmAtBeat(0, map)).toBe(66);
    expect(bpmAtBeat(3.9, map)).toBe(66);
    expect(bpmAtBeat(4, map)).toBe(132);
  });

  it("converts beats to seconds piecewise", () => {
    const map = buildTempoMap(twoBarScore());
    const bar1 = beatsToSeconds(4, map);
    expect(bar1).toBeCloseTo((4 * 60) / 66, 5);
    const bar2 = beatsToSeconds(8, map);
    expect(bar2).toBeCloseTo(bar1 + (4 * 60) / 132, 5);
    expect(secondsToBeat(bar1, map)).toBeCloseTo(4, 5);
  });

  it("stretches a constant-BPM RiffScore timeline", () => {
    const map = buildTempoMap(twoBarScore());
    const assumed = 66;
    const quarter = 60 / assumed;
    const remapped = remapPlaybackTimeline(
      [
        { time: 0, duration: quarter * 4 },
        { time: quarter * 4, duration: quarter * 4 },
      ],
      assumed,
      0,
      map,
    );
    expect(remapped.timeline[0]!.duration).toBeCloseTo((4 * 60) / 66, 5);
    expect(remapped.timeline[1]!.time).toBeCloseTo((4 * 60) / 66, 5);
    expect(remapped.timeline[1]!.duration).toBeCloseTo((4 * 60) / 132, 5);
  });

  it("uses live toolbar BPM as the unmarked start", () => {
    const score: EditableScore = {
      divisions: 4,
      parts: [
        {
          id: "p1",
          name: "Melody",
          clef: "treble",
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              notes: [{ id: "n1", pitch: "C4", duration: "w" }],
            },
            {
              id: "m2",
              timeSignature: "4/4",
              tempoText: "Allegro ♩ = 132",
              tempoBpm: 132,
              notes: [{ id: "n2", pitch: "E4", duration: "w" }],
            },
          ],
        },
      ],
    };
    const map = buildLiveTempoMap(score, 80);
    expect(map).toEqual([
      { startBeat: 0, bpm: 80 },
      { startBeat: 4, bpm: 132 },
    ]);
    const assumed = 80;
    const quarter = 60 / assumed;
    const remapped = remapPlaybackTimeline(
      [
        { time: 0, duration: quarter * 4 },
        { time: quarter * 4, duration: quarter * 4 },
      ],
      assumed,
      0,
      map,
    );
    expect(remapped.timeline[0]!.duration).toBeCloseTo((4 * 60) / 80, 5);
    expect(remapped.timeline[1]!.time).toBeCloseTo((4 * 60) / 80, 5);
    expect(remapped.timeline[1]!.duration).toBeCloseTo((4 * 60) / 132, 5);
  });

  it("makes forte clearly louder than piano on the sampler gain curve", () => {
    const p = midiVelocityToSamplerGain(44);
    const f = midiVelocityToSamplerGain(92);
    expect(f / p).toBeGreaterThan(1.6);
  });
});
