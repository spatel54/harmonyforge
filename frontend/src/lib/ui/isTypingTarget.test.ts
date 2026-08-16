/** @vitest-environment happy-dom */

import { describe, expect, it } from "vitest";
import { isTypingTarget } from "./isTypingTarget";

describe("isTypingTarget", () => {
  it("treats text inputs as typing targets", () => {
    const input = document.createElement("input");
    input.type = "text";
    expect(isTypingTarget(input)).toBe(true);
  });

  it("does not treat checkboxes as typing targets so F9 still works", () => {
    const input = document.createElement("input");
    input.type = "checkbox";
    expect(isTypingTarget(input)).toBe(false);
  });
});
