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

function writeWavPcm16Stereo(
  sampleRate: number,
  pcm: Int16Array,
): ArrayBuffer {
  const dataSize = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buffer);
  const writeStr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  v.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 2, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 4, true);
  v.setUint16(32, 4, true);
  v.setUint16(34, 16, true);
  writeStr(36, "data");
  v.setUint32(40, dataSize, true);
  for (let i = 0; i < pcm.length; i++) {
    v.setInt16(44 + i * 2, pcm[i]!, true);
  }
  return buffer;
}

/** ~0.25s of silence for empty scores */
function silentWav(sampleRate: number): ArrayBuffer {
  const n = Math.floor(sampleRate * 0.25);
  const pcm = new Int16Array(n * 2);
  return writeWavPcm16Stereo(sampleRate, pcm);
}

/**
 * Renders all non-rest notes through a PolySynth (same character as usePlayback fallback).
 */
export async function scoreToWavBuffer(score: EditableScore): Promise<ArrayBuffer> {
  const bpm = score.bpm ?? DEFAULT_BPM;
  const events = scoreToScheduledNotes(score);
  const timed = scheduledNotesToSeconds(events, bpm);
  if (timed.length === 0) {
    return silentWav(44100);
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
      synth.triggerAttackRelease(ev.pitch, ev.duration, ev.time);
    }
  }, totalSec);

  const buffer = toneAudioBuffer.get();
  if (!buffer) {
    return silentWav(44100);
  }

  const sr = buffer.sampleRate;
  const ch0 = buffer.getChannelData(0);
  const ch1 =
    buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : ch0;
  const pcm = interleaveChannels(ch0, ch1);
  return writeWavPcm16Stereo(sr, pcm);
}
