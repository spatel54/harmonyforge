import { parseChord } from "./chordParser";

const C_MAJOR = { tonic: "C" as const, mode: "major" as const };
const A_MINOR = { tonic: "A" as const, mode: "minor" as const };

describe("chordParser", () => {
  describe("C major", () => {
    it("parses I to C major triad", () => {
      const c = parseChord("I", C_MAJOR);
      expect(c.rootPc).toBe(0);
      expect(c.thirdPc).toBe(4);
      expect(c.fifthPc).toBe(7);
      expect(c.bassPc).toBe(0);
      expect(c.chordTones).toEqual([0, 4, 7]);
    });

    it("parses ii to D minor triad", () => {
      const c = parseChord("ii", C_MAJOR);
      expect(c.rootPc).toBe(2);
      expect(c.thirdPc).toBe(5);
      expect(c.fifthPc).toBe(9);
      expect(c.bassPc).toBe(2);
    });

    it("parses IV to F major triad", () => {
      const c = parseChord("IV", C_MAJOR);
      expect(c.rootPc).toBe(5);
      expect(c.bassPc).toBe(5);
    });

    it("parses V7 to G dominant seventh", () => {
      const c = parseChord("V7", C_MAJOR);
      expect(c.rootPc).toBe(7);
      expect(c.seventhPc).toBe(5); // F = pc 5
      expect(c.chordTones).toContain(5);
    });

    it("parses iiø7 to half-diminished", () => {
      const c = parseChord("iiø7", C_MAJOR);
      expect(c.rootPc).toBe(2);
      expect(c.thirdPc).toBe(5);
      expect(c.fifthPc).toBe(8);
      expect(c.seventhPc).toBe(0); // C = pc 0
    });
  });

  describe("A minor", () => {
    it("parses i to A minor triad", () => {
      const c = parseChord("i", A_MINOR);
      expect(c.rootPc).toBe(9);
      expect(c.thirdPc).toBe(0);
      expect(c.fifthPc).toBe(4);
    });

    it("parses V to E major triad", () => {
      const c = parseChord("V", A_MINOR);
      expect(c.rootPc).toBe(4);
    });
  });
});
