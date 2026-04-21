import { describe, expect, it } from "vitest";

import { buildSystemPrompt } from "./prompts";

const baseCtx = {
  genre: "classical",
  taxonomySection: "(test taxonomy)",
  explanationLevel: "intermediate" as const,
};

describe("buildSystemPrompt", () => {
  it("omits musical-goal block when the goal is empty", () => {
    const prompt = buildSystemPrompt("tutor", baseCtx);
    expect(prompt).not.toContain("User-stated musical goal");
  });

  it("includes musical-goal block verbatim when the user sets a goal", () => {
    const prompt = buildSystemPrompt("tutor", {
      ...baseCtx,
      musicalGoal: "establish a stable C major cadence here",
    });
    expect(prompt).toContain("User-stated musical goal");
    expect(prompt).toContain("establish a stable C major cadence here");
  });

  it("includes the actionable-command intent block for auditor and tutor", () => {
    const tutorPrompt = buildSystemPrompt("tutor", baseCtx);
    const auditorPrompt = buildSystemPrompt("auditor", baseCtx);
    expect(tutorPrompt).toContain("<<<INTENT>>>");
    expect(tutorPrompt).toContain("Actionable-command handling");
    expect(auditorPrompt).toContain("<<<INTENT>>>");
  });

  it("propagates musical goal into stylist prompts", () => {
    const stylist = buildSystemPrompt("stylist", {
      ...baseCtx,
      musicalGoal: "keep bass line stepwise",
    });
    expect(stylist).toContain("keep bass line stepwise");
  });

  it("includes progression-first rules for tutor, auditor, and stylist", () => {
    for (const persona of ["tutor", "auditor", "stylist"] as const) {
      const p = buildSystemPrompt(persona, baseCtx);
      expect(p).toContain("Progression-first analysis");
      expect(p).toContain("PROGRESSION WINDOW");
      expect(p).toContain("pleasantness");
    }
  });
});
