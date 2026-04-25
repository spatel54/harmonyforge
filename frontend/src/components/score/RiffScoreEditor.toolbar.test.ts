import { describe, expect, it } from "vitest";
import {
  SANDBOX_TOOLBAR_TO_TOOL_ID,
  mapSandboxToolbarActionToToolId,
} from "./toolbarActionMap";

describe("RiffScore toolbar action map", () => {
  it("maps all screenshot toolbar actions to sandbox tool ids", () => {
    expect(Object.keys(SANDBOX_TOOLBAR_TO_TOOL_ID)).toEqual([
      "hf-action-undo",
      "hf-action-redo",
      "hf-action-transpose-up",
      "hf-action-transpose-down",
      "hf-action-octave-up",
      "hf-action-octave-down",
      "hf-action-dot-toggle",
      "hf-action-rest-toggle",
      "hf-action-dyn-p",
      "hf-action-dyn-f",
      "hf-action-export-xml",
      "hf-action-print",
    ]);
  });

  it("returns null for unknown toolbar actions", () => {
    expect(mapSandboxToolbarActionToToolId("unknown")).toBeNull();
  });

  it("keeps print/export routed to sandbox-safe command ids", () => {
    expect(mapSandboxToolbarActionToToolId("hf-action-export-xml")).toBe("score-export-xml");
    expect(mapSandboxToolbarActionToToolId("hf-action-print")).toBe("score-print");
  });
});
