/**
 * Maps RiffScore toolbar plugin action ids (hf-action-*) to sandbox `handleToolSelect`
 * tool ids shared with the palette and keyboard paths.
 */

export type SandboxToolbarActionId =
  | "hf-action-undo"
  | "hf-action-redo"
  | "hf-action-transpose-up"
  | "hf-action-transpose-down"
  | "hf-action-octave-up"
  | "hf-action-octave-down"
  | "hf-action-dot-toggle"
  | "hf-action-rest-toggle"
  | "hf-action-dyn-p"
  | "hf-action-dyn-f"
  | "hf-action-export-xml"
  | "hf-action-print";

const ACTION_TO_TOOL_ID: Record<SandboxToolbarActionId, string> = {
  "hf-action-undo": "edit-undo",
  "hf-action-redo": "edit-redo",
  "hf-action-transpose-up": "pitch-up-semitone",
  "hf-action-transpose-down": "pitch-down-semitone",
  "hf-action-octave-up": "pitch-up-octave",
  "hf-action-octave-down": "pitch-down-octave",
  "hf-action-dot-toggle": "duration-dotted",
  "hf-action-rest-toggle": "duration-rest-toggle",
  "hf-action-dyn-p": "dynamics-piano",
  "hf-action-dyn-f": "dynamics-forte",
  "hf-action-export-xml": "score-export-xml",
  "hf-action-print": "score-print",
};

export function mapSandboxToolbarActionToToolId(
  actionId: SandboxToolbarActionId,
): string | null {
  return ACTION_TO_TOOL_ID[actionId] ?? null;
}
