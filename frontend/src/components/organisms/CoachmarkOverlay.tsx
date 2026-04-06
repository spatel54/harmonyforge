"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  COACHMARKS_ENABLED,
  STEP_ROUTES,
  TOTAL_STEPS,
  useCoachmarkStore,
} from "@/store/useCoachmarkStore";

const COACH_COPY: Record<number, { title: string; body: string }> = {
  1: {
    title: "Upload",
    body: "Drop MusicXML, MXL, MIDI, or PDF here to start the flow.",
  },
  2: {
    title: "Score preview",
    body: "Review your melody and file metadata before configuring the ensemble.",
  },
  3: {
    title: "Ensemble builder",
    body: "Choose mood, genre, and instruments for harmony generation.",
  },
  4: {
    title: "Generate or continue",
    body: "Run the engine for additive harmonies—or continue with melody only in reviewer mode.",
  },
  5: {
    title: "Sandbox editor",
    body: "Edit the score with the notation surface, toolbar, and playback.",
  },
  6: {
    title: "Violations & highlights",
    body: "With the inspector open, harmony issues show in the score.",
  },
  7: {
    title: "Theory Inspector",
    body: "Audit, tutor chat, and stylist suggestions use your score as structured context.",
  },
  8: {
    title: "Inspector chat",
    body: "Ask questions; the model is grounded in taxonomy and exported notation facts.",
  },
  9: {
    title: "Suggestions",
    body: "Accept or reject structured fixes from the stylist when offered.",
  },
  10: {
    title: "Export",
    body: "Download MusicXML (and more) when your arrangement is ready.",
  },
  11: {
    title: "Focus regions",
    body: "Select a measure or part for region-scoped explanations when the inspector is open.",
  },
  12: {
    title: "Playback",
    body: "Use playback to hear the current score state.",
  },
  13: {
    title: "Tour complete",
    body: "You can restart this tour anytime from the header.",
  },
};

function resolveTargetEl(step: number): HTMLElement | null {
  const direct = document.querySelector(`[data-coachmark="${step}"]`);
  if (direct instanceof HTMLElement) return direct;
  const map: Record<number, number> = {
    6: 5,
    8: 7,
    9: 7,
    11: 5,
    12: 5,
    13: 5,
  };
  const alt = map[step];
  if (alt != null) {
    const e = document.querySelector(`[data-coachmark="${alt}"]`);
    if (e instanceof HTMLElement) return e;
  }
  if (step >= 7) {
    const ins = document.querySelector(`[data-coachmark="7"]`);
    if (ins instanceof HTMLElement) return ins;
  }
  const five = document.querySelector(`[data-coachmark="5"]`);
  return five instanceof HTMLElement ? five : null;
}

export function CoachmarkOverlay() {
  if (!COACHMARKS_ENABLED) return null;

  const pathname = usePathname();
  const router = useRouter();
  const isActive = useCoachmarkStore((s) => s.isActive);
  const currentStep = useCoachmarkStore((s) => s.currentStep);
  const nextStep = useCoachmarkStore((s) => s.nextStep);
  const prevStep = useCoachmarkStore((s) => s.prevStep);
  const skipTour = useCoachmarkStore((s) => s.skipTour);

  React.useEffect(() => {
    if (!isActive) return;
    const want = STEP_ROUTES[currentStep];
    if (!want) return;
    // Standalone onboarding page uses the same upload anchor as home.
    if (want === "/" && pathname === "/onboarding") return;
    if (want !== pathname) {
      router.push(want);
    }
  }, [isActive, currentStep, pathname, router]);

  const [highlight, setHighlight] = React.useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [tooltipCss, setTooltipCss] = React.useState<React.CSSProperties>({
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  });

  const layout = React.useCallback(() => {
    if (!isActive || typeof window === "undefined") return;
    const el = resolveTargetEl(currentStep);
    const cardW = 360;
    const cardH = 220;
    const pad = 16;

    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      const r = el.getBoundingClientRect();
      setHighlight({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      });
      let top = r.bottom + 12;
      let left = r.left;
      if (top + cardH > window.innerHeight - pad) {
        top = Math.max(pad, r.top - cardH - 12);
      }
      if (left + cardW > window.innerWidth - pad) {
        left = window.innerWidth - cardW - pad;
      }
      if (left < pad) left = pad;
      setTooltipCss({
        top,
        left,
        transform: "none",
      });
    } else {
      setHighlight(null);
      setTooltipCss({
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      });
    }
  }, [isActive, currentStep, pathname]);

  React.useLayoutEffect(() => {
    layout();
    const t = window.setTimeout(layout, 100);
    window.addEventListener("resize", layout);
    window.addEventListener("scroll", layout, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", layout);
      window.removeEventListener("scroll", layout, true);
    };
  }, [layout]);

  if (!isActive) return null;

  const copy = COACH_COPY[currentStep] ?? COACH_COPY[1];
  const isFirst = currentStep <= 1;
  const isLast = currentStep >= TOTAL_STEPS;

  return (
    <>
      <div className="fixed inset-0 z-[10100] bg-black/45" aria-hidden />

      {highlight && (
        <div
          className="fixed z-[10101] rounded-md pointer-events-none ring-2 ring-[var(--hf-accent)] ring-offset-2 ring-offset-transparent shadow-[0_0_0_4px_rgba(255,179,0,0.2)]"
          style={{
            top: highlight.top - 4,
            left: highlight.left - 4,
            width: highlight.width + 8,
            height: highlight.height + 8,
          }}
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Product tour"
        className="fixed z-[10102] w-[min(360px,calc(100vw-32px))] rounded-lg border p-4 shadow-xl"
        style={{
          ...tooltipCss,
          backgroundColor: "var(--hf-panel-bg)",
          borderColor: "var(--hf-detail)",
        }}
      >
        <div className="font-mono text-[10px] mb-1 opacity-70" style={{ color: "var(--hf-text-secondary)" }}>
          Step {currentStep} of {TOTAL_STEPS}
        </div>
        <h2 className="text-[16px] font-semibold mb-2" style={{ color: "var(--hf-text-primary)" }}>
          {copy.title}
        </h2>
        <p className="text-[13px] leading-snug mb-4" style={{ color: "var(--hf-text-primary)" }}>
          {copy.body}
        </p>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => prevStep()}
            disabled={isFirst}
            className="text-[12px] px-2 py-1.5 rounded border disabled:opacity-40"
            style={{ borderColor: "var(--hf-detail)", color: "var(--hf-text-primary)" }}
          >
            Back
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => skipTour()}
              className="text-[12px] px-2 py-1.5"
              style={{ color: "var(--hf-text-secondary)" }}
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => nextStep()}
              className="text-[12px] px-3 py-1.5 rounded font-medium"
              style={{
                backgroundColor: "var(--hf-accent)",
                color: "#1a0f0c",
              }}
            >
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
