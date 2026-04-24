"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const GLYPHS = ["♪", "♫", "♬", "♩", "𝄞"] as const;

type TrailNote = {
  id: string;
  x: number;
  y: number;
  glyph: (typeof GLYPHS)[number];
  driftX: number;
  driftY: number;
  rot: number;
};

const MAX_NOTES = 36;
const MIN_SPAWN_MS = 72;
const MIN_MOVE_PX = 10;
let idSeq = 0;

function pickGlyph(): (typeof GLYPHS)[number] {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!;
}

/**
 * Playground-only: gentle trail of floating note symbols that follow the pointer.
 * Off when `prefers-reduced-motion` or when the primary pointer is not fine (e.g. touch-first).
 */
export function PlaygroundCursorTrail() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [trailOn, setTrailOn] = useState(false);
  const [notes, setNotes] = useState<TrailNote[]>([]);
  const lastSpawnRef = useRef({ t: 0, cx: 0, cy: 0 });
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ clientX: number; clientY: number } | null>(null);

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");

    const sync = () => {
      setTrailOn(!reduceMotion.matches && finePointer.matches);
    };
    sync();

    reduceMotion.addEventListener("change", sync);
    finePointer.addEventListener("change", sync);
    return () => {
      reduceMotion.removeEventListener("change", sync);
      finePointer.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!trailOn) return;

    const trySpawn = (clientX: number, clientY: number) => {
      const host = hostRef.current;
      const root = host?.parentElement;
      if (!host || !root) return;

      const rect = root.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return;
      }

      const now = performance.now();
      const lx = clientX - rect.left;
      const ly = clientY - rect.top;
      const { t, cx, cy } = lastSpawnRef.current;
      const dist = Math.hypot(clientX - cx, clientY - cy);

      if (now - t < MIN_SPAWN_MS || dist < MIN_MOVE_PX) return;

      lastSpawnRef.current = { t: now, cx: clientX, cy: clientY };

      const driftX = (Math.random() - 0.5) * 48;
      const driftY = -(28 + Math.random() * 52);
      const rot = (Math.random() - 0.5) * 28;
      const id = `n-${++idSeq}-${now.toFixed(0)}`;

      setNotes((prev) => {
        const next: TrailNote[] = [
          ...prev,
          {
            id,
            x: lx,
            y: ly,
            glyph: pickGlyph(),
            driftX,
            driftY,
            rot,
          },
        ];
        return next.length > MAX_NOTES ? next.slice(-MAX_NOTES) : next;
      });
    };

    const flush = () => {
      rafRef.current = null;
      const p = pendingRef.current;
      if (!p) return;
      pendingRef.current = null;
      trySpawn(p.clientX, p.clientY);
    };

    const onMove = (e: MouseEvent) => {
      pendingRef.current = { clientX: e.clientX, clientY: e.clientY };
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(flush);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [trailOn]);

  return (
    <div
      ref={hostRef}
      className="hf-playground-cursor-trail-host pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {trailOn &&
        notes.map((n) => (
          <span
            key={n.id}
            className="hf-cursor-note"
            style={
              {
                left: n.x,
                top: n.y,
                "--hf-note-drift-x": `${n.driftX}px`,
                "--hf-note-drift-y": `${n.driftY}px`,
                "--hf-note-rot": `${n.rot}deg`,
                color: "color-mix(in srgb, var(--hf-accent) 70%, var(--hf-text-secondary))",
              } as React.CSSProperties
            }
            onAnimationEnd={() => removeNote(n.id)}
          >
            {n.glyph}
          </span>
        ))}
    </div>
  );
}
