"use client";
// FEATURE: COACHMARKS — Delete this file + useCoachmarkStore + data-coachmark="step-*" to remove the tour.

import React from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
  useCoachmarkStore,
  COACHMARKS_ENABLED,
  TOTAL_STEPS,
  STEP_ROUTES,
} from "@/store/useCoachmarkStore";
import { useSandboxTourBridge } from "@/store/useSandboxTourBridge";
import { completeOnboarding } from "@/lib/onboarding";

type CaretSide = "top" | "bottom" | "left" | "right";
type CardAnchor = "inside-right" | "inside-bottom-right";

interface StepDef {
  step: number;
  route: string;
  title: string;
  body: string;
  caretSide: CaretSide;
  cardAnchor?: CardAnchor;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const STEPS: StepDef[] = [
  {
    step: 1,
    route: "/",
    title: "Import a score to begin",
    body: "Drag a MusicXML, MXL, MIDI, or PDF file onto the stand, or click to browse. Every session starts here.",
    caretSide: "top",
  },
  {
    step: 2,
    route: "/document",
    title: "Build your ensemble",
    body: "Choose mood, backing density, and instruments for your arrangement. The engine uses these settings to build the harmony.",
    caretSide: "right",
  },
  {
    step: 3,
    route: "/sandbox",
    title: "Edit notes directly",
    body: "Click any note to select it. Drag to move pitch or position. Use the palette above to apply articulations.",
    caretSide: "left",
    cardAnchor: "inside-right",
  },
  {
    step: 4,
    route: "/sandbox",
    title: "The Glass Box",
    body: "Every harmony decision is explained in this panel. Red flags mark violations with academic citations and suggested fixes.",
    caretSide: "right",
  },
  {
    step: 5,
    route: "/sandbox",
    title: "Export your score",
    body: "When you are ready, click Export to open the export dialog and choose your output format.",
    caretSide: "top",
  },
  {
    step: 6,
    route: "/sandbox",
    title: "Choose your format",
    body: "Select from MusicXML, MIDI, PDF, PNG, JSON, audio, or a full ZIP archive. Pick the format that fits your workflow, then hit Export to download.",
    caretSide: "right",
  },
];

const CARD_WIDTH = 320;
const CARET_H = 8;
const CARET_W = 8;
const OVERLAY_BG = "rgba(0,0,0,0.5)";
const CARD_BG = "#F5F0EF";
const CARD_BORDER = "#D2B48C";
const CARD_SHADOW = "0 8px 28px rgba(45,24,23,0.18)";
const TITLE_FONT = "var(--font-instrument,'Instrument Serif',serif)";
const BODY_FONT = "var(--font-inter,Inter,sans-serif)";
const DOT_ACTIVE = "#9E4B3E";
const DOT_INACTIVE = "#D2B48C";
const BTN_PRIMARY_BG = "#9E4B3E";
const BTN_DONE_BG = "#FFB300";

function computeCardPos(
  spotlight: Rect,
  caretSide: CaretSide,
  cardAnchor: CardAnchor | undefined,
  cardHeight: number,
  vw: number,
  vh: number,
): { top: number; left: number } {
  const { top, left, width, height } = spotlight;
  const right = left + width;
  const bottom = top + height;
  const gap = 6;

  let cardTop: number;
  let cardLeft: number;

  if (cardAnchor === "inside-right") {
    cardTop = top + 24;
    cardLeft = right - CARD_WIDTH - 16;
  } else if (cardAnchor === "inside-bottom-right") {
    cardTop = bottom - cardHeight - CARET_H - 16;
    cardLeft = right - CARD_WIDTH - 16;
  } else {
    switch (caretSide) {
      case "top":
        cardTop = bottom + CARET_H + gap;
        cardLeft = left + width / 2 - CARD_WIDTH / 2;
        break;
      case "bottom":
        cardTop = top - cardHeight - CARET_H - gap;
        cardLeft = left + width / 2 - CARD_WIDTH / 2;
        break;
      case "left":
        cardTop = top + height / 2 - cardHeight / 2;
        cardLeft = right + CARET_W + gap;
        break;
      default:
        cardTop = top + height / 2 - cardHeight / 2;
        cardLeft = left - CARD_WIDTH - CARET_W - gap;
        break;
    }
  }

  return {
    top: Math.max(8, Math.min(vh - cardHeight - 8, cardTop)),
    left: Math.max(8, Math.min(vw - CARD_WIDTH - 8, cardLeft)),
  };
}

function Caret({
  side,
  cardPos,
  cardHeight,
}: {
  side: CaretSide;
  cardPos: { top: number; left: number };
  cardHeight: number;
}) {
  const base: React.CSSProperties = {
    position: "fixed",
    width: 0,
    height: 0,
    zIndex: 10140,
    pointerEvents: "none",
  };

  if (side === "top") {
    const cx = cardPos.left + CARD_WIDTH / 2;
    return (
      <>
        <div
          style={{
            ...base,
            top: cardPos.top - CARET_H - 1,
            left: cx - 6,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderBottom: `${CARET_H + 1}px solid ${CARD_BORDER}`,
          }}
        />
        <div
          style={{
            ...base,
            top: cardPos.top - CARET_H + 1,
            left: cx - 5,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderBottom: `${CARET_H}px solid ${CARD_BG}`,
          }}
        />
      </>
    );
  }

  if (side === "bottom") {
    const cx = cardPos.left + CARD_WIDTH / 2;
    return (
      <>
        <div
          style={{
            ...base,
            top: cardPos.top + cardHeight,
            left: cx - 6,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: `${CARET_H + 1}px solid ${CARD_BORDER}`,
          }}
        />
        <div
          style={{
            ...base,
            top: cardPos.top + cardHeight - 1,
            left: cx - 5,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `${CARET_H}px solid ${CARD_BG}`,
          }}
        />
      </>
    );
  }

  if (side === "left") {
    const cy = cardPos.top + cardHeight / 2;
    return (
      <>
        <div
          style={{
            ...base,
            top: cy - 6,
            left: cardPos.left - CARET_W - 1,
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
            borderRight: `${CARET_W + 1}px solid ${CARD_BORDER}`,
          }}
        />
        <div
          style={{
            ...base,
            top: cy - 5,
            left: cardPos.left - CARET_W + 1,
            borderTop: "5px solid transparent",
            borderBottom: "5px solid transparent",
            borderRight: `${CARET_W}px solid ${CARD_BG}`,
          }}
        />
      </>
    );
  }

  const cy = cardPos.top + cardHeight / 2;
  return (
    <>
      <div
        style={{
          ...base,
          top: cy - 6,
          left: cardPos.left + CARD_WIDTH,
          borderTop: "6px solid transparent",
          borderBottom: "6px solid transparent",
          borderLeft: `${CARET_W + 1}px solid ${CARD_BORDER}`,
        }}
      />
      <div
        style={{
          ...base,
          top: cy - 5,
          left: cardPos.left + CARD_WIDTH - 1,
          borderTop: "5px solid transparent",
          borderBottom: "5px solid transparent",
          borderLeft: `${CARET_W}px solid ${CARD_BG}`,
        }}
      />
    </>
  );
}

function DotsRow({ total, current }: { total: number; current: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      {Array.from({ length: total }, (_, i) => {
        const active = i + 1 === current;
        return (
          <div
            key={i}
            style={{
              width: active ? 20 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: active ? DOT_ACTIVE : DOT_INACTIVE,
              transition: "width 180ms ease",
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
}

const STAGGER_MS = 150;
const APPEAR_DURATION = 0.55;
const FADE_OUT_MS = 700;

const PARTICLES: Array<{
  note: string;
  color: string;
  left: number;
  top: number;
  size: number;
}> = [
  { note: "♩", color: "#FFB300", left: 8, top: 10, size: 36 },
  { note: "♪", color: "#9E4B3E", left: 28, top: 6, size: 28 },
  { note: "♫", color: "#D2B48C", left: 50, top: 9, size: 34 },
  { note: "♬", color: "#FFB300", left: 72, top: 6, size: 40 },
  { note: "♩", color: "#A55B37", left: 88, top: 12, size: 30 },
  { note: "♪", color: "#9E4B3E", left: 92, top: 32, size: 26 },
  { note: "♫", color: "#FFB300", left: 90, top: 56, size: 34 },
  { note: "♬", color: "#D2B48C", left: 86, top: 76, size: 28 },
  { note: "♩", color: "#FFB300", left: 68, top: 86, size: 38 },
  { note: "♪", color: "#9E4B3E", left: 46, top: 88, size: 30 },
  { note: "♫", color: "#A55B37", left: 24, top: 84, size: 34 },
  { note: "♬", color: "#FFB300", left: 6, top: 72, size: 26 },
  { note: "♩", color: "#D2B48C", left: 5, top: 50, size: 32 },
  { note: "♪", color: "#FFB300", left: 7, top: 28, size: 28 },
  { note: "♫", color: "#9E4B3E", left: 30, top: 32, size: 24 },
  { note: "♬", color: "#FFB300", left: 64, top: 28, size: 30 },
  { note: "♩", color: "#A55B37", left: 22, top: 62, size: 34 },
  { note: "♪", color: "#D2B48C", left: 70, top: 62, size: 26 },
];

export function CoachmarkOverlay() {
  const [mounted, setMounted] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const [spotlight, setSpotlight] = React.useState<Rect | null>(null);
  const [spotlightTimedOut, setSpotlightTimedOut] = React.useState(false);
  const [cardHeight, setCardHeight] = React.useState(210);
  const [celebrating, setCelebrating] = React.useState(false);
  const [fadingOut, setFadingOut] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const {
    isActive,
    currentStep,
    hasDismissed,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  } = useCoachmarkStore();

  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
    if (useCoachmarkStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useCoachmarkStore.persist.onFinishHydration(() => {
        setHydrated(true);
      });
      return unsub;
    }
  }, []);

  React.useEffect(() => {
    if (!hydrated || !COACHMARKS_ENABLED) return;
    if (pathname === "/" && !hasDismissed && !isActive) {
      startTour();
    }
  }, [hydrated, pathname, hasDismissed, isActive, startTour]);

  const stepDef = STEPS[currentStep - 1] as StepDef | undefined;

  React.useEffect(() => {
    if (!isActive || !stepDef) return;
    if (stepDef.route !== pathname) return;

    setSpotlight(null);
    setSpotlightTimedOut(false);

    const bridge = useSandboxTourBridge.getState();
    if (currentStep === 4) bridge.setInspectorOpen?.(true);
    if (currentStep === 6) bridge.setExportModalOpen?.(true);
    if (currentStep === 5) bridge.setExportModalOpen?.(false);

    let raf: number;
    let done = false;
    const timeout = setTimeout(() => {
      done = true;
      setSpotlightTimedOut(true);
    }, 1500);

    const measure = () => {
      if (done) return;
      const el = document.querySelector(`[data-coachmark="step-${currentStep}"]`);
      if (el) {
        done = true;
        clearTimeout(timeout);
        const r = el.getBoundingClientRect();
        setSpotlight({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        raf = requestAnimationFrame(measure);
      }
    };
    raf = requestAnimationFrame(measure);
    return () => {
      done = true;
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [isActive, currentStep, pathname, stepDef]);

  React.useEffect(() => {
    if (!isActive) return;
    const onResize = () => {
      const el = document.querySelector(`[data-coachmark="step-${currentStep}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        setSpotlight({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isActive, currentStep]);

  // Measure card height after each paint so the cutout + caret line up with the
  // dynamic copy for the current step. `cardRef` and setter identities are stable;
  // no dep array keeps this runs-after-every-render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useLayoutEffect(() => {
    if (cardRef.current) {
      const h = cardRef.current.offsetHeight;
      if (h > 0) setCardHeight(h);
    }
  });

  React.useEffect(() => {
    if (!celebrating) return;
    const allNotesMs = (PARTICLES.length - 1) * STAGGER_MS + APPEAR_DURATION * 1000;
    const t1 = setTimeout(() => setFadingOut(true), allNotesMs + 600);
    const t2 = setTimeout(() => {
      setFadingOut(false);
      setCelebrating(false);
      completeTour();
      completeOnboarding();
      useSandboxTourBridge.getState().setExportModalOpen?.(false);
      router.push("/");
    }, allNotesMs + 600 + FADE_OUT_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [celebrating, completeTour, router]);

  const handleNext = React.useCallback(() => {
    if (currentStep >= TOTAL_STEPS) {
      useSandboxTourBridge.getState().setExportModalOpen?.(false);
      setCelebrating(true);
      return;
    }
    const nextRoute = STEP_ROUTES[currentStep + 1];
    nextStep();
    if (nextRoute !== pathname) router.push(nextRoute);
  }, [currentStep, pathname, nextStep, router]);

  const handlePrev = React.useCallback(() => {
    if (currentStep <= 1) return;
    if (currentStep === 6) useSandboxTourBridge.getState().setExportModalOpen?.(false);
    const prevRoute = STEP_ROUTES[currentStep - 1];
    prevStep();
    if (prevRoute !== pathname) router.push(prevRoute);
  }, [currentStep, pathname, prevStep, router]);

  const handleSkip = React.useCallback(() => {
    useSandboxTourBridge.getState().setExportModalOpen?.(false);
    skipTour();
    completeOnboarding();
  }, [skipTour]);

  if (mounted && celebrating) {
    const celebrationContent = (
      <>
        <style>{`
          @keyframes hf-cm-note-popin {
            0%   { opacity: 0; transform: scale(0.2) translateY(12px); }
            65%  { opacity: 1; transform: scale(1.12) translateY(-3px); }
            100% { opacity: 1; transform: scale(1)    translateY(0);    }
          }
          @keyframes hf-cm-welcome-in {
            0%   { opacity: 0; transform: translateY(16px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0)    scale(1);    }
          }
        `}</style>

        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            backgroundColor: "rgba(253,245,230,0.97)",
            opacity: fadingOut ? 0 : 1,
            transition: `opacity ${FADE_OUT_MS}ms ease-in-out`,
          }}
          role="status"
          aria-live="polite"
          aria-label="Welcome to HarmonyForge"
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {PARTICLES.map((p, i) => (
              <span
                key={i}
                style={{
                  position: "fixed",
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  fontSize: p.size,
                  color: p.color,
                  opacity: 0,
                  animation: `hf-cm-note-popin ${APPEAR_DURATION}s cubic-bezier(0.34,1.56,0.64,1) ${i * STAGGER_MS}ms forwards`,
                  pointerEvents: "none",
                  userSelect: "none",
                  lineHeight: 1,
                }}
              >
                {p.note}
              </span>
            ))}
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              animation: "hf-cm-welcome-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
            }}
          >
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#9E4B3E",
                margin: 0,
              }}
            >
              You&apos;re all set
            </p>
            <h1
              style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: 42,
                fontWeight: 400,
                color: "#1A1A1A",
                margin: 0,
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              Welcome to
              <br />
              HarmonyForge
            </h1>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 15,
                fontWeight: 400,
                color: "#6B5740",
                margin: 0,
                textAlign: "center",
                lineHeight: 1.5,
                maxWidth: 340,
              }}
            >
              Your Glass Box is ready. Drop a score to begin.
            </p>
          </div>
        </div>
      </>
    );

    return createPortal(celebrationContent, document.body);
  }

  if (!mounted || !hydrated || !COACHMARKS_ENABLED || !isActive) return null;
  if (!stepDef || stepDef.route !== pathname) return null;
  if (!spotlight && !spotlightTimedOut) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const cardPos = spotlight
    ? computeCardPos(spotlight, stepDef.caretSide, stepDef.cardAnchor, cardHeight, vw, vh)
    : { top: Math.max(8, vh / 2 - cardHeight / 2), left: Math.max(8, vw / 2 - CARD_WIDTH / 2) };

  const isFirst = currentStep === 1;
  const isLast = currentStep === TOTAL_STEPS;

  const content = (
    <>
      {spotlight &&
        (() => {
          const { top, left, width, height } = spotlight;
          const right = left + width;
          const bottom = top + height;
          return (
            <>
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: vw,
                  height: Math.max(0, top),
                  backgroundColor: OVERLAY_BG,
                  zIndex: 10131,
                  pointerEvents: "auto",
                }}
                onClick={handleSkip}
                aria-hidden="true"
              />
              <div
                style={{
                  position: "fixed",
                  top: bottom,
                  left: 0,
                  width: vw,
                  height: Math.max(0, vh - bottom),
                  backgroundColor: OVERLAY_BG,
                  zIndex: 10131,
                  pointerEvents: "auto",
                }}
                onClick={handleSkip}
                aria-hidden="true"
              />
              <div
                style={{
                  position: "fixed",
                  top,
                  left: 0,
                  width: Math.max(0, left),
                  height,
                  backgroundColor: OVERLAY_BG,
                  zIndex: 10131,
                  pointerEvents: "auto",
                }}
                onClick={handleSkip}
                aria-hidden="true"
              />
              <div
                style={{
                  position: "fixed",
                  top,
                  left: right,
                  width: Math.max(0, vw - right),
                  height,
                  backgroundColor: OVERLAY_BG,
                  zIndex: 10131,
                  pointerEvents: "auto",
                }}
                onClick={handleSkip}
                aria-hidden="true"
              />
              <div
                style={{
                  position: "fixed",
                  top,
                  left,
                  width,
                  height,
                  border: "2px solid #F5F0EF",
                  borderRadius: 6,
                  zIndex: 10132,
                  pointerEvents: "none",
                }}
                aria-hidden="true"
              />
            </>
          );
        })()}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-label={`Tour step ${currentStep} of ${TOTAL_STEPS}: ${stepDef.title}`}
        style={{
          position: "fixed",
          top: cardPos.top,
          left: cardPos.left,
          width: CARD_WIDTH,
          zIndex: 10140,
          backgroundColor: CARD_BG,
          border: `1px solid ${CARD_BORDER}`,
          borderRadius: 8,
          boxShadow: CARD_SHADOW,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div
            style={{
              fontFamily: TITLE_FONT,
              fontSize: 18,
              fontWeight: 400,
              color: "#1A1A1A",
              lineHeight: 1.3,
              flex: 1,
            }}
          >
            {stepDef.title}
          </div>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily: BODY_FONT,
              fontSize: 12,
              color: "#9B9089",
              lineHeight: 1,
              flexShrink: 0,
              marginTop: 3,
            }}
          >
            Skip
          </button>
        </div>

        <div
          style={{
            fontFamily: BODY_FONT,
            fontSize: 14,
            color: "#6B5740",
            lineHeight: 1.6,
          }}
        >
          {stepDef.body}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirst}
            aria-label="Previous step"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: isFirst ? "default" : "pointer",
              fontFamily: BODY_FONT,
              fontSize: 13,
              color: "#6B5740",
              opacity: isFirst ? 0 : 1,
              pointerEvents: isFirst ? "none" : "auto",
            }}
          >
            Previous
          </button>

          <DotsRow total={TOTAL_STEPS} current={currentStep} />

          {isLast ? (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Finish tour"
              style={{
                backgroundColor: BTN_DONE_BG,
                border: "none",
                borderRadius: 4,
                height: 32,
                padding: "0 14px",
                cursor: "pointer",
                fontFamily: BODY_FONT,
                fontSize: 13,
                fontWeight: 500,
                color: "#1A1A1A",
              }}
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              aria-label={`Go to step ${currentStep + 1}`}
              style={{
                backgroundColor: BTN_PRIMARY_BG,
                border: "none",
                borderRadius: 4,
                height: 32,
                padding: "0 14px",
                cursor: "pointer",
                fontFamily: BODY_FONT,
                fontSize: 13,
                color: "#FFFFFF",
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>

      {spotlight && <Caret side={stepDef.caretSide} cardPos={cardPos} cardHeight={cardHeight} />}
    </>
  );

  return createPortal(content, document.body);
}
