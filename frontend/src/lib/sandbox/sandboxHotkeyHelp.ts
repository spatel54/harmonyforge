export type SandboxHotkeyRow = { keys: string; description: string };

export type SandboxHotkeySection = { title: string; rows: SandboxHotkeyRow[] };

/** Keyboard shortcuts implemented by the sandbox page (see `onKeyDown` in sandbox/page.tsx). */
export const SANDBOX_HOTKEY_SECTIONS: SandboxHotkeySection[] = [
  {
    title: "Selection & score",
    rows: [
      { keys: "Esc", description: "Clear the current selection." },
      {
        keys: "Delete · Backspace",
        description: "Delete selected notes (when there is a selection).",
      },
      {
        keys: "⌘/Ctrl + Z",
        description: "Undo the last edit in the score editor.",
      },
      {
        keys: "⌘/Ctrl + Shift + Z · ⌘/Ctrl + Y",
        description: "Redo.",
      },
      {
        keys: "⌘/Ctrl + C · X · V",
        description:
          "Copy or cut the selected notes to the internal clipboard; paste inserts copied/cut notes at the entry cursor (requires a score).",
      },
      {
        keys: "⌘/Ctrl + A",
        description: "Select every note in the score.",
      },
    ],
  },
  {
    title: "Notation panel",
    rows: [
      {
        keys: "F9",
        description: "Show or hide the Notation (beta) panel (dynamics, slurs, etc.).",
      },
    ],
  },
  {
    title: "Step-time entry (no selection)",
    rows: [
      {
        keys: "N",
        description: "Choose the quarter-note duration tool (for typed note entry).",
      },
      {
        keys: "[ · ]",
        description:
          "Step the active duration shorter or longer (32nd through whole). Works from the main keyboard or physical bracket keys (e.code).",
      },
      {
        keys: "0",
        description:
          "With no selection: insert a rest at the entry cursor using the active duration (0 or numpad 0). With notes selected: turn those notes into rests.",
      },
      {
        keys: "A – G",
        description:
          "Type a pitch at the cursor (octave 4 with the current duration). If the cursor is on a rest, replaces that rest with the pitch (same duration).",
      },
      {
        keys: "← · →",
        description: "Move the entry cursor to the previous or next note.",
      },
      {
        keys: "↑ · ↓",
        description:
          "When a note-duration tool is active, move the entry cursor to the staff above or below.",
      },
    ],
  },
  {
    title: "With notes selected",
    rows: [
      {
        keys: "1 – 6",
        description:
          "Set duration: 1 = 32nd, 2 = 16th, 3 = eighth, 4 = quarter, 5 = half, 6 = whole. Number row, Digit1–6 (even with Shift), or numpad 1–6.",
      },
      {
        keys: "A – G",
        description: "Set the pitch letter of all selected notes (same octave behavior as editor tools).",
      },
      { keys: ",", description: "Tie selected notes (comma key)." },
      { keys: "+", description: "Sharp accidental (plus or numpad +)." },
      { keys: "-", description: "Flat (hyphen, unicode minus, or numpad −)." },
      { keys: "=", description: "Natural (= or numpad =)." },
    ],
  },
];
