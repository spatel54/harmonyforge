import { describe, expect, it } from "vitest";

import { buildSystemPrompt } from "@/lib/ai/prompts";

const baseCtx = {
  genre: "classical",
  taxonomySection: "(test taxonomy)",
};

describe("buildSystemPrompt", () => {
  it("returns a long string (regression: template literal must not break on backticks)", () => {
    const out = buildSystemPrompt("tutor", baseCtx);
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(200);
  });

  it("omits musical-goal block when the goal is empty", () => {
    const systemPrompt = buildSystemPrompt("tutor", baseCtx);
    expect(systemPrompt).not.toContain("User-stated musical goal");
  });

  it("includes musical-goal block verbatim when the user sets a goal", () => {
    const systemPrompt = buildSystemPrompt("tutor", {
      ...baseCtx,
      musicalGoal: "establish a stable C major cadence here",
    });
    expect(systemPrompt).toContain("User-stated musical goal");
    expect(systemPrompt).toContain("establish a stable C major cadence here");
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

  it("uses unified Theory Inspector voice (actionable bullets, plain-language gloss guidance)", () => {
    const p = buildSystemPrompt("tutor", baseCtx);
    expect(p).toContain("2–4 bullet lines");
    expect(p).toContain("non-obvious term");
    expect(p).toContain("<<<SUGGESTIONS>>>");
    expect(p).toContain("Theory Inspector audience");
  });
});
