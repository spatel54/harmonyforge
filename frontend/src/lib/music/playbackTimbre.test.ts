import { describe, expect, it } from "vitest";
import { partNameToTimbreKind } from "./playbackTimbre";

describe("partNameToTimbreKind", () => {
  it("classifies common HarmonyForge part labels", () => {
    expect(partNameToTimbreKind("Violin I")).toBe("strings");
    expect(partNameToTimbreKind("Viola")).toBe("strings");
    expect(partNameToTimbreKind("Tuba")).toBe("bass");
    expect(partNameToTimbreKind("Trumpet")).toBe("brass");
    expect(partNameToTimbreKind("Flute")).toBe("winds");
    expect(partNameToTimbreKind("Oboe")).toBe("winds");
    expect(partNameToTimbreKind("Cello")).toBe("strings");
  });
});
