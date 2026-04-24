"use client";

import React from "react";

const SLIDES = [
  {
    label: "Step 1 · Import",
    gradientFrom: "#FDF5E6",
    gradientTo: "#E8DCDA",
    heading: "Import a score",
    body: "MusicXML, MXL, MIDI, or PDF. We open it on the next screens so you can hear and configure before you commit.",
    cta: "Next →",
    ctaStyle: "primary" as const,
  },
  {
    label: "Step 2 · Ensemble",
    gradientFrom: "#FDF5E6",
    gradientTo: "#E0D5D3",
    heading: "Shape the ensemble",
    body: "Mood, harmony motion, and instruments tell the engine how to fill SATB. Every part stays editable afterward.",
    cta: "Next →",
    ctaStyle: "primary" as const,
  },
  {
    label: "Step 3 · Edit",
    gradientFrom: "#FDF5E6",
    gradientTo: "#DDD0CE",
    heading: "Edit with the lights on",
    body: "Change notes, listen back, and open Theory Inspector when you want coaching next to the staff, not a black box.",
    cta: "Next →",
    ctaStyle: "primary" as const,
  },
  {
    label: "Step 4 · Export",
    gradientFrom: "#FDF5E6",
    gradientTo: "#D9CBCA",
    heading: "Take it with you",
    body: "MusicXML, MIDI, PNG, print, and more. Lessons, DAW, stage, or archive.",
    cta: "Get started",
    ctaStyle: "accent" as const,
  },
] as const;

// Musical note particles — spread around all 4 card edges, fly outward
// top/left are % of the 512×480 container that mirrors the card dimensions
const PARTICLES: Array<{
  note: string;
  color: string;
  left: number;
  top: number;
  txEnd: number;
  tyEnd: number;
  delay: number;
  duration: number;
  size: number;
}> = [
  // ── Top edge — fly upward ──────────────────────────────────────────────
  { note: "♩", color: "#FFB300", left:  8, top:  5, txEnd:  -90, tyEnd: -200, delay:   0, duration: 2.2, size: 32 },
  { note: "♪", color: "#9E4B3E", left: 22, top:  3, txEnd:  -40, tyEnd: -240, delay:  50, duration: 2.4, size: 26 },
  { note: "♫", color: "#D2B48C", left: 38, top:  5, txEnd:  -10, tyEnd: -220, delay: 100, duration: 2.1, size: 30 },
  { note: "♬", color: "#FFB300", left: 52, top:  3, txEnd:   20, tyEnd: -260, delay:  20, duration: 2.5, size: 36 },
  { note: "♩", color: "#A55B37", left: 66, top:  5, txEnd:   50, tyEnd: -210, delay:  70, duration: 2.2, size: 28 },
  { note: "♪", color: "#FFB300", left: 80, top:  3, txEnd:   90, tyEnd: -240, delay:  30, duration: 2.3, size: 24 },
  { note: "♫", color: "#9E4B3E", left: 92, top:  5, txEnd:  130, tyEnd: -200, delay:  90, duration: 2.0, size: 32 },

  // ── Bottom edge — fly downward ─────────────────────────────────────────
  { note: "♬", color: "#D2B48C", left: 10, top: 92, txEnd:  -80, tyEnd:  200, delay:  40, duration: 2.3, size: 28 },
  { note: "♩", color: "#FFB300", left: 28, top: 95, txEnd:  -30, tyEnd:  230, delay:  80, duration: 2.1, size: 34 },
  { note: "♪", color: "#A55B37", left: 46, top: 93, txEnd:   10, tyEnd:  220, delay:  15, duration: 2.4, size: 26 },
  { note: "♫", color: "#FFB300", left: 62, top: 95, txEnd:   50, tyEnd:  240, delay:  60, duration: 2.2, size: 30 },
  { note: "♬", color: "#9E4B3E", left: 78, top: 92, txEnd:  100, tyEnd:  210, delay: 110, duration: 2.0, size: 32 },
  { note: "♩", color: "#D2B48C", left: 93, top: 95, txEnd:  130, tyEnd:  230, delay:  35, duration: 2.3, size: 24 },

  // ── Left edge — fly leftward ───────────────────────────────────────────
  { note: "♪", color: "#FFB300", left:  3, top: 18, txEnd: -220, tyEnd:  -60, delay:  55, duration: 2.2, size: 30 },
  { note: "♫", color: "#9E4B3E", left:  2, top: 38, txEnd: -240, tyEnd:    0, delay: 120, duration: 2.4, size: 28 },
  { note: "♬", color: "#A55B37", left:  3, top: 58, txEnd: -220, tyEnd:   50, delay:  25, duration: 2.1, size: 34 },
  { note: "♩", color: "#FFB300", left:  2, top: 78, txEnd: -240, tyEnd:   90, delay:  85, duration: 2.3, size: 26 },

  // ── Right edge — fly rightward ─────────────────────────────────────────
  { note: "♪", color: "#D2B48C", left: 97, top: 18, txEnd:  220, tyEnd:  -60, delay:  10, duration: 2.2, size: 32 },
  { note: "♫", color: "#FFB300", left: 98, top: 38, txEnd:  240, tyEnd:    0, delay:  75, duration: 2.4, size: 28 },
  { note: "♬", color: "#9E4B3E", left: 97, top: 58, txEnd:  220, tyEnd:   50, delay: 140, duration: 2.1, size: 30 },
  { note: "♩", color: "#A55B37", left: 98, top: 78, txEnd:  240, tyEnd:   90, delay:  45, duration: 2.3, size: 26 },

  // ── Corners — fly diagonally outward ──────────────────────────────────
  { note: "♫", color: "#FFB300", left:  5, top:  5, txEnd: -160, tyEnd: -180, delay:   0, duration: 2.5, size: 38 },
  { note: "♬", color: "#9E4B3E", left: 95, top:  5, txEnd:  160, tyEnd: -180, delay:  30, duration: 2.5, size: 38 },
  { note: "♩", color: "#FFB300", left:  5, top: 95, txEnd: -160, tyEnd:  180, delay:  60, duration: 2.5, size: 38 },
  { note: "♪", color: "#D2B48C", left: 95, top: 95, txEnd:  160, tyEnd:  180, delay:  90, duration: 2.5, size: 38 },
];

export interface OnboardingModalProps {
  onDismiss: () => void;
}

/**
 * OnboardingModal — 4-slide carousel overlay.
 * On "Get Started": shows a celebration screen with welcome message,
 * Lottie confetti animation, and musical note particles.
 * Dismisses automatically when the Lottie completes.
 */
export function OnboardingModal({ onDismiss }: OnboardingModalProps) {
  const [current, setCurrent] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const [celebrating, setCelebrating] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Mount animation: fade + scale 95%→100%
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Auto-dismiss after note burst: longest particle is 140ms delay + 2.5s duration = ~2.7s
  React.useEffect(() => {
    if (celebrating) {
      const id = setTimeout(onDismiss, 4500);
      return () => clearTimeout(id);
    }
  }, [celebrating, onDismiss]);

  // Focus card on mount; Escape closes
  React.useEffect(() => {
    cardRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onDismiss]);

  const slide = SLIDES[current];
  const isFirst = current === 0;
  const isLast = current === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      setCelebrating(true);
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) setCurrent((c) => c - 1);
  };

  // ─── Celebration screen ──────────────────────────────────────────────────
  if (celebrating) {
    return (
      <>
        <style>{`
          ${PARTICLES.map((p, i) => `
            @keyframes hf-note-float-${i} {
              0%   { transform: translate(0, 0) scale(1);   opacity: 1; }
              100% { transform: translate(${p.txEnd}px, ${p.tyEnd}px) scale(0.2); opacity: 0; }
            }
          `).join("")}
          @keyframes hf-welcome-in {
            0%   { opacity: 0; transform: translateY(16px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Full-screen celebration overlay */}
        <div
          className="fixed inset-0 z-[10120] flex flex-col items-center justify-center"
          style={{ backgroundColor: "rgba(253,245,230,0.96)" }}
          role="status"
          aria-live="polite"
          aria-label="Welcome to HarmonyForge"
        >
          {/* Musical note particles — container matches card dimensions so % positions map to card edges */}
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            aria-hidden="true"
          >
            <div style={{ position: "relative", width: 512, height: 480 }}>
              {PARTICLES.map((p, i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${p.left}%`,
                    top: `${p.top}%`,
                    fontSize: p.size,
                    color: p.color,
                    animation: `hf-note-float-${i} ${p.duration}s ease-out ${p.delay}ms forwards`,
                    pointerEvents: "none",
                    userSelect: "none",
                    lineHeight: 1,
                  }}
                >
                  {p.note}
                </span>
              ))}
            </div>
          </div>

          {/* Welcome message */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              animation: "hf-welcome-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
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
              Welcome to<br />HarmonyForge
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
              You’re all set—upload a score whenever you’re ready.
            </p>
          </div>
        </div>
      </>
    );
  }

  // ─── Normal carousel ─────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes hf-card-pulse {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Overlay */}
      <div
        className="fixed inset-0 z-[10120] flex items-center justify-center"
        style={{
          backgroundColor: "rgba(0,0,0,0.4)",
          opacity: visible ? 1 : 0,
          transition: "opacity 200ms ease-out",
        }}
        role="presentation"
      >
        {/* Card */}
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-label="HarmonyForge Onboarding"
          tabIndex={-1}
          className="flex flex-col focus:outline-none"
          style={{
            width: 512,
            backgroundColor: "#F5F0EF",
            borderRadius: 4,
            padding: 12,
            border: "1px solid #D2B48C",
            boxShadow: "0 24px 80px 0 rgba(45,24,23,0.31)",
            transform: visible ? "scale(1)" : "scale(0.95)",
            transition: "transform 200ms ease-out",
            position: "relative",
            overflow: "visible",
          }}
        >
          {/* CarouselZone */}
          <div
            style={{
              height: 275,
              borderRadius: 4,
              overflow: "hidden",
              position: "relative",
              background: `linear-gradient(315deg, ${slide.gradientFrom} 0%, ${slide.gradientTo} 100%)`,
            }}
          >
            {/* Inner card placeholder */}
            <div
              style={{
                position: "absolute",
                left: 73,
                top: 62,
                width: 342,
                height: 151,
                borderRadius: 4,
                backgroundColor: "rgba(158,75,62,0.10)",
              }}
            />
            {/* Label overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              aria-hidden="true"
            >
              <span
                style={{
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: 11,
                  fontWeight: 400,
                  color: "#D2B48C",
                }}
              >
                {slide.label}
              </span>
            </div>
          </div>

          {/* Spacer 16 */}
          <div style={{ height: 16 }} />

          {/* DotsRow */}
          <div className="flex items-center justify-center" style={{ gap: 8, height: 28 }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setCurrent(i)}
                style={{
                  height: 8,
                  width: i === current ? 24 : 16,
                  borderRadius: 4,
                  backgroundColor: i === current ? "#FFB300" : "#D2B48C",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "width 200ms ease-out, background-color 200ms ease-out",
                }}
              />
            ))}
          </div>

          {/* Spacer 16 */}
          <div style={{ height: 16 }} />

          {/* TextZone */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 4px" }}>
            <h2
              style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: 23,
                fontWeight: 400,
                color: "#1A1A1A",
                margin: 0,
                transition: "opacity 240ms ease-out",
              }}
            >
              {slide.heading}
            </h2>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 16,
                fontWeight: 400,
                color: "#6B5740",
                lineHeight: 1.5,
                margin: 0,
                transition: "opacity 240ms ease-out",
              }}
            >
              {slide.body}
            </p>
          </div>

          {/* Spacer 24 */}
          <div style={{ height: 24 }} />

          {/* Footer */}
          <div
            className="flex items-center justify-between"
            style={{ height: 44, padding: "0 4px 4px 4px" }}
          >
            {/* Back */}
            <button
              onClick={handleBack}
              aria-label="Previous slide"
              style={{
                height: 44,
                display: "flex",
                alignItems: "center",
                background: "none",
                border: "none",
                cursor: isFirst ? "default" : "pointer",
                opacity: isFirst ? 0 : 1,
                pointerEvents: isFirst ? "none" : "auto",
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: "#6B5740",
                padding: 0,
                transition: "opacity 150ms ease-out",
              }}
            >
              Back
            </button>

            {/* Right zone: Skip + CTA */}
            <div className="flex items-center" style={{ gap: 8, height: 44 }}>
              <button
                onClick={onDismiss}
                aria-label="Skip onboarding"
                style={{
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#6B5740",
                  padding: 0,
                }}
              >
                Skip
              </button>

              {/* Next → / Get Started */}
              <button
                onClick={handleNext}
                aria-label={isLast ? "Get started with HarmonyForge" : "Next slide"}
                style={{
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                  padding: "0 16px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: slide.ctaStyle === "accent" ? "#FFB300" : "#9E4B3E",
                  color: slide.ctaStyle === "accent" ? "#1A1A1A" : "#FFFFFF",
                  transition: "background-color 150ms ease-out",
                }}
              >
                {slide.cta}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
