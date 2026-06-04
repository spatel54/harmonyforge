import { describe, expect, it } from "vitest";
import {
  chordSymbolToHarmonyXml,
  normalizeLeadSheetChordSymbol,
  romanToChordSymbol,
} from "./chordSymbolFormat";

describe("romanToChordSymbol", () => {
  const cMajor = { tonic: "C" as const, mode: "major" as const };

  it("maps diatonic triads in C major", () => {
    expect(romanToChordSymbol("I", cMajor)).toBe("C");
    expect(romanToChordSymbol("ii", cMajor)).toBe("Dm");
    expect(romanToChordSymbol("IV", cMajor)).toBe("F");
    expect(romanToChordSymbol("V7", cMajor)).toBe("G7");
  });

  it("maps minor key tonic", () => {
    expect(romanToChordSymbol("i", { tonic: "A", mode: "minor" })).toBe("Am");
  });
});

describe("normalizeLeadSheetChordSymbol", () => {
  it("drops major M suffix on triads", () => {
    expect(normalizeLeadSheetChordSymbol("CM")).toBe("C");
    expect(normalizeLeadSheetChordSymbol("F#M")).toBe("F#");
    expect(normalizeLeadSheetChordSymbol("Bb major")).toBe("Bb");
  });

  it("keeps minor as lowercase m", () => {
    expect(normalizeLeadSheetChordSymbol("Am")).toBe("Am");
    expect(normalizeLeadSheetChordSymbol("Dmin")).toBe("Dm");
    expect(normalizeLeadSheetChordSymbol("F#min7")).toBe("F#m7");
  });

  it("preserves seventh and extended spellings", () => {
    expect(normalizeLeadSheetChordSymbol("G7")).toBe("G7");
    expect(normalizeLeadSheetChordSymbol("Cmaj7")).toBe("Cmaj7");
    expect(normalizeLeadSheetChordSymbol("Dm7")).toBe("Dm7");
  });
});

describe("chordSymbolToHarmonyXml", () => {
  it("emits root and kind with text attribute", () => {
    const xml = chordSymbolToHarmonyXml("G7");
    expect(xml).toContain("<root-step>G</root-step>");
    expect(xml).toContain('kind text="G7"');
    expect(xml).toContain("dominant");
  });
});
