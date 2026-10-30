/** @vitest-environment happy-dom */

import { describe, expect, it } from "vitest";
import { isEditableTextTarget, isRiffScoreBpmField, isTypingTarget } from "./isTypingTarget";

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

describe("isEditableTextTarget", () => {
  it("treats inspector textareas as editable text so ⌘C copies prose", () => {
    const area = document.createElement("textarea");
    expect(isEditableTextTarget(area)).toBe(true);
  });

  it("does not treat combobox chrome as editable text so ⌘C still copies notes", () => {
    const box = document.createElement("div");
    box.setAttribute("role", "combobox");
    expect(isTypingTarget(box)).toBe(true);
    expect(isEditableTextTarget(box)).toBe(false);
  });

  it("does not treat the RiffScore BPM field as editable text for clipboard/history", () => {
    const wrap = document.createElement("div");
    const input = document.createElement("input");
    input.type = "text";
    input.className = "riff-PlaybackControls__bpm-input";
    wrap.appendChild(input);
    document.body.appendChild(wrap);
    expect(isRiffScoreBpmField(input)).toBe(true);
    expect(isEditableTextTarget(input)).toBe(false);
    wrap.remove();
  });
});
