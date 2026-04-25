export type SandboxHotkeyRow = { keys: string; description: string };

export type SandboxHotkeySection = { title: string; rows: SandboxHotkeyRow[] };

/** Keyboard shortcuts implemented by the sandbox page (see `onKeyDown` in sandbox/page.tsx). */
export const SANDBOX_HOTKEY_SECTIONS: SandboxHotkeySection[] = [
  {
    title: "Selection & score",
    rows: [
      {
        keys: "Toolbar · F9",
        description:
          "Durations, accidentals, and playback live in the RiffScore toolbar. F9 toggles the Notation (palette) panel for dynamics, clefs, and more.",
      },
      {
        keys: "Inspector Float",
        description:
          "With Theory Inspector in Float mode, drag the cherry header bar (not the Dock/Float/Close buttons) to reposition the panel; the spot is remembered for next time.",
      },
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
      {
        keys: "Measure gutter",
        description:
          "Click empty space in a measure column on a staff (not on a note or rest) to select every event in that bar for that staff only—useful with Theory Inspector bar focus.",
      },
    ],
  },
  {
    title: "Touch & tablet",
    rows: [
      {
        keys: "Rest → pitch",
        description:
          "There is no hover on touch: put the cursor on a rest or select it, then type A–G. You can also touch and drag on a rest to move the preview ghost, then tap the ghost to commit.",
      },
      {
        keys: "Measure gutter",
        description:
          "Tap empty space in the measure column on a staff (same as desktop) to select the whole bar on that staff.",
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
        keys: "R",
        description:
          "Toggle Repitch mode: change pitch with A–G on a selection or at the cursor; hover a rest for the ghost preview without picking a duration first. Press R again to return to quarter-note entry.",
      },
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
        keys: "↑ · ↓",
        description:
          "Move selected notes by one semitone (layout-safe: uses Arrow key codes). RiffScore’s own arrow handler is bypassed so direction matches the label.",
      },
      {
        keys: "⌘/Ctrl + ↑ · ↓",
        description: "Transpose selected notes by one octave up or down.",
      },
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
