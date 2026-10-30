import { describe, expect, it } from "vitest";

import {
  resolveMelodyXmlForGeneration,
  soundingMelodyFingerprint,
} from "./resolveMelodyXmlForGeneration";
import type { EditableScore } from "./scoreTypes";

const liveScore: EditableScore = {
  divisions: 1,
  bpm: 96,
  parts: [
    {
      id: "P1",
      name: "Melody",
      clef: "treble",
      measures: [
        {
          id: "m1",
          timeSignature: "4/4",
          keySignature: 0,
          notes: [{ id: "n1", pitch: "G4", duration: "q" }],
        },
      ],
    },
  ],
};

const originalScore: EditableScore = {
  ...liveScore,
  parts: [
    {
      ...liveScore.parts[0]!,
      measures: [
        {
          id: "m1",
          timeSignature: "4/4",
          keySignature: 0,
          notes: [{ id: "n1", pitch: "C4", duration: "q" }],
        },
      ],
    },
  ],
};

describe("resolveMelodyXmlForGeneration", () => {
  it("prefers live editor score when sounding notes differ from the baseline", () => {
    const xml = resolveMelodyXmlForGeneration({
      liveScore,
      baselineScore: originalScore,
      previewXml: "<score-partwise><part-list></part-list></score-partwise>",
      title: "Edited",
    });
    expect(xml).toContain("G");
    expect(xml).toContain("score-partwise");
    expect(xml).not.toBe("<score-partwise><part-list></part-list></score-partwise>");
  });

  it("keeps original preview XML when live score matches the baseline", () => {
    const preview = "<score-partwise version='3.1'><part-list></part-list></score-partwise>";
    expect(
      resolveMelodyXmlForGeneration({
        liveScore: originalScore,
        baselineScore: originalScore,
        previewXml: preview,
      }),
    ).toBe(preview);
  });

  it("ignores rest-only differences so RiffScore padding does not replace OMR XML", () => {
    const preview = "<score-partwise version='3.1'><part-list></part-list></score-partwise>";
    const withFillerRest: EditableScore = {
      ...originalScore,
      parts: [
        {
          ...originalScore.parts[0]!,
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              keySignature: 0,
              notes: [
                { id: "n1", pitch: "C4", duration: "q" },
                { id: "n2", pitch: "B4", duration: "h", isRest: true },
              ],
            },
          ],
        },
      ],
    };
    expect(soundingMelodyFingerprint(withFillerRest)).toBe(soundingMelodyFingerprint(originalScore));
    expect(
      resolveMelodyXmlForGeneration({
        liveScore: withFillerRest,
        baselineScore: originalScore,
        previewXml: preview,
      }),
    ).toBe(preview);
  });

  it("uses live XML when there is no baseline score", () => {
    const xml = resolveMelodyXmlForGeneration({
      liveScore,
      previewXml: "<score-partwise><part-list></part-list></score-partwise>",
      title: "Live",
    });
    expect(xml).toContain("G");
    expect(xml).toContain("score-partwise");
  });

  it("falls back to preview XML when there is no live score", () => {
    const preview = "<score-partwise version='3.1'><part-list></part-list></score-partwise>";
    expect(
      resolveMelodyXmlForGeneration({
        liveScore: null,
        previewXml: preview,
      }),
    ).toBe(preview);
  });

  it("returns null when neither source has content", () => {
    expect(resolveMelodyXmlForGeneration({ liveScore: null, previewXml: "  " })).toBeNull();
  });

  it("exports only part 0 when a multi-staff live score was edited (PDF OMR)", () => {
    const baseline: EditableScore = {
      divisions: 1,
      parts: [
        {
          id: "P1",
          name: "Violin",
          clef: "treble",
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              keySignature: 0,
              notes: [{ id: "n1", pitch: "C5", duration: "q" }],
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
              keySignature: 0,
              notes: [{ id: "n2", pitch: "C3", duration: "q" }],
            },
          ],
        },
      ],
    };
    const live: EditableScore = {
      ...baseline,
      parts: [
        {
          ...baseline.parts[0]!,
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              keySignature: 0,
              notes: [{ id: "n1", pitch: "E5", duration: "q" }],
            },
          ],
        },
        baseline.parts[1]!,
      ],
    };
    const xml = resolveMelodyXmlForGeneration({
      liveScore: live,
      baselineScore: baseline,
      previewXml: "<score-partwise><part-list></part-list></score-partwise>",
      title: "OMR Edit",
    });
    expect(xml).toContain("E");
    expect(xml).toContain("Violin");
    expect(xml).not.toContain("Cello");
    expect(xml).not.toContain(">C3<");
  });
});
