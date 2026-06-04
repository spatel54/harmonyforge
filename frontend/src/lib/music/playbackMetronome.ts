/**
 * Quarter-note metronome on Tone.Transport, used during RiffScore score playback.
 * Installed via {@link installPlaybackMetronomeBridge} for the riffscore patch.
 */

export type PlaybackMetronomeOptions = {
  bpm: number;
  /** Absolute timeline seconds where playback begins. */
  startTimeOffset: number;
  /** Absolute timeline end (seconds). */
  totalEnd: number;
  timeSignature?: string;
};

type ToneModule = typeof import("tone");

type MetronomeGlobals = typeof globalThis & {
  __HF_SCHEDULE_METRONOME?: (
    Tone: ToneModule,
    opts: PlaybackMetronomeOptions,
  ) => void;
  __HF_CLEAR_METRONOME?: (Tone: ToneModule) => void;
};

/** Synth gain (still scales with Tone destination / header volume slider). */
export const METRONOME_DOWNBEAT_DB = -8;
export const METRONOME_BEAT_DB = -12;

const scheduledTransportIds: number[] = [];
let downbeatClick: import("tone").MembraneSynth | null = null;
let beatClick: import("tone").MembraneSynth | null = null;

/** Beats per notated measure for click accents (4/4 → 4, 3/4 → 3). */
export function beatsPerMeasureFromTimeSignature(timeSignature?: string): number {
  const m = timeSignature?.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!m) return 4;
  const num = Number.parseInt(m[1] ?? "4", 10);
  return Number.isFinite(num) && num > 0 ? num : 4;
}

function ensureClickSynths(Tone: ToneModule): void {
  if (!downbeatClick) {
    downbeatClick = new Tone.MembraneSynth({
      pitchDecay: 0.001,
      octaves: 2.5,
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.06 },
    }).toDestination();
    downbeatClick.volume.value = METRONOME_DOWNBEAT_DB;
  }
  if (!beatClick) {
    beatClick = new Tone.MembraneSynth({
      pitchDecay: 0.001,
      octaves: 1,
      envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.04 },
    }).toDestination();
    beatClick.volume.value = METRONOME_BEAT_DB;
  }
}

export function clearPlaybackMetronome(Tone?: ToneModule): void {
  if (Tone) {
    for (const id of scheduledTransportIds) {
      Tone.Transport.clear(id);
    }
  }
  scheduledTransportIds.length = 0;
}

/**
 * Schedule click sounds on the shared Transport (transport t=0 is `startTimeOffset`
 * in score time). Downbeats use a louder, lower click.
 */
export function schedulePlaybackMetronome(
  Tone: ToneModule,
  opts: PlaybackMetronomeOptions,
): void {
  const bpm = Math.max(20, Math.min(300, opts.bpm));
  const startTimeOffset = Math.max(0, opts.startTimeOffset);
  const totalEnd = Math.max(0, opts.totalEnd);
  const beatsPerMeasure = beatsPerMeasureFromTimeSignature(opts.timeSignature);

  clearPlaybackMetronome(Tone);
  if (totalEnd <= startTimeOffset) return;

  ensureClickSynths(Tone);
  const secondsPerBeat = 60 / bpm;

  let beatIndex = 0;
  for (let absTime = 0; absTime <= totalEnd + 1e-6; absTime += secondsPerBeat, beatIndex++) {
    if (absTime + 1e-6 < startTimeOffset) continue;
    const transportTime = absTime - startTimeOffset;
    const isDownbeat = beatIndex % beatsPerMeasure === 0;
    const synth = isDownbeat ? downbeatClick! : beatClick!;
    const pitch = isDownbeat ? "C2" : "G3";
    const id = Tone.Transport.schedule((time) => {
      synth.triggerAttackRelease(pitch, 0.04, time);
    }, transportTime);
    scheduledTransportIds.push(id);
  }
}

export function installPlaybackMetronomeBridge(): void {
  const g = globalThis as MetronomeGlobals;
  g.__HF_SCHEDULE_METRONOME = (Tone, opts) => schedulePlaybackMetronome(Tone, opts);
  g.__HF_CLEAR_METRONOME = (Tone) => clearPlaybackMetronome(Tone);
}

export function isPlaybackMetronomeBridgeInstalled(): boolean {
  return Boolean((globalThis as MetronomeGlobals).__HF_SCHEDULE_METRONOME);
}
