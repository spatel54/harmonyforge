import { generateSATB } from "./solver.js";
import { validateSATBSequence, validateSATBSequenceWithTrace } from "./validateSATB.js";
import type { LeadSheet } from "./types.js";

describe("API integration", () => {
  it("POST /api/generate-satb equivalent: valid lead sheet returns slots", () => {
    const leadSheet: LeadSheet = {
      key: { tonic: "C", mode: "major" },
      chords: [
        { roman: "I" },
        { roman: "IV" },
        { roman: "V7" },
        { roman: "I" },
      ],
    };
    const result = generateSATB(leadSheet);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("slots");
    expect(Array.isArray(result!.slots)).toBe(true);
    expect(result!.slots.length).toBe(4);

    for (const slot of result!.slots) {
      expect(slot).toHaveProperty("chord");
      expect(slot).toHaveProperty("voices");
      expect(slot.chord).toHaveProperty("roman");
      expect(slot.voices).toHaveProperty("soprano");
      expect(slot.voices).toHaveProperty("alto");
      expect(slot.voices).toHaveProperty("tenor");
      expect(slot.voices).toHaveProperty("bass");
    }
  });

  it("response structure matches output schema", () => {
    const result = generateSATB({
      key: { tonic: "A", mode: "minor" },
      chords: [{ roman: "i" }, { roman: "V" }, { roman: "i" }],
    });
    expect(result).not.toBeNull();
    const slot = result!.slots[0];
    expect(typeof slot.voices.soprano).toBe("string");
    expect(typeof slot.voices.alto).toBe("string");
    expect(typeof slot.voices.tenor).toBe("string");
    expect(typeof slot.voices.bass).toBe("string");
  });
});

describe("POST /api/validate-satb equivalent", () => {
  it("validates generated SATB and returns HER-style metrics", () => {
    const leadSheet: LeadSheet = {
      key: { tonic: "C", mode: "major" },
      chords: [{ roman: "I" }, { roman: "IV" }, { roman: "V7" }, { roman: "I" }],
    };
    const gen = generateSATB(leadSheet);
    expect(gen).not.toBeNull();
    const slots = gen!.slots.map((s) => s.voices);
    const result = validateSATBSequence(slots);
    expect(result).toHaveProperty("violations");
    expect(result).toHaveProperty("totalSlots", 4);
    expect(result).toHaveProperty("her");
    expect(result).toHaveProperty("valid");
    expect(typeof result.her).toBe("number");
    expect(result.her).toBeGreaterThanOrEqual(0);
    expect(result.her).toBeLessThanOrEqual(1);
  });

  it("returns valid:true for constraint-compliant SATB", () => {
    const slots = [
      { soprano: "C5", alto: "G4", tenor: "E4", bass: "C4" },
      { soprano: "C5", alto: "A4", tenor: "F4", bass: "F3" },
    ];
    const result = validateSATBSequence(slots);
    expect(result.totalSlots).toBe(2);
    expect(result.valid).toBe(true);
    expect(result.her).toBe(0);
  });

  it("returns per-slot trace for explainability", () => {
    const slots = [
      { soprano: "C5", alto: "A4", tenor: "F4", bass: "F3" },
      { soprano: "D5", alto: "B4", tenor: "G4", bass: "F3" },
    ];
    const result = validateSATBSequenceWithTrace(slots);
    expect(result.totalSlots).toBe(2);
    expect(Array.isArray(result.trace)).toBe(true);
    expect(result.trace.length).toBe(2);
    expect(result.trace[0]).toHaveProperty("slotIndex", 0);
    expect(result.trace[0]).toHaveProperty("findings");
  });
});
