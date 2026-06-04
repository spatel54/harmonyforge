import { describe, expect, it } from "vitest";
import {
  collectLetterLabelPitchesFromPartwiseXml,
  collectLetterLabelPitchesFromScore,
  collectLetterLabelPitchesMeasureMajor,
  collectLetterLabelPitchesMeasureMajorFromXml,
  learnerLabelYFromNoteheadTop,
  resolveNoteheadElement,
} from "./osmdLearnerLabels";
import { scoreToPartwiseMusicXML } from "./scoreToMusicXML";
import type { EditableScore } from "./scoreTypes";

const score: EditableScore = {
  parts: [
    {
      id: "p1",
      name: "A",
      clef: "treble",
      measures: [
        {
          id: "m1",
          notes: [
            { id: "n1", pitch: "C4", duration: "q" },
            { id: "n2", pitch: "F#4", duration: "q", isRest: false },
            { id: "r1", duration: "q", isRest: true },
          ],
        },
        {
          id: "m2",
          notes: [{ id: "n1b", pitch: "D4", duration: "q" }],
        },
      ],
    },
    {
      id: "p2",
      name: "B",
      clef: "bass",
      measures: [
        {
          id: "m2",
          notes: [{ id: "n3", pitch: "Bb3", duration: "h" }],
        },
      ],
    },
  ],
};

describe("collectLetterLabelPitchesMeasureMajor", () => {
  it("walks measures before advancing to the next staff", () => {
    expect(collectLetterLabelPitchesMeasureMajor(score)).toEqual([
      "C4",
      "F#4",
      "Bb3",
      "D4",
    ]);
  });

  it("differs from part-major partwise order when measure lengths differ", () => {
    expect(collectLetterLabelPitchesMeasureMajor(score)).not.toEqual(
      collectLetterLabelPitchesFromScore(score),
    );
  });
});

describe("learnerLabelYFromNoteheadTop", () => {
  it("offsets hanging text above the notehead top", () => {
    expect(learnerLabelYFromNoteheadTop(50)).toBe(40);
  });
});

describe("resolveNoteheadElement", () => {
  it("prefers .vf-notehead inside the vexflow group", () => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const head = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    head.setAttribute("class", "vf-notehead");
    group.appendChild(head);
    const stem = document.createElementNS("http://www.w3.org/2000/svg", "line");
    stem.setAttribute("class", "vf-stem");
    group.appendChild(stem);

    const resolved = resolveNoteheadElement({
      getSVGGElement: () => group as SVGGElement,
    });
    expect(resolved).toBe(head);
  });
});

describe("collectLetterLabelPitchesFromPartwiseXml", () => {
  it("matches measure-major score order", () => {
    const xml = scoreToPartwiseMusicXML(score);
    const fromXml = collectLetterLabelPitchesMeasureMajorFromXml(xml);
    expect(fromXml).toEqual(collectLetterLabelPitchesMeasureMajor(score));
    expect(collectLetterLabelPitchesFromPartwiseXml(xml)).toEqual(fromXml);
  });
});
