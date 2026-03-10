"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EditableScore } from "@/lib/music/scoreTypes";
import {
  scoreToScheduledNotes,
  scheduledNotesToSeconds,
} from "@/lib/music/playbackUtils";

const BPM = 120;

export interface UsePlaybackOptions {
  score: EditableScore | null;
  bpm?: number;
}

export interface UsePlaybackReturn {
  play: () => void;
  pause: () => void;
  stop: () => void;
  isPlaying: boolean;
  canPlay: boolean;
}

/**
 * Hook for audio playback of sheet music using Tone.js.
 * Must be triggered by user gesture (e.g. play button click) for Tone.start().
 */
export function usePlayback({
  score,
  bpm = BPM,
}: UsePlaybackOptions): UsePlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<import("tone").Synth | null>(null);
  const partRef = useRef<import("tone").Part | null>(null);
  const hasStartedRef = useRef(false);
  const endTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (endTimeoutRef.current) {
      clearTimeout(endTimeoutRef.current);
      endTimeoutRef.current = null;
    }
    const Tone = await import("tone");
    Tone.getTransport().stop();
    Tone.getTransport().seconds = 0;
    partRef.current?.stop(0);
    setIsPlaying(false);
  }, []);

  const pause = useCallback(async () => {
    await stop();
  }, [stop]);

  const play = useCallback(async () => {
    if (!score || score.parts.length === 0) return;

    const Tone = await import("tone");

    if (!hasStartedRef.current) {
      await Tone.start();
      hasStartedRef.current = true;
    }

    dispose();

    const events = scoreToScheduledNotes(score);
    const timed = scheduledNotesToSeconds(events, bpm);

    if (timed.length === 0) return;

    const synth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.7,
        release: 0.3,
      },
    }).toDestination();

    const part = new Tone.Part(
      (time: number, ev: { pitch: string; duration: number }) => {
        synth.triggerAttackRelease(ev.pitch, ev.duration, time);
      },
      timed.map((ev) => ({ time: ev.time, pitch: ev.pitch, duration: ev.duration }))
    );

    const totalDuration = timed.length
      ? Math.max(...timed.map((e) => e.time + e.duration))
      : 0;

    part.start(0);
    Tone.getTransport().seconds = 0;
    Tone.getTransport().start();

    partRef.current = part;
    synthRef.current = synth;
    setIsPlaying(true);

    if (endTimeoutRef.current) clearTimeout(endTimeoutRef.current);
    endTimeoutRef.current = setTimeout(() => {
      endTimeoutRef.current = null;
      stop();
    }, (totalDuration + 0.5) * 1000);
  }, [score, bpm, dispose, stop]);

  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);

  return {
    play,
    pause,
    stop,
    isPlaying,
    canPlay: Boolean(score && score.parts.length > 0),
  };
}
