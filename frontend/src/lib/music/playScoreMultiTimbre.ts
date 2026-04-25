/**
 * Plays an EditableScore with one Tone.js voice per coarse timbre group (see playbackTimbre.ts).
 * Used when the user opts out of RiffScore's single piano sampler for preview (Iteration 7).
 */
import type { SynthOptions } from "tone";
import type { RecursivePartial } from "tone/build/esm/core/util/Interface";
import type { EditableScore } from "./scoreTypes";
import { partNameToTimbreKind, type TimbreKind } from "./playbackTimbre";
import { scoreToScheduledPartNotes, scheduledPartNotesToSeconds } from "./playbackPartNotes";

const BPM_FALLBACK = 72;

type ToneModule = typeof import("tone");
type PolySynthT = import("tone").PolySynth<import("tone").Synth<import("tone").SynthOptions>>;

function makeSynthForKind(Tone: ToneModule, kind: TimbreKind): PolySynthT {
  const base = (opts: RecursivePartial<SynthOptions>) =>
    new Tone.PolySynth(Tone.Synth, opts).toDestination() as unknown as PolySynthT;

  switch (kind) {
    case "strings":
      return base({
        oscillator: { type: "triangle" } as const,
        envelope: { attack: 0.04, decay: 0.2, sustain: 0.55, release: 0.35 } as const,
      });
    case "winds":
      return base({
        oscillator: { type: "sine" } as const,
        envelope: { attack: 0.02, decay: 0.15, sustain: 0.6, release: 0.25 } as const,
      });
    case "brass":
      return base({
        oscillator: { type: "sawtooth" } as const,
        envelope: { attack: 0.01, decay: 0.12, sustain: 0.5, release: 0.2 } as const,
      });
    case "bass":
      return base({
        oscillator: { type: "square" } as const,
        envelope: { attack: 0.02, decay: 0.22, sustain: 0.42, release: 0.42 } as const,
      });
    case "keyboard":
      return base({
        oscillator: { type: "triangle" } as const,
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.65, release: 0.25 } as const,
      });
    default:
      return base({
        oscillator: { type: "triangle" } as const,
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 } as const,
      });
  }
}

export type MultiTimbrePlayHandle = {
  stop: () => void;
};

/**
 * Build grouped synths and schedule all notes. Caller must have called Tone.start() on a user gesture.
 */
export async function playScoreMultiTimbre(
  score: EditableScore,
  options?: { volumeDb?: number; onComplete?: () => void },
): Promise<MultiTimbrePlayHandle> {
  const Tone = await import("tone");
  const bpm = score.bpm ?? BPM_FALLBACK;
  const partEvents = scoreToScheduledPartNotes(score);
  const timed = scheduledPartNotesToSeconds(partEvents, bpm);
  if (timed.length === 0) {
    options?.onComplete?.();
    return { stop: () => undefined };
  }

  const vol = options?.volumeDb ?? -6;
  Tone.getDestination().volume.rampTo(vol, 0.05);

  const synths: Partial<Record<TimbreKind, PolySynthT>> = {};
  const byKind: TimbreKind[] = [
    "strings",
    "winds",
    "brass",
    "bass",
    "keyboard",
    "other",
  ];
  for (const k of byKind) {
    synths[k] = makeSynthForKind(Tone, k);
  }

  const part = new Tone.Part(
    (time, ev: { pitch: string; duration: number; partName: string }) => {
      const kind = partNameToTimbreKind(ev.partName);
      const syn = synths[kind] ?? synths.other!;
      try {
        syn.triggerAttackRelease(ev.pitch, ev.duration, time);
      } catch {
        /* drop bad pitch */
      }
    },
    timed.map((e) => ({
      time: e.time,
      duration: e.duration,
      pitch: e.pitch,
      partName: e.partName,
    })),
  );

  const total = Math.max(...timed.map((e) => e.time + e.duration), 0) + 0.4;
  part.start(0);
  Tone.getTransport().seconds = 0;
  await Tone.getTransport().start();

  const dispose = () => {
    try {
      part.stop(0);
      part.dispose();
    } catch {
      /* ignore */
    }
    for (const k of byKind) {
      try {
        synths[k]?.dispose();
      } catch {
        /* ignore */
      }
    }
    try {
      Tone.getTransport().stop(0);
    } catch {
      /* ignore */
    }
  };

  const onComplete = options?.onComplete;
  const endT = window.setTimeout(() => {
    dispose();
    onComplete?.();
  }, total * 1000);

  return {
    stop: () => {
      clearTimeout(endT);
      dispose();
    },
  };
}
