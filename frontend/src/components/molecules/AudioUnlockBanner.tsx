"use client";

import React from "react";

/**
 * Browser autoplay policies pause the Web Audio API until the user interacts
 * with the page. On the Sandbox that means the very first Play click may
 * produce no sound (or a corrupt first note). We detect a suspended
 * AudioContext on mount and show a dismissible banner offering to unlock it.
 *
 * Iter2 §4 — MIDI playback stability.
 */
export function AudioUnlockBanner() {
  const [showBanner, setShowBanner] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (dismissed) return;
    if (typeof window === "undefined") return;
    const Ctor = window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    // Probe the global AudioContext state via a throwaway instance; close it right
    // away so we do not leak a warm context.
    try {
      const probe = new Ctor();
      if (probe.state === "suspended") setShowBanner(true);
      probe.close().catch(() => void 0);
    } catch {
      // Some browsers throw when creating AC without a gesture — fail closed.
      setShowBanner(true);
    }
  }, [dismissed]);

  const unlock = React.useCallback(async () => {
    try {
      const Tone = await import("tone");
      await Tone.start();
      // Silent pre-roll so the first audible note does not clip on some devices.
      const warm = new Tone.Synth({ volume: -80 }).toDestination();
      warm.triggerAttackRelease("C4", 0.02);
      setTimeout(() => warm.dispose(), 40);
    } catch {
      // If Tone fails, at least hide the banner so it does not keep nagging.
    } finally {
      setShowBanner(false);
      setDismissed(true);
    }
  }, []);

  if (!showBanner || dismissed) return null;

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-2 text-[12px]"
      style={{
        backgroundColor: "color-mix(in srgb, var(--hf-surface) 15%, transparent)",
        color: "var(--hf-text-primary)",
        borderBottom: "1px solid var(--hf-detail)",
      }}
      role="status"
    >
      <span>
        Browsers keep audio muted until you interact. Use{" "}
        <strong>Enable audio</strong> so the first Play isn’t silent.
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={unlock}
          className="font-mono text-[11px] rounded px-2 py-1"
          style={{ backgroundColor: "var(--hf-surface)", color: "white" }}
        >
          Enable audio
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="font-mono text-[11px] rounded px-2 py-1 border"
          style={{ borderColor: "var(--hf-detail)" }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
