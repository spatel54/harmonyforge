import { beforeEach, describe, expect, it } from "vitest";

import { useGenerationConfigStore } from "./useGenerationConfigStore";

describe("useGenerationConfigStore", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useGenerationConfigStore.getState().reset();
  });

  it("has sensible defaults", () => {
    const s = useGenerationConfigStore.getState();
    expect(s.mood).toBe("major");
    expect(s.genre).toBe("classical");
    expect(s.rhythmDensity).toBe("mixed");
    expect(s.instruments.soprano).toEqual([]);
    expect(s.detectedTonic).toBeNull();
  });

  it("persists updates to sessionStorage and restores them", async () => {
    useGenerationConfigStore.getState().setMood("minor");
    useGenerationConfigStore.getState().setGenre("jazz");
    useGenerationConfigStore.getState().setRhythmDensity("flowing");
    useGenerationConfigStore.getState().toggleInstrument("soprano", "Flute");
    useGenerationConfigStore.getState().setDetectedKey("G", "major");

    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

    useGenerationConfigStore.setState({
      mood: "major",
      genre: "classical",
      rhythmDensity: "mixed",
      instruments: { soprano: [], alto: [], tenor: [], bass: [] },
      detectedTonic: null,
      detectedMode: null,
    });
    useGenerationConfigStore.getState().restoreFromStorage();
    const s = useGenerationConfigStore.getState();
    expect(s.mood).toBe("minor");
    expect(s.genre).toBe("jazz");
    expect(s.rhythmDensity).toBe("flowing");
    expect(s.instruments.soprano).toContain("Flute");
    expect(s.detectedTonic).toBe("G");
    expect(s.detectedMode).toBe("major");
  });

  it("toggleInstrument adds then removes an instrument", () => {
    const store = useGenerationConfigStore.getState();
    store.toggleInstrument("alto", "Clarinet");
    expect(useGenerationConfigStore.getState().instruments.alto).toContain("Clarinet");
    store.toggleInstrument("alto", "Clarinet");
    expect(useGenerationConfigStore.getState().instruments.alto).not.toContain("Clarinet");
  });

  it("removeInstrument strips an instrument from every voice list", () => {
    useGenerationConfigStore.getState().toggleInstrument("soprano", "Violin I");
    useGenerationConfigStore.getState().toggleInstrument("alto", "Violin I");
    useGenerationConfigStore.getState().removeInstrument("Violin I");
    const s = useGenerationConfigStore.getState();
    expect(s.instruments.soprano).not.toContain("Violin I");
    expect(s.instruments.alto).not.toContain("Violin I");
  });

  it("reset wipes to defaults", () => {
    const store = useGenerationConfigStore.getState();
    store.setMood("minor");
    store.setRhythmDensity("chordal");
    store.reset();
    const s = useGenerationConfigStore.getState();
    expect(s.mood).toBe("major");
    expect(s.rhythmDensity).toBe("mixed");
  });
});
