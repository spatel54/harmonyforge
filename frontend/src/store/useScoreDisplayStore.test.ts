import { beforeEach, describe, expect, it } from "vitest";

import { useScoreDisplayStore } from "./useScoreDisplayStore";

describe("useScoreDisplayStore", () => {
  beforeEach(() => {
    useScoreDisplayStore.setState({ showNoteNameLabels: false });
  });

  it("defaults note name labels off", () => {
    expect(useScoreDisplayStore.getState().showNoteNameLabels).toBe(false);
  });

  it("toggles showNoteNameLabels", () => {
    useScoreDisplayStore.getState().setShowNoteNameLabels(true);
    expect(useScoreDisplayStore.getState().showNoteNameLabels).toBe(true);
    useScoreDisplayStore.getState().setShowNoteNameLabels(false);
    expect(useScoreDisplayStore.getState().showNoteNameLabels).toBe(false);
  });
});
