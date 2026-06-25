import { describe, expect, it } from "vitest";
import {
  METRONOME_BEAT_DB,
  METRONOME_DOWNBEAT_DB,
  beatsPerMeasureFromTimeSignature,
  clearPlaybackMetronome,
  schedulePlaybackMetronome,
} from "./playbackMetronome";

describe("metronome gain constants", () => {
  it("exposes louder downbeat than weak beats", () => {
    expect(METRONOME_DOWNBEAT_DB).toBeGreaterThan(METRONOME_BEAT_DB);
    expect(METRONOME_DOWNBEAT_DB).toBe(-8);
    expect(METRONOME_BEAT_DB).toBe(-12);
  });
});

describe("beatsPerMeasureFromTimeSignature", () => {
  it("parses common meters", () => {
    expect(beatsPerMeasureFromTimeSignature("4/4")).toBe(4);
    expect(beatsPerMeasureFromTimeSignature("3/4")).toBe(3);
    expect(beatsPerMeasureFromTimeSignature("2/2")).toBe(2);
  });

  it("defaults to 4 when missing", () => {
    expect(beatsPerMeasureFromTimeSignature(undefined)).toBe(4);
  });
});

describe("schedulePlaybackMetronome", () => {
  it("schedules one click per beat in the play window", async () => {
    const cleared: number[] = [];
    const scheduled: Array<{ time: number }> = [];

    const fakeTransport = {
      schedule: (fn: (time: number) => void, time: number) => {
        scheduled.push({ time });
        fn(time);
        return scheduled.length;
      },
      clear: (id: number) => {
        cleared.push(id);
      },
    };

    const fakeTone = {
      Transport: fakeTransport,
      MembraneSynth: class {
        volume = { value: 0 };
        toDestination() {
          return this;
        }
        triggerAttackRelease() {}
      },
    };

    schedulePlaybackMetronome(fakeTone as never, {
      bpm: 120,
      startTimeOffset: 0,
      totalEnd: 2,
      timeSignature: "4/4",
    });

    // 120 BPM → 0.5s per beat → beats at 0, 0.5, 1, 1.5, 2
    expect(scheduled.length).toBe(5);

    clearPlaybackMetronome(fakeTone as never);
    expect(cleared.length).toBe(5);
  });

  it("offsets clicks when playback starts mid-score", async () => {
    const scheduled: number[] = [];
    const fakeTransport = {
      schedule: (_fn: (time: number) => void, time: number) => {
        scheduled.push(time);
        return scheduled.length;
      },
      clear: () => {},
    };
    const fakeTone = {
      Transport: fakeTransport,
      MembraneSynth: class {
        volume = { value: 0 };
        toDestination() {
          return this;
        }
        triggerAttackRelease() {}
      },
    };

    schedulePlaybackMetronome(fakeTone as never, {
      bpm: 60,
      startTimeOffset: 1,
      totalEnd: 3,
    });

    // 60 BPM = 1s/beat; absolute beats at 0,1,2,3 → transport -1 gives 0,1,2
    expect(scheduled).toEqual([0, 1, 2]);
  });

  it("keeps strictly increasing transport times (avoids Tone duplicate-time errors)", () => {
    const scheduled: number[] = [];
    const fakeTransport = {
      schedule: (_fn: (time: number) => void, time: number) => {
        scheduled.push(time);
        return scheduled.length;
      },
      clear: () => {},
    };
    const fakeTone = {
      Transport: fakeTransport,
      MembraneSynth: class {
        volume = { value: 0 };
        toDestination() {
          return this;
        }
        triggerAttackRelease() {}
      },
    };

    schedulePlaybackMetronome(fakeTone as never, {
      bpm: 90,
      startTimeOffset: 0.001,
      totalEnd: 8,
      timeSignature: "4/4",
    });

    for (let i = 1; i < scheduled.length; i++) {
      expect(scheduled[i]).toBeGreaterThan(scheduled[i - 1]!);
    }
  });
});
