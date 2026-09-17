const NON_TEXT_INPUT_TYPES = new Set([
  "checkbox",
  "radio",
  "range",
  "button",
  "submit",
  "reset",
  "file",
  "color",
  "image",
  "hidden",
]);

function isHtmlTarget(target: EventTarget | null): target is HTMLElement {
  return target instanceof HTMLElement;
}

/** True when the user is typing in a form control or contenteditable (don’t hijack arrow/delete shortcuts). */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!isHtmlTarget(target)) return false;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (target as HTMLInputElement).type;
    // Checkboxes / radios / sliders should not swallow F9 and other chrome hotkeys.
    if (NON_TEXT_INPUT_TYPES.has(type)) return false;
    return true;
  }
  if (target.isContentEditable) return true;
  if (target.closest("[contenteditable='true']")) return true;
  const role = target.getAttribute("role");
  if (role === "textbox" || role === "searchbox" || role === "combobox") return true;
  return Boolean(target.closest('[role="textbox"],[role="searchbox"],[role="combobox"]'));
}

/**
 * True only for fields where ⌘/Ctrl+C/V/Z should stay native (chat, lyrics, title).
 * Comboboxes and RiffScore BPM are not included — those must not swallow note copy/paste/undo.
 */
export function isEditableTextTarget(target: EventTarget | null): boolean {
  if (!isHtmlTarget(target)) return false;
  if (isRiffScoreBpmField(target)) return false;
  const tag = target.tagName;
  if (tag === "TEXTAREA") return true;
  if (tag === "INPUT") {
    const type = (target as HTMLInputElement).type;
    if (NON_TEXT_INPUT_TYPES.has(type)) return false;
    return true;
  }
  if (target.isContentEditable) return true;
  if (target.closest("[contenteditable='true']")) return true;
  const role = target.getAttribute("role");
  if (role === "textbox" || role === "searchbox") return true;
  return Boolean(target.closest('[role="textbox"],[role="searchbox"]'));
}

/** RiffScore toolbar tempo field — digits type here, but note clipboard/history still apply. */
export function isRiffScoreBpmField(target: EventTarget | null): boolean {
  return isHtmlTarget(target) && Boolean(target.closest(".riff-PlaybackControls__bpm-input"));
}
