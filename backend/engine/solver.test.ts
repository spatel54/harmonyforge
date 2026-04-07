import { generateSATB, SolverBudgetExceededError } from "./solver.js";

describe("solver", () => {
  it("generates SATB for I-IV-V-I in C major", () => {
    const result = generateSATB({
      key: { tonic: "C", mode: "major" },
      chords: [
        { roman: "I" },
        { roman: "IV" },
        { roman: "V7" },
        { roman: "I" },
      ],
    });
    expect(result).not.toBeNull();
    expect(result!.slots).toHaveLength(4);

    for (const slot of result!.slots) {
      expect(slot.voices.soprano).toMatch(/^[A-G]#?[0-9]$/);
      expect(slot.voices.alto).toMatch(/^[A-G]#?[0-9]$/);
      expect(slot.voices.tenor).toMatch(/^[A-G]#?[0-9]$/);
      expect(slot.voices.bass).toMatch(/^[A-G]#?[0-9]$/);
    }

    const bassNotes = result!.slots.map((s) => s.voices.bass);
    expect(bassNotes[0]).toMatch(/C[23]/);
    expect(bassNotes[1]).toMatch(/F[23]/);
    expect(bassNotes[2]).toMatch(/G[23]/);
    expect(bassNotes[3]).toMatch(/C[23]/);
  });

  it("returns null for invalid chord", () => {
    const result = generateSATB({
      key: { tonic: "C", mode: "major" },
      chords: [{ roman: "X" }],
    });
    expect(result).toBeNull();
  });

  it("uses melody when provided", () => {
    const result = generateSATB({
      key: { tonic: "C", mode: "major" },
      chords: [{ roman: "I" }, { roman: "V7" }, { roman: "I" }],
      melody: [
        { pitch: "G4", beat: 0 },
        { pitch: "F4", beat: 1 },
        { pitch: "E4", beat: 2 },
      ],
    });
    expect(result).not.toBeNull();
    expect(result!.slots[0].voices.soprano).toBe("G4");
    expect(result!.slots[1].voices.soprano).toBe("F4");
    expect(result!.slots[2].voices.soprano).toBe("E4");
  });

  it("uses the active melody note at each chord beat", () => {
    const result = generateSATB({
      key: { tonic: "C", mode: "major" },
      chords: [
        { roman: "I", beat: 0 },
        { roman: "vi", beat: 2 },
      ],
      melody: [
        { pitch: "E4", beat: 0, duration: 4 },
      ],
    });

    expect(result).not.toBeNull();
    expect(result!.slots[0].voices.soprano).toBe("E4");
    expect(result!.slots[1].voices.soprano).toBe("E4");
  });

  it("octave-normalizes soprano melody notes that exceed range", () => {
    const result = generateSATB({
      key: { tonic: "C", mode: "major" },
      chords: [{ roman: "vi", beat: 0 }],
      melody: [{ pitch: "A5", beat: 0, duration: 1 }],
    });

    expect(result).not.toBeNull();
    expect(result!.slots[0].voices.soprano).toBe("A4");
  });

  // Explicit chord progression tests (per #74, HFLitReview)
  it("ii–V–I in C major", () => {
    const result = generateSATB({
      key: { tonic: "C", mode: "major" },
      chords: [{ roman: "ii" }, { roman: "V7" }, { roman: "I" }],
    });
    expect(result).not.toBeNull();
    expect(result!.slots).toHaveLength(3);
    const bass = result!.slots.map((s) => s.voices.bass);
    expect(bass[0]).toMatch(/D[23]/);
    expect(bass[1]).toMatch(/G[23]/);
    expect(bass[2]).toMatch(/C[23]/);
  });

  it("I–vi–IV–V (doo-wop schema)", () => {
    const result = generateSATB({
      key: { tonic: "C", mode: "major" },
      chords: [{ roman: "I" }, { roman: "vi" }, { roman: "IV" }, { roman: "V" }],
    });
    expect(result).not.toBeNull();
    expect(result!.slots).toHaveLength(4);
  });

  it("i–iv–V–i in A minor", () => {
    const result = generateSATB({
      key: { tonic: "A", mode: "minor" },
      chords: [{ roman: "i" }, { roman: "iv" }, { roman: "V" }, { roman: "i" }],
    });
    expect(result).not.toBeNull();
    expect(result!.slots).toHaveLength(4);
    const bass = result!.slots.map((s) => s.voices.bass);
    expect(bass[0]).toMatch(/A[23]/);
    expect(bass[3]).toMatch(/A[23]/);
  });

  it("I–V–vi–IV (singer/songwriter schema)", () => {
    const result = generateSATB({
      key: { tonic: "C", mode: "major" },
      chords: [{ roman: "I" }, { roman: "V" }, { roman: "vi" }, { roman: "IV" }],
    });
    expect(result).not.toBeNull();
    expect(result!.slots).toHaveLength(4);
  });

  it("V7–I cadence with melody", () => {
    const result = generateSATB({
      key: { tonic: "C", mode: "major" },
      chords: [{ roman: "V7" }, { roman: "I" }],
      melody: [{ pitch: "F4", beat: 0 }, { pitch: "E4", beat: 1 }],
    });
    expect(result).not.toBeNull();
    expect(result!.slots[0].voices.soprano).toBe("F4");
    expect(result!.slots[1].voices.soprano).toBe("E4");
  });

  it("ii7–V7–I (jazz) with relaxed genre", () => {
    const result = generateSATB(
      {
        key: { tonic: "C", mode: "major" },
        chords: [{ roman: "ii7" }, { roman: "V7" }, { roman: "I" }],
      },
      { genre: "jazz" }
    );
    expect(result).not.toBeNull();
    expect(result!.slots).toHaveLength(3);
  });

  it("throws SolverBudgetExceededError when node budget is exhausted", () => {
    expect(() =>
      generateSATB(
        {
          key: { tonic: "C", mode: "major" },
          chords: [
            { roman: "I" },
            { roman: "IV" },
            { roman: "V7" },
            { roman: "I" },
          ],
        },
        { maxNodes: 5, skipGreedy: true },
      ),
    ).toThrow(SolverBudgetExceededError);
  });

  it("completes for many chord slots within default budget (regression)", () => {
    const n = 64;
    const chords = Array.from({ length: n }, (_, i) => ({ roman: "I" as const, beat: i * 2 }));
    const result = generateSATB({
      key: { tonic: "C", mode: "major" },
      chords,
      melody: [{ pitch: "C4", beat: 0, duration: n * 2 }],
    });
    expect(result).not.toBeNull();
    expect(result!.slots).toHaveLength(n);
  });

  it("greedy-first completes mid-length varied progression (I–IV–V7–I)×8 under former N≥56 threshold", () => {
    const pattern = ["I", "IV", "V7", "I"] as const;
    const n = 32;
    const chords = Array.from({ length: n }, (_, i) => ({
      roman: pattern[i % 4]!,
      beat: i,
    }));
    const result = generateSATB({
      key: { tonic: "C", mode: "major" },
      chords,
      melody: [{ pitch: "C4", beat: 0, duration: n * 2 }],
    });
    expect(result).not.toBeNull();
    expect(result!.slots).toHaveLength(n);
  });

  it("greedy path completes a long all-I chain with fixed melody (latency regression)", () => {
    const n = 100;
    const chords = Array.from({ length: n }, (_, i) => ({ roman: "I" as const, beat: i }));
    const t0 = performance.now();
    const result = generateSATB({
      key: { tonic: "C", mode: "major" },
      chords,
      melody: [{ pitch: "G4", beat: 0, duration: n * 2 }],
    });
    expect(result).not.toBeNull();
    expect(result!.slots).toHaveLength(n);
    expect(performance.now() - t0).toBeLessThan(5000);
  });
});