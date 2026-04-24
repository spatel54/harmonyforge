import { beforeEach, describe, expect, it } from "vitest";

import { useGenerationConfigStore } from "./useGenerationConfigStore";

describe("useGenerationConfigStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useGenerationConfigStore.getState().reset();
  });

  it("has sensible defaults", () => {
    const s = useGenerationConfigStore.getState();
    expect(s.mood).toBe("major");
    expect(s.genre).toBe("classical");
    expect(s.rhythmDensity).toBe("mixed");
    expect(s.bassRhythmMode).toBe("follow");
    expect(s.instruments.soprano).toEqual([]);
    expect(s.detectedTonic).toBeNull();
  });

  it("persists updates to localStorage", async () => {
    useGenerationConfigStore.getState().setMood("minor");
    useGenerationConfigStore.getState().setGenre("jazz");
    useGenerationConfigStore.getState().setRhythmDensity("flowing");
    useGenerationConfigStore.getState().toggleInstrument("soprano", "Flute");
    useGenerationConfigStore.getState().setDetectedKey("G", "major");

    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

    const raw = localStorage.getItem("harmonyforge-generation-config");
    expect(raw).toBeTruthy();
    const { state } = JSON.parse(raw!) as { state: Record<string, unknown> };
    expect(state.mood).toBe("minor");
    expect(state.genre).toBe("jazz");
    expect(state.rhythmDensity).toBe("flowing");
    expect(state.instruments).toEqual(
      expect.objectContaining({ soprano: expect.arrayContaining(["Flute"]) }),
    );
    expect(state.detectedTonic).toBe("G");
    expect(state.detectedMode).toBe("major");
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
    expect(s.bassRhythmMode).toBe("follow");
  });

  it("setBassRhythmMode persists pedal", async () => {
    useGenerationConfigStore.getState().setBassRhythmMode("pedal");
    expect(useGenerationConfigStore.getState().bassRhythmMode).toBe("pedal");
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    const raw = localStorage.getItem("harmonyforge-generation-config");
    expect(raw).toBeTruthy();
    const { state } = JSON.parse(raw!) as { state: Record<string, unknown> };
    expect(state.bassRhythmMode).toBe("pedal");
  });
});
