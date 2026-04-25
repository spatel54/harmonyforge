import { SANDBOX_TOOLBAR_TO_TOOL_ID } from "@/components/score/toolbarActionMap";

export const SANDBOX_TOOLBAR_ACTION_IDS = new Set<string>(Object.keys(SANDBOX_TOOLBAR_TO_TOOL_ID));

export const SANDBOX_TOOLBAR_SUPPORTED_TOOL_IDS = new Set<string>([
  "edit-undo",
  "edit-redo",
  "pitch-up-semitone",
  "pitch-down-semitone",
  "pitch-up-octave",
  "pitch-down-octave",
  "duration-dotted",
  "duration-rest-toggle",
  "dynamics-piano",
  "dynamics-forte",
  "score-export-xml",
  "score-print",
]);
