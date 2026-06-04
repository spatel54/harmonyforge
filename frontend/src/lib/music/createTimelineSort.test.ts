import { describe, expect, it } from "vitest";
import { sortTimelineRawEvents } from "./createTimelineSort";

describe("sortTimelineRawEvents", () => {
  it("orders by time before pitch (16th cross-voice case)", () => {
    const raw = [
      { time: 0.25, pitch: "C4", staffIndex: 0 },
      { time: 0, pitch: "E4", staffIndex: 1 },
      { time: 0, pitch: "C4", staffIndex: 0 },
      { time: 0, pitch: "G4", staffIndex: 2 },
    ];
    const sorted = sortTimelineRawEvents(raw);
    expect(sorted.map((e) => e.time)).toEqual([0, 0, 0, 0.25]);
    expect(sorted[0]!.pitch).toBe("C4");
    expect(sorted[1]!.pitch).toBe("E4");
    expect(sorted[3]!.pitch).toBe("C4");
    expect(sorted[3]!.time).toBe(0.25);
  });

  it("places rests before notes at the same onset", () => {
    const raw = [
      { time: 0.5, pitch: "G4", isRest: false },
      { time: 0.5, pitch: null, isRest: true },
    ];
    const sorted = sortTimelineRawEvents(raw);
    expect(sorted[0]!.isRest).toBe(true);
    expect(sorted[1]!.pitch).toBe("G4");
  });
});
