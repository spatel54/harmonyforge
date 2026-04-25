export const SANDBOX_TOOLBAR_TO_TOOL_ID = {
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
} as const;

export type SandboxToolbarActionId = keyof typeof SANDBOX_TOOLBAR_TO_TOOL_ID;
export type SandboxToolId = (typeof SANDBOX_TOOLBAR_TO_TOOL_ID)[SandboxToolbarActionId];

export function mapSandboxToolbarActionToToolId(actionId: string): SandboxToolId | null {
  return SANDBOX_TOOLBAR_TO_TOOL_ID[actionId as SandboxToolbarActionId] ?? null;
}
