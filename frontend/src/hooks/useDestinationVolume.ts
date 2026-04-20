"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Shared playback gain hook (Iter2 §4 — addresses "inaudible MIDI output").
 *
 * RiffScore's internal sampler and HarmonyForge's Tone.js playback both write
 * to a single `Tone.getDestination()`. Setting the destination volume once
 * here therefore covers both paths without needing to plumb through every
 * player. Value is persisted in localStorage and clamped to [-48, 6] dB.
 */
const DEFAULT_VOLUME_DB = -6;
const STORAGE_KEY = "harmonyforge-playback-volume-db";

function loadStoredVolumeDb(): number {
  if (typeof window === "undefined") return DEFAULT_VOLUME_DB;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null) return DEFAULT_VOLUME_DB;
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return DEFAULT_VOLUME_DB;
    return Math.max(-48, Math.min(6, parsed));
  } catch {
    return DEFAULT_VOLUME_DB;
  }
}

function saveVolumeDb(volumeDb: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(volumeDb));
  } catch {
    // ignore quota / private-mode errors
  }
}

async function applyToDestination(volumeDb: number): Promise<void> {
  try {
    const Tone = await import("tone");
    Tone.getDestination().volume.rampTo(volumeDb, 0.05);
  } catch {
    // Tone not ready yet — next call will re-apply.
  }
}

export interface UseDestinationVolumeReturn {
  volumeDb: number;
  setVolumeDb: (value: number) => void;
}

export function useDestinationVolume(): UseDestinationVolumeReturn {
  // Lazy initializer reads localStorage once — avoids a cascading setState in
  // useEffect that React's lint rule (set-state-in-effect) rightly flags.
  const [volumeDb, setVolumeDbState] = useState<number>(() => loadStoredVolumeDb());

  useEffect(() => {
    void applyToDestination(volumeDb);
    // Only apply once on mount; updates flow through `setVolumeDb` below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setVolumeDb = useCallback((value: number) => {
    const clamped = Math.max(-48, Math.min(6, value));
    setVolumeDbState(clamped);
    saveVolumeDb(clamped);
    void applyToDestination(clamped);
  }, []);

  return { volumeDb, setVolumeDb };
}

export const DEFAULT_PLAYBACK_VOLUME_DB = DEFAULT_VOLUME_DB;
