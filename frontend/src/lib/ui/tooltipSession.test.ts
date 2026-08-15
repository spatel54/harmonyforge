import { beginTooltipSession, isTooltipSessionActive, endTooltipSession } from "./tooltipSession";

describe("tooltipSession", () => {
  beforeEach(() => {
    endTooltipSession();
  });

  it("starts inactive", () => {
    expect(isTooltipSessionActive()).toBe(false);
  });

  it("activates after beginTooltipSession", () => {
    beginTooltipSession();
    expect(isTooltipSessionActive()).toBe(true);
  });
});
