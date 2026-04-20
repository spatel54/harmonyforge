import { describe, expect, it } from "vitest";

import { resolveStarterPrompts } from "./starterPrompts";
import type { InspectorScoreFocus } from "@/store/useTheoryInspectorStore";

describe("resolveStarterPrompts", () => {
  it("returns the default chips when there is no focus", () => {
    const prompts = resolveStarterPrompts(null);
    expect(prompts.map((p) => p.id)).toContain("check-voice-leading");
    expect(prompts.map((p) => p.id)).toContain("check-pickup");
  });

  it("returns measure-specific chips when a bar is focused", () => {
    const focus: InspectorScoreFocus = {
      kind: "measure",
      measureIndex: 2,
      evidenceLines: [],
      noteIds: [],
    };
    const prompts = resolveStarterPrompts(focus);
    expect(prompts.map((p) => p.id)).toContain("edit-bar");
    expect(prompts.every((p) => p.prompt.length > 0)).toBe(true);
  });

  it("returns part-specific chips when a staff is focused", () => {
    const focus: InspectorScoreFocus = {
      kind: "part",
      partId: "p1",
      partName: "Cello",
      evidenceLines: [],
      noteIds: [],
    };
    const prompts = resolveStarterPrompts(focus);
    expect(prompts.map((p) => p.id)).toContain("explain-part");
  });
});
