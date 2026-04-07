"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type TransitionVariant = "parsing" | "generating" | "melody_only";

/**
 * Minimum time to keep the overlay visible (matches the 0→100% counter in this component).
 * Call sites should `await awaitMinElapsedSince(t0, TRANSITION_MIN_VISIBLE_MS[variant])` before hiding.
 */
export const TRANSITION_MIN_VISIBLE_MS: Record<TransitionVariant, number> = {
  parsing: 2000,
  generating: 2200,
  melody_only: 2000,
};

export interface TransitionOverlayProps {
  variant: TransitionVariant;
  /** Controls visibility — fade in immediately, fade out on false */
  visible: boolean;
  className?: string;
}

const LABELS: Record<TransitionVariant, { headline: string; sub: string }> = {
  parsing: {
    headline: "Parsing Score",
    sub: "Reading symbolic notation…",
  },
  generating: {
    headline: "Generating Harmonies",
    sub: "Applying voice-leading rules…",
  },
  melody_only: {
    headline: "Opening sandbox",
    sub: "Loading your melody (no auto-harmonies)…",
  },
};

function usePercentageCounter(visible: boolean, duration: number): number {
  const [pct, setPct] = React.useState(0);
  React.useEffect(() => {
    if (!visible) {
      setPct(0);
      return;
    }
    const steps = 60;
    const intervalMs = duration / steps;
    let current = 0;
    const id = setInterval(() => {
      current += 1;
      setPct(Math.min(current * (100 / steps), 100));
      if (current >= steps) clearInterval(id);
    }, intervalMs);
    return () => clearInterval(id);
  }, [visible, duration]);
  return Math.round(pct);
}

const BOOK_CSS = `
  .hfb,.hfb-shadow,.hfb-pg{animation:hfb-cover 5s ease-in-out infinite!important}
  .hfb{
    background-color:var(--hf-surface);
    border-radius:.25em;
    box-shadow:0 .25em .5em hsla(0,0%,0%,.3),0 0 0 .25em var(--hf-accent) inset;
    padding:.25em;
    perspective:37.5em;
    position:relative;
    width:8em;
    height:6em;
    transform:translate3d(0,0,0);
    transform-style:preserve-3d;
  }
  .hfb-shadow,.hfb-pg{position:absolute;left:.25em;width:calc(50% - .25em)}
  .hfb-shadow{
    animation-name:hfb-shadow!important;
    background-image:linear-gradient(-45deg,rgba(0,0,0,0) 50%,rgba(0,0,0,.25) 50%);
    filter:blur(.25em);
    top:calc(100% - .25em);
    height:3.75em;
    transform:scaleY(0);
    transform-origin:100% 0%;
  }
  .hfb-pg{
    animation-name:hfb-pg1!important;
    background-color:var(--hf-canvas-bg);
    background-image:linear-gradient(90deg,rgba(var(--hf-surface-rgb),0) 87.5%,rgba(var(--hf-surface-rgb),.15));
    height:calc(100% - .5em);
    transform-origin:100% 50%;
  }
  .hfb-pg2,.hfb-pg3,.hfb-pg4{
    background-image:
      repeating-linear-gradient(var(--hf-text-primary) 0 .125em,rgba(0,0,0,0) .125em .5em),
      linear-gradient(90deg,rgba(var(--hf-surface-rgb),0) 87.5%,rgba(var(--hf-surface-rgb),.15));
    background-repeat:no-repeat;
    background-position:center;
    background-size:2.5em 4.125em,100% 100%;
  }
  .hfb-pg2{animation-name:hfb-pg2!important}
  .hfb-pg3{animation-name:hfb-pg3!important}
  .hfb-pg4{animation-name:hfb-pg4!important}
  .hfb-pg5{animation-name:hfb-pg5!important}

  @keyframes hfb-cover{
    from,5%,45%,55%,95%,to{animation-timing-function:ease-out;background-color:var(--hf-surface)}
    10%,40%,60%,90%{animation-timing-function:ease-in;background-color:var(--hf-accent)}
  }
  @keyframes hfb-shadow{
    from,10.01%,20.01%,30.01%,40.01%{animation-timing-function:ease-in;transform:translate3d(0,0,1px) scaleY(0) rotateY(0)}
    5%,15%,25%,35%,45%,55%,65%,75%,85%,95%{animation-timing-function:ease-out;transform:translate3d(0,0,1px) scaleY(.2) rotateY(90deg)}
    10%,20%,30%,40%,50%,to{animation-timing-function:ease-out;transform:translate3d(0,0,1px) scaleY(0) rotateY(180deg)}
    50.01%,60.01%,70.01%,80.01%,90.01%{animation-timing-function:ease-in;transform:translate3d(0,0,1px) scaleY(0) rotateY(180deg)}
    60%,70%,80%,90%,to{animation-timing-function:ease-out;transform:translate3d(0,0,1px) scaleY(0) rotateY(0)}
  }
  @keyframes hfb-pg1{
    from,to{animation-timing-function:ease-in-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(.4deg)}
    10%,15%{animation-timing-function:ease-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(180deg)}
    20%,80%{animation-timing-function:ease-in;background-color:var(--hf-detail);transform:translate3d(0,0,1px) rotateY(180deg)}
    85%,90%{animation-timing-function:ease-in-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(180deg)}
  }
  @keyframes hfb-pg2{
    from,to{animation-timing-function:ease-in;background-color:var(--hf-detail);transform:translate3d(0,0,1px) rotateY(.3deg)}
    5%,10%{animation-timing-function:ease-in-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(.3deg)}
    20%,25%{animation-timing-function:ease-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(179.9deg)}
    30%,70%{animation-timing-function:ease-in;background-color:var(--hf-detail);transform:translate3d(0,0,1px) rotateY(179.9deg)}
    75%,80%{animation-timing-function:ease-in-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(179.9deg)}
    90%,95%{animation-timing-function:ease-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(.3deg)}
  }
  @keyframes hfb-pg3{
    from,10%,90%,to{animation-timing-function:ease-in;background-color:var(--hf-detail);transform:translate3d(0,0,1px) rotateY(.2deg)}
    15%,20%{animation-timing-function:ease-in-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(.2deg)}
    30%,35%{animation-timing-function:ease-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(179.8deg)}
    40%,60%{animation-timing-function:ease-in;background-color:var(--hf-detail);transform:translate3d(0,0,1px) rotateY(179.8deg)}
    65%,70%{animation-timing-function:ease-in-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(179.8deg)}
    80%,85%{animation-timing-function:ease-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(.2deg)}
  }
  @keyframes hfb-pg4{
    from,20%,80%,to{animation-timing-function:ease-in;background-color:var(--hf-detail);transform:translate3d(0,0,1px) rotateY(.1deg)}
    25%,30%{animation-timing-function:ease-in-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(.1deg)}
    40%,45%{animation-timing-function:ease-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(179.7deg)}
    50%{animation-timing-function:ease-in;background-color:var(--hf-detail);transform:translate3d(0,0,1px) rotateY(179.7deg)}
    55%,60%{animation-timing-function:ease-in-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(179.7deg)}
    70%,75%{animation-timing-function:ease-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(.1deg)}
  }
  @keyframes hfb-pg5{
    from,30%,70%,to{animation-timing-function:ease-in;background-color:var(--hf-detail);transform:translate3d(0,0,1px) rotateY(0)}
    35%,40%{animation-timing-function:ease-in-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(0deg)}
    50%{animation-timing-function:ease-in-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(179.6deg)}
    60%,65%{animation-timing-function:ease-out;background-color:var(--hf-canvas-bg);transform:translate3d(0,0,1px) rotateY(0)}
  }
`;

function BookLoader() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BOOK_CSS }} />
      <div role="img" aria-hidden="true" className="hfb">
        <div className="hfb-shadow" />
        <div className="hfb-pg" />
        <div className="hfb-pg hfb-pg2" />
        <div className="hfb-pg hfb-pg3" />
        <div className="hfb-pg hfb-pg4" />
        <div className="hfb-pg hfb-pg5" />
      </div>
    </>
  );
}

const NOTE_CSS = `
  .hfn{display:flex;align-items:flex-end;justify-content:center;height:4em;width:calc(4em * 2);gap:.2em}
  .hfn-icon{display:inline-flex;width:calc(100%/3);height:calc(100%*2/3);color:var(--hf-accent)}
  .hfn-icon{
    animation:
      hf-note-icon-bounce 1s linear infinite,
      hf-note-icon-glow   1s linear infinite,
      hf-note-icon-shimmer 2s ease-in-out infinite !important
  }
  .hfn-icon:nth-child(2){animation-delay:.20s,.20s,.30s!important}
  .hfn-icon:nth-child(3){animation-delay:.40s,.40s,.50s!important}
  @keyframes hf-note-icon-bounce{
    0%  {transform:translateY(0) rotate(0deg) scale(1);opacity:.55}
    20% {transform:translateY(-40%) rotate(-6deg) scale(1.12);opacity:1}
    40% {transform:translateY(18%) rotate(4deg) scale(.96);opacity:.8}
    60% {transform:translateY(0) rotate(0deg) scale(1);opacity:.9}
    80% {transform:translateY(0) rotate(0deg) scale(1);opacity:.9}
    100%{transform:translateY(0) rotate(0deg) scale(1);opacity:.55}
  }
  @keyframes hf-note-icon-glow{
    0%,100%{filter:drop-shadow(0 0 0px var(--hf-accent))}
    20%    {filter:drop-shadow(0 0 10px var(--hf-accent))}
  }
  @keyframes hf-note-icon-shimmer{
    0%,100%{color:var(--hf-accent)}
    50%    {color:var(--hf-surface)}
  }
`;

function NoteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      aria-hidden="true"
    >
      <ellipse
        transform="rotate(-21.283 49.994 75.642)"
        cx={50}
        cy="75.651"
        rx="19.347"
        ry="16.432"
        fill="currentColor"
      />
      <path fill="currentColor" d="M58.474 7.5h10.258v63.568H58.474z" />
    </svg>
  );
}

function MusicNoteLoader() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: NOTE_CSS }} />
      <div role="img" aria-hidden="true" className="hfn">
        <span className="hfn-icon">
          <NoteIcon />
        </span>
        <span className="hfn-icon">
          <NoteIcon />
        </span>
        <span className="hfn-icon">
          <NoteIcon />
        </span>
      </div>
    </>
  );
}

/**
 * Full-screen transition: book animation (parsing), music notes + % (generating / melody_only).
 */
export function TransitionOverlay({
  variant,
  visible,
  className,
}: TransitionOverlayProps) {
  const { headline, sub } = LABELS[variant];
  const duration = TRANSITION_MIN_VISIBLE_MS[variant];
  const rawPct = usePercentageCounter(visible, duration);
  const showBook = variant === "parsing";
  /** Avoid implying “done” while network / engine still runs (bar caps at 90% for note variants). */
  const displayPct = showBook ? rawPct : Math.min(rawPct, 90);
  const showLongWaitHint = !showBook && rawPct >= 90 && visible;

  return (
    <div
      aria-live="assertive"
      aria-label={headline}
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-[32px]",
        "transition-opacity duration-500",
        visible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none",
        className,
      )}
      style={{ backgroundColor: "var(--hf-bg)" }}
    >
      {showBook ? <BookLoader /> : <MusicNoteLoader />}

      <p
        className="font-mono tabular-nums"
        style={{
          fontSize: "2.25rem",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: "var(--hf-accent)",
        }}
        aria-live="polite"
        aria-label={`${displayPct} percent complete`}
      >
        {displayPct}%
      </p>

      {/* Deterministic bar — same signal as the percentage counter */}
      <div
        className="w-[min(280px,85vw)] h-[6px] rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--hf-detail)", opacity: 0.35 }}
        aria-hidden
      >
        <div
          className="h-full rounded-full transition-[width] duration-75 ease-linear"
          style={{
            width: `${displayPct}%`,
            backgroundColor: "var(--hf-accent)",
          }}
        />
      </div>

      <div className="flex flex-col items-center gap-1">
        <p
          className="font-serif text-[24px]"
          style={{ color: "var(--hf-text-primary)" }}
        >
          {headline}
        </p>
        <p
          className="font-mono text-[12px] opacity-60"
          style={{ color: "var(--hf-text-primary)" }}
        >
          {sub}
        </p>
        {showLongWaitHint ? (
          <p
            className="font-mono text-[11px] opacity-50 max-w-[min(320px,90vw)] text-center mt-1"
            style={{ color: "var(--hf-text-primary)" }}
          >
            Still working—large scores can take a while.
          </p>
        ) : null}
      </div>
    </div>
  );
}
