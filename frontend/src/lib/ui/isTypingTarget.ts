/** True when the user is typing in a form control or contenteditable (don’t hijack arrow/delete shortcuts). */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (target as HTMLInputElement).type;
    // Checkboxes / radios / sliders should not swallow F9 and other chrome hotkeys.
    if (type === "checkbox" || type === "radio" || type === "range" || type === "button") {
      return false;
    }
    return true;
  }
  if (target.isContentEditable) return true;
  if (target.closest("[contenteditable='true']")) return true;
  const role = target.getAttribute("role");
  if (role === "textbox" || role === "searchbox" || role === "combobox") return true;
  return Boolean(target.closest('[role="textbox"],[role="searchbox"],[role="combobox"]'));
}
