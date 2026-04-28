/** True when the user is typing in a form control or contenteditable (don’t hijack arrow/delete shortcuts). */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  if (target.closest("[contenteditable='true']")) return true;
  const role = target.getAttribute("role");
  if (role === "textbox" || role === "searchbox" || role === "combobox") return true;
  return Boolean(target.closest('[role="textbox"],[role="searchbox"],[role="combobox"]'));
}
