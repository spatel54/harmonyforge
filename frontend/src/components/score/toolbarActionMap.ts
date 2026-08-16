/**
 * Maps RiffScore toolbar plugin action ids (hf-action-*) to sandbox `handleToolSelect`
 * tool ids shared with the palette and keyboard paths.
 */

export type SandboxToolbarActionId =
  | "hf-action-transpose-up"
  | "hf-action-transpose-down"
  | "hf-action-octave-up"
  | "hf-action-octave-down"
  | "hf-action-print";

const ACTION_TO_TOOL_ID: Record<SandboxToolbarActionId, string> = {
  "hf-action-transpose-up": "pitch-up-semitone",
  "hf-action-transpose-down": "pitch-down-semitone",
  "hf-action-octave-up": "pitch-up-octave",
  "hf-action-octave-down": "pitch-down-octave",
  "hf-action-print": "score-print",
};

export function mapSandboxToolbarActionToToolId(
  actionId: SandboxToolbarActionId,
): string | null {
  return ACTION_TO_TOOL_ID[actionId] ?? null;
}
