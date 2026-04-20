import { describe, expect, it, vi } from "vitest";
import {
  applyIntent,
  describeIntent,
  INTENT_MARKER,
  parseIntentBlock,
  type Intent,
} from "./intentRouter";

describe("parseIntentBlock", () => {
  it("returns null intent for plain text", () => {
    const r = parseIntentBlock("Just advice, no intent here.");
    expect(r.intent).toBeNull();
    expect(r.cleaned).toBe("Just advice, no intent here.");
  });

  it("parses a set_mood intent and strips the block from the body", () => {
    const body = [
      "Switch to minor to match the sadder melody.",
      "",
      INTENT_MARKER,
      "{\"action\":\"set_mood\",\"value\":\"minor\",\"reason\":\"match mood\"}",
    ].join("\n");
    const r = parseIntentBlock(body);
    expect(r.intent).toEqual({
      action: "set_mood",
      value: "minor",
      reason: "match mood",
    });
    expect(r.cleaned).toBe("Switch to minor to match the sadder melody.");
  });

  it("ignores malformed JSON without losing the body", () => {
    const body = `Some advice.\n\n${INTENT_MARKER}\n{not: valid}`;
    const r = parseIntentBlock(body);
    expect(r.intent).toBeNull();
    expect(r.cleaned).toContain("Some advice.");
  });

  it("rejects unknown action values", () => {
    const body = `${INTENT_MARKER}\n{"action":"drop_database"}`;
    const r = parseIntentBlock(body);
    expect(r.intent).toBeNull();
  });

  it("parses set_pickup_beats with numeric value", () => {
    const body = `${INTENT_MARKER}\n{"action":"set_pickup_beats","value":1.5}`;
    const r = parseIntentBlock(body);
    expect(r.intent).toEqual({ action: "set_pickup_beats", value: 1.5 });
  });
});

describe("describeIntent", () => {
  it("renders a user-friendly sentence per action", () => {
    expect(describeIntent({ action: "set_mood", value: "minor" })).toMatch(/mood.*minor/);
    expect(describeIntent({ action: "regenerate" })).toMatch(/Regenerate/i);
    expect(describeIntent({ action: "open_document_page" })).toMatch(/Document/);
  });
});

describe("applyIntent", () => {
  it("calls the matching handler when provided", () => {
    const setMood = vi.fn();
    const navigate = vi.fn();
    const intent: Intent = { action: "set_mood", value: "minor" };
    const ok = applyIntent(intent, { setMood, navigate });
    expect(ok).toBe(true);
    expect(setMood).toHaveBeenCalledWith("minor");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("returns false when no handler is wired", () => {
    const intent: Intent = { action: "regenerate" };
    expect(applyIntent(intent, {})).toBe(false);
  });
});
