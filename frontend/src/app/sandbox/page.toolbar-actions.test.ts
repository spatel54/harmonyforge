import { describe, expect, it } from "vitest";
import { SANDBOX_TOOLBAR_TO_TOOL_ID } from "@/components/score/toolbarActionMap";
import {
  SANDBOX_TOOLBAR_ACTION_IDS,
  SANDBOX_TOOLBAR_SUPPORTED_TOOL_IDS,
} from "./toolbarContracts";

describe("sandbox toolbar command compatibility", () => {
  it("includes all toolbar action ids from the editor mapping", () => {
    expect(SANDBOX_TOOLBAR_ACTION_IDS).toEqual(new Set(Object.keys(SANDBOX_TOOLBAR_TO_TOOL_ID)));
  });

  it("supports every mapped tool id in page command routing", () => {
    for (const toolId of Object.values(SANDBOX_TOOLBAR_TO_TOOL_ID)) {
      expect(SANDBOX_TOOLBAR_SUPPORTED_TOOL_IDS.has(toolId)).toBe(true);
    }
  });
});
