/**
 * Offline-render score to stereo WAV (PCM 16-bit) using Tone.js.
 */

import type { EditableScore } from "./scoreTypes";
import { scoreToScheduledNotes, scheduledNotesToSeconds } from "./playbackUtils";

const DEFAULT_BPM = 120;

function interleaveChannels(
  ch0: Float32Array,
  ch1: Float32Array,
): Int16Array {
  const n = ch0.length;
  const out = new Int16Array(n * 2);
  for (let i = 0; i < n; i++) {
    const s0 = Math.max(-1, Math.min(1, ch0[i] ?? 0));
    const s1 = Math.max(-1, Math.min(1, ch1[i] ?? 0));
    out[i * 2] = s0 < 0 ? s0 * 0x8000 : s0 * 0x7fff;
    out[i * 2 + 1] = s1 < 0 ? s1 * 0x8000 : s1 * 0x7fff;
  }
  return out;
}

function buildListInfoIsftChunk(software: string): Uint8Array {
  const sw = new TextEncoder().encode(software);
  const swPadded = sw.length % 2 === 1 ? sw.length + 1 : sw.length;
  const isftPayload = 4 + swPadded;
  const infoBody = 4 + isftPayload;
  const listPayload = 4 + infoBody;
  const chunk = new Uint8Array(8 + listPayload);
  const dv = new DataView(chunk.buffer);
  chunk.set([0x4c, 0x49, 0x53, 0x54], 0);
  dv.setUint32(4, listPayload, true);
  chunk.set([0x49, 0x4e, 0x46, 0x4f], 8);
  chunk.set([0x49, 0x53, 0x46, 0x54], 12);
  dv.setUint32(16, sw.length, true);
  chunk.set(sw, 20);
  return chunk;
}

function writeWavPcm16Stereo(
  sampleRate: number,
  pcm: Int16Array,
  options?: { softwareTag?: string },
): ArrayBuffer {
  const dataSize = pcm.length * 2;
  const infoChunk = options?.softwareTag
    ? buildListInfoIsftChunk(options.softwareTag)
    : null;
  const infoSize = infoChunk?.length ?? 0;
  const riffSize = 36 + infoSize + dataSize;
  const buffer = new ArrayBuffer(44 + infoSize + dataSize);
  const v = new DataView(buffer);
  const writeStr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  v.setUint32(4, riffSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 2, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 4, true);
  v.setUint16(32, 4, true);
  v.setUint16(34, 16, true);
  let dataOffset = 36;
  if (infoChunk) {
    new Uint8Array(buffer).set(infoChunk, dataOffset);
    dataOffset += infoSize;
  }
  writeStr(dataOffset, "data");
  v.setUint32(dataOffset + 4, dataSize, true);
  for (let i = 0; i < pcm.length; i++) {
    v.setInt16(dataOffset + 8 + i * 2, pcm[i]!, true);
  }
  return buffer;
}

export type ScoreToWavOptions = {
  /** RIFF LIST/INFO ISFT chunk (subtle attribution in file metadata). */
  softwareTag?: string;
};

/** ~0.25s of silence for empty scores */
function silentWav(
  sampleRate: number,
  options?: ScoreToWavOptions,
): ArrayBuffer {
  const n = Math.floor(sampleRate * 0.25);
  const pcm = new Int16Array(n * 2);
  return writeWavPcm16Stereo(sampleRate, pcm, options);
}

/**
 * Renders all non-rest notes through a PolySynth (same character as usePlayback fallback).
 */
export async function scoreToWavBuffer(
  score: EditableScore,
  options?: ScoreToWavOptions,
): Promise<ArrayBuffer> {
  const bpm = score.bpm ?? DEFAULT_BPM;
  const events = scoreToScheduledNotes(score);
  const timed = scheduledNotesToSeconds(events, bpm);
  if (timed.length === 0) {
    return silentWav(44100, options);
  }

  const totalSec =
    Math.max(...timed.map((e) => e.time + e.duration), 0) + 0.6;
  const Tone = await import("tone");

  const toneAudioBuffer = await Tone.Offline(() => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.7,
        release: 0.3,
      },
    }).toDestination();

    for (const ev of timed) {
      const vel = ev.velocity !== undefined ? ev.velocity / 127 : undefined;
      synth.triggerAttackRelease(ev.pitch, ev.duration, ev.time, vel);
    }
  }, totalSec);

  const buffer = toneAudioBuffer.get();
  if (!buffer) {
    return silentWav(44100, options);
  }

  const sr = buffer.sampleRate;
  const ch0 = buffer.getChannelData(0);
  const ch1 =
    buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : ch0;
  const pcm = interleaveChannels(ch0, ch1);
  return writeWavPcm16Stereo(sr, pcm, options);
}
