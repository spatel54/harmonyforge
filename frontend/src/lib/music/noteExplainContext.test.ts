import { describe, expect, it } from "vitest";
import {
  buildAdditiveNoteContextLines,
  buildCrossPartIntervalFacts,
  buildProgressionWindowFacts,
  buildSatbNoteContextLines,
  buildScorePartRosterLines,
  formatAuthoritativeDurationFact,
  formatScoreDigestLine,
} from "@/lib/music/noteExplainContext";
import type { EditableScore } from "@/lib/music/scoreTypes";
import { scoreToAuditedSlots } from "@/lib/music/theoryInspectorSlots";

function m(id: string, notes: { id: string; pitch: string; duration: "q" }[]) {
  return { id: `m-${id}`, notes };
}

describe("buildScorePartRosterLines", () => {
  it("labels input vs generated for multi-part scores", () => {
    const score: EditableScore = {
      divisions: 1,
      parts: [
        { id: "p0", name: "Piano", clef: "treble", measures: [m("a", [])] },
        { id: "p1", name: "Violin", clef: "treble", measures: [m("b", [])] },
        { id: "p2", name: "Cello", clef: "bass", measures: [m("c", [])] },
      ],
    };
    const lines = buildScorePartRosterLines(score);
    expect(lines.some((l) => l.includes("Staff 1") && l.includes("Melody"))).toBe(
      true,
    );
    expect(lines.some((l) => l.includes("Violin") && l.includes("staff 2"))).toBe(
      true,
    );
    expect(lines.some((l) => l.includes("Cello"))).toBe(true);
  });
});

describe("buildCrossPartIntervalFacts", () => {
  it("emits one interval per other staff with a pitch", () => {
    const score: EditableScore = {
      divisions: 1,
      parts: [
        {
          id: "mel",
          name: "Melody",
          clef: "treble",
          measures: [
            {
              id: "m1",
              notes: [{ id: "n1", pitch: "C4", duration: "q" }],
            },
          ],
        },
        {
          id: "v1",
          name: "Flute",
          clef: "treble",
          measures: [
            {
              id: "m2",
              notes: [{ id: "n2", pitch: "E4", duration: "q" }],
            },
          ],
        },
        {
          id: "v2",
          name: "Bassoon",
          clef: "bass",
          measures: [
            {
              id: "m3",
              notes: [{ id: "n3", pitch: "G2", duration: "q" }],
            },
          ],
        },
      ],
    };
    const facts = buildCrossPartIntervalFacts(score, 0, 0, "v1", "E4");
    expect(facts.length).toBe(2);
    expect(facts.some((f) => f.includes("Melody") && f.includes("C4"))).toBe(true);
    expect(facts.some((f) => f.includes("Bassoon") && f.includes("G2"))).toBe(true);
  });
});

describe("formatScoreDigestLine", () => {
  it("includes duration fields in one line", () => {
    const s = formatScoreDigestLine({
      measureNumber1Based: 4,
      beatInBar: 0,
      note: { id: "n", pitch: "F4", duration: "h" },
      measureQuarterBeats: 4,
      timeSignature: "4/4",
    });
    expect(s.startsWith("SCORE_DIGEST:")).toBe(true);
    expect(s).toContain("F4");
    expect(s).toContain("half");
    expect(s).toContain("quarterNoteSpan=2");
  });
});

describe("formatAuthoritativeDurationFact", () => {
  it("states human duration and beat span loudly", () => {
    const line = formatAuthoritativeDurationFact(
      { id: "n1", pitch: "F4", duration: "h" },
      4,
      "4/4",
    );
    expect(line).toContain("AUTHORITATIVE NOTATION");
    expect(line).toContain("F4");
    expect(line).toContain("half note");
    expect(line).toContain("2");
    expect(line).toContain("4/4");
  });
});

describe("buildAdditiveNoteContextLines", () => {
  it("includes roster, generated labels, and cross-part intervals", () => {
    const score: EditableScore = {
      divisions: 1,
      parts: [
        {
          id: "mel",
          name: "Tune",
          clef: "treble",
          measures: [
            {
              id: "m1",
              notes: [
                { id: "a1", pitch: "C4", duration: "q" },
                { id: "a2", pitch: "D4", duration: "q" },
              ],
            },
          ],
        },
        {
          id: "h1",
          name: "Horn",
          clef: "treble",
          measures: [
            {
              id: "m2",
              notes: [
                { id: "b1", pitch: "G3", duration: "q" },
                { id: "b2", pitch: "A3", duration: "h" },
              ],
            },
          ],
        },
      ],
    };
    const lines = buildAdditiveNoteContextLines(score, 0, 1, "h1");
    expect(lines.some((l) => l.includes("NOTATION PROVIDED TO YOU"))).toBe(true);
    expect(lines.some((l) => l.startsWith("SCORE_DIGEST:"))).toBe(true);
    expect(lines.some((l) => l.includes("MEASURE FOCUS"))).toBe(true);
    expect(lines.some((l) => l.includes("Staff 1") && l.includes("Melody"))).toBe(
      true,
    );
    expect(lines.some((l) => l.includes("generated") && l.includes("Horn"))).toBe(true);
    expect(lines.filter((l) => l.startsWith("FACT: Interval from clicked")).length).toBeGreaterThanOrEqual(1);
    expect(lines.some((l) => l.includes("half note") && l.includes("A3"))).toBe(true);
    expect(lines.some((l) => l.includes("AUTHORITATIVE NOTATION") && l.includes("A3"))).toBe(
      true,
    );
  });
});

describe("buildProgressionWindowFacts", () => {
  it("labels PROGRESSION WINDOW and bass/soprano motion between moments", () => {
    const slots = [
      {
        voices: {
          soprano: "D4",
          alto: "F4",
          tenor: "A3",
          bass: "D3",
        },
      },
      {
        voices: {
          soprano: "C5",
          alto: "E4",
          tenor: "G3",
          bass: "C3",
        },
      },
      {
        voices: {
          soprano: "B4",
          alto: "D4",
          tenor: "F3",
          bass: "B2",
        },
      },
    ];
    const lines = buildProgressionWindowFacts(slots, 1);
    expect(lines.some((l) => l.includes("PROGRESSION WINDOW") && l.includes("view 0…2"))).toBe(
      true,
    );
    expect(lines.some((l) => l.includes("moments 0→1") && l.includes("PROGRESSION —"))).toBe(
      true,
    );
    expect(lines.some((l) => l.includes("moments 1→2"))).toBe(true);
    expect(lines.some((l) => l.includes("PROGRESSION —") && l.includes("bass"))).toBe(
      true,
    );
    expect(lines.some((l) => l.includes("PROGRESSION —") && l.includes("soprano"))).toBe(
      true,
    );
  });

  it("uses windowRadius to include neighbors within ±3 indices", () => {
    const slots = Array.from({ length: 7 }, (_, i) => ({
      voices: {
        soprano: `C${4 + (i % 3)}`,
        alto: "E4",
        tenor: "G3",
        bass: `C${3 + (i % 2)}`,
      },
    }));
    const lines = buildProgressionWindowFacts(slots, 3, undefined, 3);
    expect(lines.some((l) => l.includes("view 0…6") && l.includes("focus 3"))).toBe(true);
    expect(lines.filter((l) => l.startsWith("FACT: PROGRESSION —")).length).toBeGreaterThanOrEqual(
      4,
    );
  });

  it("adds a conservative hint when bass descends by fifth twice", () => {
    const slots = [
      {
        voices: {
          soprano: "C5",
          alto: "E4",
          tenor: "G3",
          bass: "C3",
        },
      },
      {
        voices: {
          soprano: "B4",
          alto: "D4",
          tenor: "F3",
          bass: "F2",
        },
      },
      {
        voices: {
          soprano: "A4",
          alto: "C4",
          tenor: "E3",
          bass: "Bb1",
        },
      },
    ];
    const lines = buildProgressionWindowFacts(slots, 1);
    expect(lines.some((l) => l.includes("PROGRESSION HINT"))).toBe(true);
    expect(lines.some((l) => l.includes("ii–V–I"))).toBe(true);
  });
});

describe("buildSatbNoteContextLines", () => {
  it("uses staff names and emits intervals to each other voice", () => {
    const slots = [
      {
        voices: {
          soprano: "C5",
          alto: "E4",
          tenor: "G3",
          bass: "C3",
        },
      },
    ];
    const lines = buildSatbNoteContextLines(slots, 0, "alto", {
      voiceStaffNames: {
        soprano: "Violin I",
        alto: "Violin II",
        tenor: "Viola",
        bass: "Cello",
      },
    });
    expect(lines.some((l) => l.includes("Violin II"))).toBe(true);
    expect(lines.some((l) => l.includes("Cello"))).toBe(true);
    const intervalFacts = lines.filter((l) => l.includes("Interval from clicked"));
    expect(intervalFacts.length).toBe(3);
  });
});

describe("scoreToAuditedSlots requireExactlyFourParts", () => {
  it("returns null for eight parts even if first four are valid SATB-shaped", () => {
    const mkPart = (id: string, name: string, pitch: string) => ({
      id,
      name,
      clef: "treble" as const,
      measures: [
        {
          id: `meas-${id}`,
          notes: [{ id: `n-${id}`, pitch, duration: "q" as const }],
        },
      ],
    });
    const score: EditableScore = {
      divisions: 1,
      parts: [
        mkPart("p0", "Soprano", "C5"),
        mkPart("p1", "Alto", "E4"),
        mkPart("p2", "Tenor", "G3"),
        mkPart("p3", "Bass", "C3"),
        mkPart("p4", "Extra1", "D4"),
        mkPart("p5", "Extra2", "F4"),
        mkPart("p6", "Extra3", "A3"),
        mkPart("p7", "Extra4", "B3"),
      ],
    };
    expect(scoreToAuditedSlots(score, { requireExactlyFourParts: true })).toBeNull();
    expect(scoreToAuditedSlots(score)).not.toBeNull();
  });
});
