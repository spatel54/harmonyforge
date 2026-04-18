/**
 * Serialize EditableScore → Standard MIDI File (type 1), one track per part + meta track 0.
 */

import type { EditableScore } from "./scoreTypes";
import { parseBeatsPerMeasure, noteDurationInBeats } from "./playbackUtils";
import { pitchStringToMidi } from "./pitchMidi";

const PPQ = 480;
const DEFAULT_BPM = 120;

interface AbsEv {
  tick: number;
  /** note off before note on at same tick for cleaner deltas */
  kind: "off" | "on";
  ch: number;
  note: number;
  vel: number;
}

function pushVLQ(out: number[], n: number): void {
  if (n < 0) n = 0;
  const bytes: number[] = [];
  bytes.push(n & 0x7f);
  let v = n >> 7;
  while (v > 0) {
    bytes.push((v & 0x7f) | 0x80);
    v >>= 7;
  }
  for (let i = bytes.length - 1; i >= 0; i--) out.push(bytes[i]!);
}

function buildTrackChunk(events: number[]): Uint8Array {
  const len = events.length;
  const buf = new Uint8Array(8 + len);
  const dv = new DataView(buf.buffer);
  buf.set([0x4d, 0x54, 0x72, 0x6b], 0);
  dv.setUint32(4, len, false);
  buf.set(events, 8);
  return buf;
}

function metaSetTempo(bpm: number): number[] {
  const usPerQuarter = Math.round(60_000_000 / Math.max(1, bpm));
  const out: number[] = [0x00, 0xff, 0x51, 0x03];
  out.push((usPerQuarter >> 16) & 0xff, (usPerQuarter >> 8) & 0xff, usPerQuarter & 0xff);
  return out;
}

function endOfTrack(): number[] {
  return [0x00, 0xff, 0x2f, 0x00];
}

function collectPartNoteEvents(
  score: EditableScore,
  partIndex: number,
  channel: number,
  beatsPerMeasureDefault: number,
): AbsEv[] {
  const part = score.parts[partIndex];
  if (!part) return [];
  const out: AbsEv[] = [];
  let partBeatCursor = 0;

  for (const measure of part.measures) {
    const measureBeats = parseBeatsPerMeasure(measure.timeSignature, beatsPerMeasureDefault);
    const measureStartBeat = partBeatCursor;
    let currentBeat = measureStartBeat;

    for (const note of measure.notes) {
      const dur = noteDurationInBeats(note);
      const midi = !note.isRest ? pitchStringToMidi(note.pitch) : null;
      if (midi !== null) {
        const startTick = Math.round(currentBeat * PPQ);
        const endTick = Math.round((currentBeat + dur) * PPQ);
        out.push({ tick: endTick, kind: "off", ch: channel, note: midi, vel: 0 });
        out.push({ tick: startTick, kind: "on", ch: channel, note: midi, vel: 100 });
      }
      currentBeat += dur;
    }
    partBeatCursor = Math.max(measureStartBeat + measureBeats, currentBeat);
  }

  return out;
}

function absEventsToTrackBytes(events: AbsEv[]): number[] {
  const sorted = [...events].sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    if (a.kind !== b.kind) return a.kind === "off" ? -1 : 1;
    return 0;
  });
  const bytes: number[] = [];
  let prevTick = 0;
  for (const ev of sorted) {
    const delta = ev.tick - prevTick;
    prevTick = ev.tick;
    pushVLQ(bytes, delta);
    if (ev.kind === "on") {
      bytes.push(0x90 | ev.ch, ev.note, ev.vel);
    } else {
      bytes.push(0x80 | ev.ch, ev.note, 0);
    }
  }
  bytes.push(...endOfTrack());
  return bytes;
}

/**
 * Build a Type 1 SMF: track 0 = tempo; tracks 1..N = score.parts (channels 0..min(15,N-1)).
 */
export function scoreToMidiBuffer(score: EditableScore): Uint8Array {
  const bpm = score.bpm ?? DEFAULT_BPM;
  const beatsDefault = 4;

  const metaBytes: number[] = [];
  metaBytes.push(...metaSetTempo(bpm));
  metaBytes.push(...endOfTrack());
  const metaChunk = buildTrackChunk(metaBytes);

  const trackChunks: Uint8Array[] = [metaChunk];

  for (let p = 0; p < score.parts.length; p++) {
    const ch = Math.min(p, 15);
    const abs = collectPartNoteEvents(score, p, ch, beatsDefault);
    const trk = buildTrackChunk(absEventsToTrackBytes(abs));
    trackChunks.push(trk);
  }

  const nTracks = trackChunks.length;
  const header = new Uint8Array(14);
  const h = new DataView(header.buffer);
  header.set([0x4d, 0x54, 0x68, 0x64], 0);
  h.setUint32(4, 6, false);
  h.setUint16(8, 1, false);
  h.setUint16(10, nTracks, false);
  h.setUint16(12, PPQ, false);

  let total = header.length;
  for (const c of trackChunks) total += c.length;
  const out = new Uint8Array(total);
  out.set(header, 0);
  let o = header.length;
  for (const c of trackChunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}
