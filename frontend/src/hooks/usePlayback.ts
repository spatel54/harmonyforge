"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EditableScore } from "@/lib/music/scoreTypes";
import {
  scoreToScheduledNotes,
  scheduledNotesToSeconds,
} from "@/lib/music/playbackUtils";

const BPM = 120;
/**
 * Default playback gain in dB (Iter2 §4): the participant reported the MIDI
 * output was "inaudible". Tone.js defaults to 0 dB but our Salamander-backed
 * sampler can still feel quiet against OS UI sounds; -6 is a comfortable
 * audible default without clipping on dense chords.
 */
const DEFAULT_VOLUME_DB = -6;
const VOLUME_STORAGE_KEY = "harmonyforge-playback-volume-db";

function loadStoredVolumeDb(): number {
  if (typeof window === "undefined") return DEFAULT_VOLUME_DB;
  try {
    const raw = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    if (raw == null) return DEFAULT_VOLUME_DB;
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return DEFAULT_VOLUME_DB;
    return Math.max(-48, Math.min(6, parsed));
  } catch {
    return DEFAULT_VOLUME_DB;
  }
}

/** Same destination gain as sandbox Riff playback (Iter2 §4). */
export function getPlaybackDestinationDb(): number {
  return loadStoredVolumeDb();
}

function saveVolumeDb(volumeDb: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VOLUME_STORAGE_KEY, String(volumeDb));
  } catch {
    // ignore
  }
}

export interface UsePlaybackOptions {
  score: EditableScore | null;
  bpm?: number;
  /** Optional RiffScore API ref — when available, delegates playback to RiffScore. */
  riffScoreApi?: import("riffscore").MusicEditorAPI | null;
}

export interface UsePlaybackReturn {
  play: () => void;
  pause: () => void;
  stop: () => void;
  isPlaying: boolean;
  canPlay: boolean;
  /** Current playback gain (dB). Persisted to localStorage. */
  volumeDb: number;
  setVolumeDb: (value: number) => void;
  /** Non-null when the last play failed — surface to user with a toast. */
  lastError: string | null;
  clearError: () => void;
  /** True once the browser AudioContext has been resumed (requires a user gesture). */
  audioUnlocked: boolean;
  /** Resume the AudioContext + fire a silent pre-roll so the first real note is audible. */
  unlockAudio: () => Promise<void>;
}

/**
 * Hook for audio playback of sheet music using Tone.js.
 * Must be triggered by user gesture (e.g. play button click) for Tone.start().
 */
export function usePlayback({
  score,
  bpm = BPM,
  riffScoreApi,
}: UsePlaybackOptions): UsePlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumeDb, setVolumeDbState] = useState<number>(() => loadStoredVolumeDb());
  const [lastError, setLastError] = useState<string | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const synthRef = useRef<import("tone").PolySynth | null>(null);
  const partRef = useRef<import("tone").Part | null>(null);
  const hasStartedRef = useRef(false);
  const endTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setVolumeDb = useCallback(async (value: number) => {
    const clamped = Math.max(-48, Math.min(6, value));
    setVolumeDbState(clamped);
    saveVolumeDb(clamped);
    try {
      const Tone = await import("tone");
      Tone.getDestination().volume.rampTo(clamped, 0.05);
    } catch {
      // Tone not ready yet; value will be applied on next play().
    }
  }, []);

  const clearError = useCallback(() => setLastError(null), []);

  /**
   * Warm the AudioContext on a user gesture (click). Fires a silent 20ms note
   * so subsequent playback calls do not hit the "Autoplay blocked" edge cases
   * seen in Safari + Firefox. Safe to call repeatedly.
   */
  const unlockAudio = useCallback(async () => {
    try {
      const Tone = await import("tone");
      await Tone.start();
      hasStartedRef.current = true;
      // Silent pre-roll: triggers the audio graph without producing audible sound.
      const warm = new Tone.Synth({ volume: -80 }).toDestination();
      warm.triggerAttackRelease("C4", 0.02);
      setTimeout(() => warm.dispose(), 40);
      Tone.getDestination().volume.rampTo(volumeDb, 0.05);
      setAudioUnlocked(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not unlock audio";
      setLastError(msg);
    }
  }, [volumeDb]);

  const dispose = useCallback(() => {
    if (endTimeoutRef.current) {
      clearTimeout(endTimeoutRef.current);
      endTimeoutRef.current = null;
    }
    partRef.current?.dispose();
    partRef.current = null;
    synthRef.current?.dispose();
    synthRef.current = null;
  }, []);

  const stop = useCallback(async () => {
    // Delegate to RiffScore if available
    if (riffScoreApi) {
      riffScoreApi.stop();
      setIsPlaying(false);
      return;
    }
    if (endTimeoutRef.current) {
      clearTimeout(endTimeoutRef.current);
      endTimeoutRef.current = null;
    }
    const Tone = await import("tone");
    try {
      Tone.getTransport().cancel(0);
      Tone.getTransport().stop();
      Tone.getTransport().seconds = 0;
    } catch (err) {
      console.warn("[harmonyforge] Transport stop failed", err);
    }
    partRef.current?.stop(0);
    setIsPlaying(false);
  }, [riffScoreApi]);

  const pause = useCallback(async () => {
    // Delegate to RiffScore if available
    if (riffScoreApi) {
      riffScoreApi.pause();
      setIsPlaying(false);
      return;
    }
    await stop();
  }, [stop, riffScoreApi]);

  const play = useCallback(async () => {
    if (!score || score.parts.length === 0) return;

    setLastError(null);

    // Delegate to RiffScore if available
    if (riffScoreApi) {
      try {
        // Ensure AudioContext is resumed and destination volume applied even
        // when RiffScore is driving playback — fixes Iter2 §4 inaudible audio.
        const Tone = await import("tone");
        if (!hasStartedRef.current) {
          await Tone.start();
          hasStartedRef.current = true;
        }
        Tone.getDestination().volume.rampTo(volumeDb, 0.05);
        await riffScoreApi.play();
        setIsPlaying(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Playback failed";
        console.warn("[harmonyforge] RiffScore playback failed", err);
        setLastError(msg);
        setIsPlaying(false);
      }
      return;
    }

    try {
      const Tone = await import("tone");

      if (!hasStartedRef.current) {
        await Tone.start();
        hasStartedRef.current = true;
      }

      // Apply current volume each play so a fresh AudioContext lands at the
      // user's stored level instead of Tone's 0 dB default.
      Tone.getDestination().volume.rampTo(volumeDb, 0.05);

      dispose();

      const events = scoreToScheduledNotes(score);
      const timed = scheduledNotesToSeconds(events, bpm);

      if (timed.length === 0) return;

      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.7,
          release: 0.3,
        },
      }).toDestination();

      const part = new Tone.Part(
        (time: number, ev: { pitch: string; duration: number }) => {
          try {
            synth.triggerAttackRelease(ev.pitch, ev.duration, time);
          } catch (err) {
            console.warn("[harmonyforge] Dropped event on trigger", err, ev);
          }
        },
        timed.map((ev) => ({ time: ev.time, pitch: ev.pitch, duration: ev.duration }))
      );

      const totalDuration = timed.length
        ? Math.max(...timed.map((e) => e.time + e.duration))
        : 0;

      part.start(0);
      Tone.getTransport().seconds = 0;
      try {
        Tone.getTransport().start();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transport failed to start";
        console.warn("[harmonyforge] Transport.start failed", err);
        part.dispose();
        synth.dispose();
        setLastError(msg);
        setIsPlaying(false);
        return;
      }

      partRef.current = part;
      synthRef.current = synth;
      setIsPlaying(true);

      if (endTimeoutRef.current) clearTimeout(endTimeoutRef.current);
      endTimeoutRef.current = setTimeout(() => {
        endTimeoutRef.current = null;
        void stop();
      }, (totalDuration + 0.5) * 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Playback failed to start";
      console.warn("[harmonyforge] Playback error", err);
      setLastError(msg);
      dispose();
      setIsPlaying(false);
    }
  }, [score, bpm, dispose, stop, riffScoreApi, volumeDb]);

  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);

  const canPlay = Boolean(
    score &&
      score.parts.some((part) =>
        part.measures.some((measure) => measure.notes.some((note) => !note.isRest))
      )
  );

  return {
    play,
    pause,
    stop,
    isPlaying,
    canPlay,
    volumeDb,
    setVolumeDb,
    lastError,
    clearError,
    audioUnlocked,
    unlockAudio,
  };
}
