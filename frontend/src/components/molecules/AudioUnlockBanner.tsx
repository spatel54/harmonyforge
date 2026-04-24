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
      className="hf-banner-animate hf-print-hide flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-2.5 text-[12px] leading-snug border-b"
      style={{
        backgroundColor: "color-mix(in srgb, var(--hf-surface) 12%, var(--hf-bg))",
        color: "var(--hf-text-primary)",
        borderColor: "color-mix(in srgb, var(--hf-detail) 50%, transparent)",
      }}
      role="status"
    >
      <span className="min-w-0">
        Browsers keep audio quiet until you interact with the page. Tap{" "}
        <strong>Enable audio</strong> so the first Play is not silent.
      </span>
      <div className="flex flex-wrap gap-2 shrink-0">
        <button
          type="button"
          onClick={unlock}
          className="hf-pressable font-mono text-[11px] rounded-lg px-3 py-1.5 shadow-sm hover:brightness-110 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-bg)]"
          style={{ backgroundColor: "var(--hf-surface)", color: "white" }}
        >
          Enable audio
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="hf-pressable font-mono text-[11px] rounded-lg px-3 py-1.5 border border-[var(--hf-detail)] bg-[var(--hf-panel-bg)]/80 shadow-sm hover:bg-[color-mix(in_srgb,var(--hf-surface)_10%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-bg)]"
          style={{ color: "var(--hf-text-primary)" }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
