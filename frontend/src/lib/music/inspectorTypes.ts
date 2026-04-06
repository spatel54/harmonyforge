export type InspectorHighlightSeverity = "error" | "warning";

export interface ScoreIssueHighlight {
  noteId: string;
  label: string;
  severity: InspectorHighlightSeverity;
  detail?: string;
}
