import { describe, expect, it } from "vitest";
import type { EditableScore } from "./scoreTypes";
import { realizeSoundingTimeline } from "./realizeSoundingTimeline";

function miniScore(notes: EditableScore["parts"][0]["measures"][0]["notes"]): EditableScore {
  return {
    divisions: 4,
    parts: [
      {
        id: "p1",
        name: "Melody",
        clef: "treble",
        measures: [{ id: "m1", timeSignature: "4/4", notes }],
      },
    ],
  };
}

describe("realizeSoundingTimeline", () => {
  it("applies dynamic velocity carry-forward", () => {
    const score = miniScore([
      { id: "n1", pitch: "C4", duration: "q", dynamics: "p" },
      { id: "n2", pitch: "D4", duration: "q" },
    ]);
    const events = realizeSoundingTimeline(score);
    expect(events[0]?.velocity).toBe(44);
    expect(events[1]?.velocity).toBe(44);
  });

  it("shortens staccato notes", () => {
    const score = miniScore([
      { id: "n1", pitch: "C4", duration: "q", articulations: ["a."] },
    ]);
    const events = realizeSoundingTimeline(score);
    expect(events[0]?.durationBeats).toBeCloseTo(0.5, 5);
  });

  it("expands D.C. al Fine", () => {
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
              notes: [{ id: "n1", pitch: "C4", duration: "q" }],
            },
            {
              id: "m2",
              timeSignature: "4/4",
              repeatMark: "dc",
              notes: [{ id: "n2", pitch: "D4", duration: "q" }],
            },
            {
              id: "m3",
              timeSignature: "4/4",
              repeatMark: "fine",
              notes: [{ id: "n3", pitch: "E4", duration: "q" }],
            },
          ],
        },
      ],
    };
    const events = realizeSoundingTimeline(score);
    const pitches = events.map((e) => e.pitch);
    expect(pitches).toEqual(["C4", "D4", "C4", "D4", "E4"]);
  });

  it("interpolates crescendo hairpin velocity", () => {
    const score = miniScore([
      { id: "n1", pitch: "C4", duration: "q", dynamics: "p", lineStart: "cresc-hairpin" },
      { id: "n2", pitch: "D4", duration: "q" },
      { id: "n3", pitch: "E4", duration: "q" },
      { id: "n4", pitch: "F4", duration: "q", dynamics: "f", lineEnd: "cresc-hairpin" },
    ]);
    const events = realizeSoundingTimeline(score);
    expect(events[0]?.velocity).toBe(44);
    expect(events[3]?.velocity).toBe(92);
    expect(events[1]!.velocity).toBeGreaterThan(events[0]!.velocity);
    expect(events[2]!.velocity).toBeGreaterThan(events[1]!.velocity);
  });

  it("shifts 8va notes up an octave for playback", () => {
    const score = miniScore([
      { id: "n1", pitch: "C4", duration: "q", lineStart: "8va" },
      { id: "n2", pitch: "D4", duration: "q", lineEnd: "8va" },
    ]);
    const events = realizeSoundingTimeline(score);
    expect(events.map((e) => e.pitch)).toEqual(["C5", "D5"]);
  });

  it("merges tied same-pitch notes into one attack", () => {
    const score = miniScore([
      { id: "n1", pitch: "C4", duration: "q", tie: "start" },
      { id: "n2", pitch: "C4", duration: "q", tie: "stop" },
    ]);
    const events = realizeSoundingTimeline(score);
    expect(events).toHaveLength(1);
    expect(events[0]?.durationBeats).toBeCloseTo(2, 5);
  });

  it("repeats the marked section once, then continues", () => {
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
              notes: [{ id: "n1", pitch: "C4", duration: "q" }],
            },
            {
              id: "m2",
              timeSignature: "4/4",
              barline: "start-repeat",
              notes: [{ id: "n2", pitch: "D4", duration: "q" }],
            },
            {
              id: "m3",
              timeSignature: "4/4",
              barline: "end-repeat",
              notes: [{ id: "n3", pitch: "E4", duration: "q" }],
            },
            {
              id: "m4",
              timeSignature: "4/4",
              notes: [{ id: "n4", pitch: "F4", duration: "q" }],
            },
          ],
        },
      ],
    };
    const events = realizeSoundingTimeline(score);
    expect(events.map((e) => e.pitch)).toEqual(["C4", "D4", "E4", "D4", "E4", "F4"]);
  });

  it("lengthens slurred notes for legato overlap", () => {
    const score = miniScore([
      { id: "n1", pitch: "C4", duration: "q", lineStart: "slur" },
      { id: "n2", pitch: "D4", duration: "q", lineEnd: "slur" },
    ]);
    const events = realizeSoundingTimeline(score);
    expect(events[0]?.durationBeats).toBeCloseTo(1.08, 5);
    expect(events[1]?.durationBeats).toBeCloseTo(1.08, 5);
  });

  it("holds a fermata longer and delays the next attack", () => {
    const score = miniScore([
      { id: "n1", pitch: "C4", duration: "q", articulations: ["fermata"] },
      { id: "n2", pitch: "D4", duration: "q" },
    ]);
    const events = realizeSoundingTimeline(score);
    expect(events[0]?.durationBeats).toBeCloseTo(2, 5);
    expect(events[1]?.startBeat).toBeCloseTo(1.5, 5);
  });

  it("inserts a breath gap before the next note", () => {
    const score = miniScore([
      { id: "n1", pitch: "C4", duration: "q", articulations: ["breath-mark"] },
      { id: "n2", pitch: "D4", duration: "q" },
    ]);
    const events = realizeSoundingTimeline(score);
    expect(events[1]?.startBeat).toBeCloseTo(1.25, 5);
  });

  it("plays fp loud then immediately soft, then stays piano", () => {
    const score = miniScore([
      { id: "n1", pitch: "C4", duration: "q", dynamics: "fp" },
      { id: "n2", pitch: "D4", duration: "q" },
    ]);
    const events = realizeSoundingTimeline(score);
    expect(events).toHaveLength(3);
    expect(events[0]?.velocity).toBe(100);
    expect(events[1]?.velocity).toBe(44);
    expect(events[2]?.pitch).toBe("D4");
    expect(events[2]?.velocity).toBe(44);
  });

  it("treats sfz as a one-note accent without changing later dynamics", () => {
    const score = miniScore([
      { id: "n1", pitch: "C4", duration: "q", dynamics: "sfz" },
      { id: "n2", pitch: "D4", duration: "q" },
    ]);
    const events = realizeSoundingTimeline(score);
    expect(events[0]?.velocity).toBe(118);
    expect(events[1]?.velocity).toBe(76);
  });
});
