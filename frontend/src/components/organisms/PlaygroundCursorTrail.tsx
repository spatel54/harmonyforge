"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const NOTE_GLYPHS = ["♪", "♫", "♬", "♩", "𝄞"] as const;
const TECH_GLYPHS = ["✦", "◌", "⌁", "⟡", "⌬", "⎔"] as const;
const BURST_GLYPHS = [...NOTE_GLYPHS, ...TECH_GLYPHS] as const;

type TrailNote = {
  id: string;
  x: number;
  y: number;
  glyph: (typeof NOTE_GLYPHS)[number];
  driftX: number;
  driftY: number;
  rot: number;
};

type BurstGlyph = {
  id: string;
  x: number;
  y: number;
  glyph: (typeof BURST_GLYPHS)[number];
  driftX: number;
  driftY: number;
  rot: number;
  sizePx: number;
};

const MAX_NOTES = 36;
const MIN_SPAWN_MS = 72;
const MIN_MOVE_PX = 10;
let idSeq = 0;

function pickTrailGlyph(): (typeof NOTE_GLYPHS)[number] {
  return NOTE_GLYPHS[Math.floor(Math.random() * NOTE_GLYPHS.length)]!;
}

function pickBurstGlyph(): (typeof BURST_GLYPHS)[number] {
  return BURST_GLYPHS[Math.floor(Math.random() * BURST_GLYPHS.length)]!;
}

/**
 * Playground-only: gentle trail of floating note symbols that follow the pointer.
 * Off when `prefers-reduced-motion` or when the primary pointer is not fine (e.g. touch-first).
 */
export function PlaygroundCursorTrail() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [trailOn, setTrailOn] = useState(false);
  const [notes, setNotes] = useState<TrailNote[]>([]);
  const [bursts, setBursts] = useState<BurstGlyph[]>([]);
  const lastSpawnRef = useRef({ t: 0, cx: 0, cy: 0 });
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ clientX: number; clientY: number } | null>(null);

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const removeBurst = useCallback((id: string) => {
    setBursts((prev) => prev.filter((b) => b.id !== id));
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
            glyph: pickTrailGlyph(),
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

  useEffect(() => {
    if (!trailOn) return;

    const spawnBurst = (clientX: number, clientY: number) => {
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

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const count = 9 + Math.floor(Math.random() * 4);
      const now = performance.now();
      const ring: BurstGlyph[] = Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
        const radius = 34 + Math.random() * 46;
        return {
          id: `b-${++idSeq}-${now.toFixed(0)}-${i}`,
          x,
          y,
          glyph: pickBurstGlyph(),
          driftX: Math.cos(angle) * radius,
          driftY: Math.sin(angle) * radius - (12 + Math.random() * 18),
          rot: (Math.random() - 0.5) * 70,
          sizePx: 14 + Math.random() * 9,
        };
      });
      setBursts((prev) => [...prev, ...ring].slice(-64));
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      spawnBurst(e.clientX, e.clientY);
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
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
      {trailOn &&
        bursts.map((b) => (
          <span
            key={b.id}
            className="hf-cursor-burst-glyph"
            style={
              {
                left: b.x,
                top: b.y,
                fontSize: `${b.sizePx}px`,
                "--hf-note-drift-x": `${b.driftX}px`,
                "--hf-note-drift-y": `${b.driftY}px`,
                "--hf-note-rot": `${b.rot}deg`,
                color: "color-mix(in srgb, var(--hf-accent) 56%, var(--hf-text-secondary))",
              } as React.CSSProperties
            }
            onAnimationEnd={() => removeBurst(b.id)}
          >
            {b.glyph}
          </span>
        ))}
    </div>
  );
}
