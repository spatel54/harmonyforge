import {
  checkRange,
  checkSpacing,
  checkVoiceOrder,
  hasParallelFifth,
  hasParallelOctave,
  checkVoiceLeading,
} from "./constraints.js";

describe("constraints", () => {
  const validVoices = {
    soprano: "G4",
    alto: "E4",
    tenor: "C4",
    bass: "C3",
  };

  describe("checkRange", () => {
    it("accepts voices in range", () => {
      expect(checkRange(validVoices)).toBe(true);
    });

    it("rejects soprano below C4", () => {
      expect(checkRange({ ...validVoices, soprano: "B3" })).toBe(false);
    });

    it("rejects bass above D4", () => {
      expect(checkRange({ ...validVoices, bass: "E4" })).toBe(false);
    });
  });

  describe("checkSpacing", () => {
    it("accepts valid spacing", () => {
      expect(checkSpacing(validVoices)).toBe(true);
    });

    it("rejects S-A > octave", () => {
      expect(checkSpacing({ ...validVoices, soprano: "G5", alto: "E4" })).toBe(
        false
      );
    });
  });

  describe("checkVoiceOrder", () => {
    it("accepts S >= A >= T >= B", () => {
      expect(checkVoiceOrder(validVoices)).toBe(true);
    });

    it("rejects voice crossing", () => {
      expect(
        checkVoiceOrder({ ...validVoices, alto: "C5", soprano: "G4" })
      ).toBe(false);
    });
  });

  describe("hasParallelFifth", () => {
    it("detects parallel fifths", () => {
      const prev = { soprano: "G4", alto: "C4", tenor: "E3", bass: "C3" };
      const curr = { soprano: "D5", alto: "G4", tenor: "B3", bass: "G2" };
      expect(hasParallelFifth(prev, curr)).toBe(true);
    });

    it("allows contrary motion", () => {
      const prev = { soprano: "G4", alto: "C4", tenor: "E3", bass: "C3" };
      const curr = { soprano: "C4", alto: "G4", tenor: "E3", bass: "C3" };
      expect(hasParallelFifth(prev, curr)).toBe(false);
    });
  });

  describe("hasParallelOctave", () => {
    it("detects parallel octaves when two voices move same direction to octave", () => {
      const prev = { soprano: "C5", alto: "C4", tenor: "G3", bass: "C3" };
      const curr = { soprano: "C4", alto: "C3", tenor: "G3", bass: "C3" };
      expect(hasParallelOctave(prev, curr)).toBe(true);
    });
  });

  describe("checkVoiceLeading", () => {
    it("accepts valid first chord", () => {
      expect(checkVoiceLeading(null, validVoices)).toBe(true);
    });

    it("rejects when parallel fifth with prev", () => {
      const prev = { soprano: "G4", alto: "C4", tenor: "E3", bass: "C3" };
      const curr = { soprano: "D5", alto: "G4", tenor: "B3", bass: "G2" };
      expect(checkVoiceLeading(prev, curr)).toBe(false);
    });
  });
});
