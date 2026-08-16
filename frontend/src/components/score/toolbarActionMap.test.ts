import { describe, expect, it } from "vitest";
import {
  mapSandboxToolbarActionToToolId,
  type SandboxToolbarActionId,
} from "./toolbarActionMap";

/** Keep in sync with `SandboxToolbarActionId` union in toolbarActionMap.ts */
const ALL_SANDBOX_TOOLBAR_ACTION_IDS = [
  "hf-action-transpose-up",
  "hf-action-transpose-down",
  "hf-action-octave-up",
  "hf-action-octave-down",
  "hf-action-print",
] as const satisfies readonly SandboxToolbarActionId[];

const EXPECTED_TOOL_IDS: Record<SandboxToolbarActionId, string> = {
  "hf-action-transpose-up": "pitch-up-semitone",
  "hf-action-transpose-down": "pitch-down-semitone",
  "hf-action-octave-up": "pitch-up-octave",
  "hf-action-octave-down": "pitch-down-octave",
  "hf-action-print": "score-print",
};

describe("toolbarActionMap", () => {
  it("maps each hf-action id to the sandbox palette tool id", () => {
    for (const id of ALL_SANDBOX_TOOLBAR_ACTION_IDS) {
      expect(mapSandboxToolbarActionToToolId(id)).toBe(EXPECTED_TOOL_IDS[id]);
    }
  });

  it("covers every known toolbar plugin action id", () => {
    expect(ALL_SANDBOX_TOOLBAR_ACTION_IDS.length).toBe(
      Object.keys(EXPECTED_TOOL_IDS).length,
    );
  });
});
