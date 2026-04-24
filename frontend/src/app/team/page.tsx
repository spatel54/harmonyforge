"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence, type Variants } from "framer-motion";
import { ChevronDown, Sparkles, Wand2 } from "lucide-react";
import { PlaygroundBackground } from "@/components/organisms/PlaygroundBackground";
import { LogoLockup } from "@/components/atoms/LogoLockup";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { ActionTooltip } from "@/components/atoms/ActionTooltip";
import { cn } from "@/lib/utils";

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="underline underline-offset-2 decoration-[color-mix(in_srgb,var(--hf-surface)_55%,transparent)] hover:decoration-[var(--hf-surface)] transition-colors"
      style={{ color: "var(--hf-text-primary)" }}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

const easeOutSoft = [0.22, 1, 0.36, 1] as const;

type StackPill = { label: string; hint: string };

/** Grouped for scanning—same fifteen technologies as before. */
const STACK_GROUPS: readonly { groupLabel: string; pills: readonly StackPill[] }[] = [
  {
    groupLabel: "App & interface",
    pills: [
      {
        label: "Next.js",
        hint: "App Router, React Server Components, route handlers, and the API surface that wraps the engine.",
      },
      {
        label: "React",
        hint: "Component model for Document, Sandbox, Inspector, and shared design-system atoms.",
      },
      {
        label: "TypeScript",
        hint: "Types from UI through adapters into engine helpers—fewer surprises across the codebase.",
      },
      {
        label: "Tailwind CSS",
        hint: "Token-driven layout, dark/light themes, and responsive polish without one-off CSS sprawl.",
      },
      {
        label: "Framer Motion",
        hint: "Page and control motion with reduced-motion respect where it matters.",
      },
      {
        label: "Zustand",
        hint: "Score and UI stores with persistence where arrangers need their settings to stick.",
      },
    ],
  },
  {
    groupLabel: "Notation & sound",
    pills: [
      {
        label: "SATB engine",
        hint: "Deterministic harmony search and voicing rules—the Glass Box heart of HarmonyForge.",
      },
      {
        label: "RiffScore",
        hint: "Primary notation editor, selection sync, palette tools, and playback integration.",
      },
      {
        label: "Tone.js",
        hint: "Audio context unlock, metering, routing, and preview playback on Document and Sandbox.",
      },
      {
        label: "PDF.js",
        hint: "In-browser PDF rasterization for previews and intake when scores arrive as print files.",
      },
    ],
  },
  {
    groupLabel: "Inspector, safety & ship",
    pills: [
      {
        label: "LangChain",
        hint: "Server-side LLM orchestration for Theory Inspector routes—chains, tools, grounded replies.",
      },
      {
        label: "react-markdown",
        hint: "Renders tutor and chat copy from the Inspector with safe, readable formatting.",
      },
      {
        label: "Zod",
        hint: "Runtime validation on configs, uploads, and API payloads at the boundaries.",
      },
      {
        label: "Vitest",
        hint: "Fast unit tests for the engine, adapters, parsers, and critical client utilities.",
      },
      {
        label: "Docker",
        hint: "Optional all-in-one deploy image bundling Node, engine, and PDF-friendly tooling.",
      },
    ],
  },
];

function PillStrip({
  pills,
  prefersReducedMotion,
  ariaLabel,
}: {
  pills: readonly StackPill[];
  prefersReducedMotion: boolean;
  ariaLabel: string;
}) {
  return (
    <div
      className="flex flex-wrap justify-center gap-2"
      aria-label={ariaLabel}
      role="list"
    >
      {pills.map(({ label, hint }) => (
        <motion.span
          key={label}
          role="listitem"
          whileHover={
            prefersReducedMotion
              ? undefined
              : { scale: 1.06, rotate: [-1, 1, 0], transition: { duration: 0.35 } }
          }
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
          className="inline-flex"
        >
          <ActionTooltip content={hint}>
            <button
              type="button"
              className={cn(
                "hf-pressable cursor-default select-none font-mono text-[10px] sm:text-[11px] font-medium px-2.5 py-1 rounded-full border shadow-sm text-left",
              )}
              style={{
                borderColor: "var(--hf-detail)",
                backgroundColor: "color-mix(in srgb, var(--hf-surface) 12%, transparent)",
                color: "var(--hf-text-primary)",
              }}
              aria-label={`${label}: ${hint}`}
            >
              {label}
            </button>
          </ActionTooltip>
        </motion.span>
      ))}
    </div>
  );
}

function StackOverview({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  return (
    <div className="space-y-5 text-left sm:text-center">
      <div className="space-y-1.5 sm:text-center">
        <p
          className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-60"
          style={{ color: "var(--hf-text-secondary)" }}
        >
          Product stack
        </p>
        <p className="font-mono text-[11px] sm:text-xs leading-snug opacity-75 max-w-md sm:mx-auto">
          What runs in HarmonyForge today. Hover or focus a tag for a one-line note on how we use
          it.
        </p>
      </div>
      <div className="grid gap-5 sm:gap-6 max-w-3xl mx-auto">
        {STACK_GROUPS.map(({ groupLabel, pills }) => (
          <div
            key={groupLabel}
            className="rounded-xl border px-3 py-3 sm:px-4 sm:py-3.5"
            style={{
              borderColor: "var(--hf-detail)",
              backgroundColor: "color-mix(in srgb, var(--hf-surface) 5%, transparent)",
            }}
          >
            <p
              className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.16em] mb-2.5 opacity-70"
              style={{ color: "var(--hf-text-secondary)" }}
            >
              {groupLabel}
            </p>
            <PillStrip
              pills={pills}
              prefersReducedMotion={prefersReducedMotion}
              ariaLabel={`${groupLabel} technologies`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type SkillBundle = { heading: string; items: string[] };

function SkillBundles({
  bundles,
  prefersReducedMotion,
  gridClassName,
}: {
  bundles: SkillBundle[];
  prefersReducedMotion: boolean;
  gridClassName?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 grid-cols-1 sm:grid-cols-3 sm:gap-3",
        gridClassName,
      )}
    >
      {bundles.map((b) => (
        <div
          key={b.heading}
          className="rounded-xl border px-3 py-3 sm:px-3.5 sm:py-3.5"
          style={{
            borderColor: "var(--hf-detail)",
            backgroundColor: "color-mix(in srgb, var(--hf-surface) 8%, transparent)",
          }}
        >
          <h3
            className="font-mono text-[10px] uppercase tracking-[0.12em] mb-2.5 opacity-75"
            style={{ color: "var(--hf-text-primary)" }}
          >
            {b.heading}
          </h3>
          <ul className="flex flex-wrap gap-1.5 list-none m-0 p-0">
            {b.items.map((item) => (
              <motion.li
                key={item}
                whileHover={
                  prefersReducedMotion
                    ? undefined
                    : { y: -2, transition: { type: "spring", stiffness: 400, damping: 18 } }
                }
              >
                <span
                  className="inline-block font-mono text-[10px] sm:text-[11px] leading-tight px-2 py-1 rounded-md"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--hf-accent) 14%, transparent)",
                    color: "var(--hf-text-primary)",
                  }}
                >
                  {item}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ExpandableQuote({
  teaser,
  children,
  prefersReducedMotion,
}: {
  teaser: string;
  children: React.ReactNode;
  prefersReducedMotion: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const contentId = React.useId();

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: "var(--hf-detail)",
        backgroundColor: "color-mix(in srgb, var(--hf-surface) 5%, transparent)",
      }}
    >
      <blockquote
        id={contentId}
        className="font-mono text-sm leading-relaxed m-0 px-4 py-3 italic opacity-95 border-l-4"
        style={{
          borderColor: "var(--hf-surface)",
          color: "var(--hf-text-primary)",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={open ? "full" : "teaser"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
          >
            {open ? children : <span>{teaser}</span>}
          </motion.div>
        </AnimatePresence>
      </blockquote>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="hf-pressable w-full flex items-center justify-center gap-1.5 font-mono text-[10px] sm:text-[11px] py-2.5 border-t opacity-85 hover:opacity-100"
        style={{
          borderColor: "var(--hf-detail)",
          color: "var(--hf-text-secondary)",
          backgroundColor: "color-mix(in srgb, var(--hf-surface) 6%, transparent)",
        }}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
        >
          <ChevronDown className="w-3.5 h-3.5" aria-hidden />
        </motion.span>
        {open ? "Show shorter excerpt" : "Read full quote"}
      </button>
    </div>
  );
}

function ProfileBody({
  prefersReducedMotion,
  titleId,
  name,
  role,
  image,
  children,
  collapsible = false,
}: {
  prefersReducedMotion: boolean;
  titleId: string;
  name: string;
  role: string;
  image: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const [detailsOpen, setDetailsOpen] = React.useState(true);
  const detailsId = React.useId();

  return (
    <motion.article
      className="group rounded-2xl border p-6 sm:p-8 space-y-5 shadow-sm transition-[box-shadow,border-color] duration-300 hover:shadow-[0_12px_40px_-12px_color-mix(in_srgb,var(--hf-surface)_45%,transparent)]"
      style={{
        borderColor: "var(--hf-detail)",
        backgroundColor: "color-mix(in srgb, var(--hf-surface) 6%, transparent)",
      }}
      whileHover={
        prefersReducedMotion
          ? undefined
          : { y: -4, transition: { duration: 0.28, ease: "easeOut" } }
      }
      whileTap={prefersReducedMotion ? undefined : { scale: 0.995 }}
    >
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
        <motion.div
          className="shrink-0 mx-auto sm:mx-0 rounded-2xl overflow-hidden will-change-transform"
          style={{
            boxShadow: "0 0 0 0 color-mix(in srgb, var(--hf-accent) 0%, transparent)",
          }}
          whileHover={
            prefersReducedMotion
              ? undefined
              : {
                  scale: 1.04,
                  boxShadow:
                    "0 0 0 3px color-mix(in srgb, var(--hf-accent) 35%, transparent)",
                  transition: { duration: 0.3, ease: "easeOut" },
                }
          }
        >
          {image}
        </motion.div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 id={titleId} className="font-brand text-2xl font-normal">
                {name}
              </h2>
              <p className="font-mono text-xs sm:text-sm mt-1 opacity-85">{role}</p>
              {collapsible && !detailsOpen ? (
                <p
                  className="font-mono text-[10px] sm:text-[11px] mt-2.5 leading-snug opacity-70"
                  style={{ color: "var(--hf-text-secondary)" }}
                >
                  Bio, skill chips, and the long quote are tucked in here. Open up when you want the
                  full story.
                </p>
              ) : null}
            </div>
            {collapsible ? (
              <button
                type="button"
                onClick={() => setDetailsOpen((v) => !v)}
                aria-expanded={detailsOpen}
                aria-controls={detailsId}
                aria-label={
                  detailsOpen
                    ? `Hide profile details for ${name}`
                    : `Show profile details for ${name}`
                }
                className="hf-pressable self-start sm:self-auto flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 font-mono text-[10px] sm:text-[11px] opacity-90 hover:opacity-100 w-full sm:w-auto"
                style={{
                  borderColor: "var(--hf-detail)",
                  backgroundColor: "color-mix(in srgb, var(--hf-surface) 10%, transparent)",
                  color: "var(--hf-text-secondary)",
                }}
              >
                <span className="inline-flex items-center gap-1.5" aria-hidden>
                  <motion.span
                    animate={{ rotate: detailsOpen ? 180 : 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.28 }}
                    className="inline-flex"
                  >
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  </motion.span>
                  <span className="hidden sm:inline">
                    {detailsOpen ? "Hide details" : "Show details"}
                  </span>
                  <span className="sm:hidden">{detailsOpen ? "Hide" : "Show"}</span>
                </span>
              </button>
            ) : null}
          </div>
          <div
            id={detailsId}
            inert={collapsible && !detailsOpen ? true : undefined}
            className={cn(
              "overflow-hidden transition-[max-height,opacity] ease-out",
              prefersReducedMotion ? "duration-0" : "duration-500",
              detailsOpen || !collapsible
                ? "max-h-[min(10000px,200vh)] opacity-100"
                : "max-h-0 opacity-0 pointer-events-none",
            )}
          >
            <div
              className={cn(
                "space-y-4",
                collapsible &&
                  "pt-1 border-t border-[var(--hf-detail)] sm:border-t-0 sm:pt-0",
              )}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function JumpAvatars({
  prefersReducedMotion,
}: {
  prefersReducedMotion: boolean;
}) {
  const go = (hash: string) => {
    document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const chip = (targetId: string, label: string, src: string) => (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        type="button"
        onClick={() => go(targetId)}
        className="hf-pressable rounded-full ring-2 ring-[color-mix(in_srgb,var(--hf-accent)_45%,transparent)] ring-offset-2 ring-offset-[var(--hf-bg)] focus-visible:outline-none focus-visible:ring-[var(--hf-accent)]"
        whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
        aria-label={`Scroll to ${label}'s profile`}
      >
        <Image
          src={src}
          alt=""
          width={40}
          height={40}
          className="rounded-full object-cover w-10 h-10 border border-[var(--hf-detail)]"
        />
      </motion.button>
      <span className="font-mono text-[9px] opacity-65" aria-hidden>
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-2 pt-2">
      <span className="font-mono text-[10px] opacity-60 text-center max-w-[14rem]">
        Pick a builder, or just scroll and wander
      </span>
      <div className="flex items-start justify-center gap-5">
        {chip("creator-dulf", "Dulf", "/creators/dulf.jpg")}
        {chip("creator-shivam", "Shivam", "/creators/shivam-patel.jpg")}
      </div>
    </div>
  );
}

const DULF_SKILLS: SkillBundle[] = [
  {
    heading: "Engine & APIs",
    items: [
      "SATB generation",
      "Symbolic score pipelines",
      "Route handlers",
      "Performance budgets",
      "Docker / deploy",
    ],
  },
  {
    heading: "Theory in software",
    items: ["Voicing rules", "Solver tuning", "Score validation", "Constraint design"],
  },
  {
    heading: "Shipping with care",
    items: [
      "Test & API gates",
      "LangChain inspector routes",
      "Cursor-deep refactors",
      "Contract-clear integrations",
    ],
  },
];

const SHIVAM_SKILLS: SkillBundle[] = [
  {
    heading: "Product & UI",
    items: ["Next.js", "Design tokens", "Responsive layout", "Motion & polish", "Accessible patterns"],
  },
  {
    heading: "Notation surface",
    items: ["RiffScore bridge", "Zustand state", "Playback UX", "Export / print chrome"],
  },
  {
    heading: "Design × code",
    items: [
      "Figma → implementation",
      "Claude-forward UI passes",
      "Microcopy sweeps",
      "Pre-ship polish rounds",
    ],
  },
];

function TeamFooterNav({ itemVariants }: { itemVariants: Variants }) {
  const linkClass =
    "font-mono text-xs opacity-80 hover:opacity-100 underline underline-offset-2 transition-opacity hf-pressable rounded-sm px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-bg)]";

  return (
    <motion.nav
      variants={itemVariants}
      className="flex flex-col items-center gap-4 pt-4 border-t"
      style={{ borderColor: "var(--hf-detail)" }}
      aria-label="Continue in HarmonyForge"
    >
      <div className="text-center space-y-1.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] opacity-55">
          What&apos;s next
        </p>
        <p className="font-mono text-[11px] opacity-60 leading-snug max-w-sm mx-auto">
          Scores are serious work. The humans behind them can still be a little playful.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <Link href="/" className={linkClass} style={{ color: "var(--hf-text-primary)" }}>
          ← Home / Playground
        </Link>
        <span className="hidden sm:inline font-mono text-xs opacity-35" aria-hidden>
          ·
        </span>
        <Link href="/document" className={linkClass} style={{ color: "var(--hf-text-primary)" }}>
          Document &amp; generate
        </Link>
        <span className="hidden sm:inline font-mono text-xs opacity-35" aria-hidden>
          ·
        </span>
        <Link href="/sandbox" className={linkClass} style={{ color: "var(--hf-text-primary)" }}>
          Sandbox editor
        </Link>
      </div>
    </motion.nav>
  );
}

export default function TeamPage() {
  const reducedMotion = useReducedMotion();
  const prefersReducedMotion = reducedMotion === true;

  const itemVariants: Variants = prefersReducedMotion
    ? {
        hidden: { opacity: 1, y: 0 },
        visible: { opacity: 1, y: 0 },
      }
    : {
        hidden: { opacity: 0, y: 22 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.52, ease: easeOutSoft },
        },
      };

  const listVariants: Variants = {
    hidden: {},
    visible: {
      transition: prefersReducedMotion
        ? {}
        : { staggerChildren: 0.09, delayChildren: 0.05 },
    },
  };

  return (
    <PlaygroundBackground className="flex flex-col min-h-screen relative z-0">
      <motion.header
        initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeOutSoft }}
        className="hf-sandbox-header hf-print-hide flex items-center justify-between w-full h-[64px] shrink-0 px-4 sm:px-6 md:px-10 lg:px-[40px] gap-2"
        style={{ borderBottom: "1px solid var(--hf-detail)" }}
      >
        <Link
          href="/"
          className="min-w-0 shrink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-bg)] rounded-md hf-pressable inline-flex"
        >
          <LogoLockup className="cursor-pointer" />
        </Link>
        <div className="min-w-0 flex-1 flex flex-col items-center justify-center px-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] opacity-50 mb-0.5 hidden sm:block">
            HarmonyForge
          </p>
          <h1
            className="font-brand text-lg sm:text-xl font-normal truncate w-full text-center"
            style={{ color: "var(--hf-text-primary)" }}
          >
            Team &amp; credits
          </h1>
          <p className="font-mono text-[10px] sm:text-[11px] opacity-70 text-center max-w-[20rem] sm:max-w-none leading-snug">
            Builders behind Playground, Configure, and Sandbox
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ActionTooltip content="Switch between light and dark appearance.">
            <ThemeToggle />
          </ActionTooltip>
        </div>
      </motion.header>

      <motion.main
        id="team-page-main"
        className="relative z-[1] w-full max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12 pb-20 space-y-12 sm:space-y-14"
        style={{ color: "var(--hf-text-primary)" }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-48px" }}
        variants={listVariants}
      >
        <motion.header variants={itemVariants} className="space-y-4 text-center max-w-2xl mx-auto">
          <motion.div
            className="inline-flex items-center justify-center gap-2 font-mono text-xs opacity-90 flex-wrap"
            animate={
              prefersReducedMotion ? undefined : { rotate: [0, -4, 4, 0] }
            }
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }
            }
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--hf-accent)] shrink-0" aria-hidden />
              <Wand2 className="w-3 h-3 text-[var(--hf-accent)] opacity-85 shrink-0" aria-hidden />
            </span>
            <span>Real people, real scores, harmony you can understand and trust.</span>
          </motion.div>
          <p className="font-mono text-sm leading-relaxed opacity-88">
            We&apos;re building notation tools with care: clear, rule-grounded algorithms (the same
            Glass Box idea as the product) and a calm interface that respects the musician at the
            desk. Below you&apos;ll meet us separately. Near the bottom we share how we fit as a pair,
            then the product stack and links. In a hurry? Collapse a card to skim, then open one when
            a story pulls you in.
          </p>
        </motion.header>

        <motion.div variants={itemVariants}>
          <JumpAvatars prefersReducedMotion={prefersReducedMotion} />
        </motion.div>

        <motion.section
          id="creator-dulf"
          aria-labelledby="dulf-title"
          variants={itemVariants}
          className="scroll-mt-24"
        >
          <ProfileBody
            prefersReducedMotion={prefersReducedMotion}
            titleId="dulf-title"
            name="Dulf Vincent Genis"
            role="Lead Fullstack · Backend & engine"
            collapsible
            image={
              <Image
                src="/creators/dulf.jpg"
                alt="Portrait of Dulf Vincent Genis"
                width={160}
                height={160}
                className="rounded-2xl object-cover w-[140px] h-[140px] sm:w-[160px] sm:h-[160px]"
                priority
              />
            }
          >
            <p className="font-mono text-sm leading-relaxed opacity-90">
              Dulf carries the path from upload to generated score: intake, symbolic pipelines, the
              SATB runtime, export glue, and the APIs that keep the editor and engine in sync. He
              spends his deepest engineering time in{" "}
              <strong className="font-semibold opacity-100">Cursor</strong>, in long file-grounded
              passes where <strong className="font-semibold opacity-100">LangChain</strong>-style
              server routes and the Theory Inspector stay tied to real tests and observable behavior,
              not vibes. He cares about{" "}
              <strong className="font-semibold opacity-100">theory-shaped correctness</strong>, tight
              boundaries around the solver, and{" "}
              <strong className="font-semibold opacity-100">kindness to future-you</strong> through
              regression gates, reviews, and refactors that won&apos;t embarrass the project next
              month, so players and teachers can trust what ships.
            </p>
            <SkillBundles bundles={DULF_SKILLS} prefersReducedMotion={prefersReducedMotion} />
            <p className="font-mono text-sm leading-relaxed opacity-88">
              Born in the Philippines and raised in the U.S., he studied Information Sciences & Data
              Science (Spanish minor) at{" "}
              <ExternalLink href="https://illinois.edu/">UIUC</ExternalLink>. Faith, family, and close
              friends keep him grounded. He sings and plays violin and piano, often in service of
              community on mission trips, at local gatherings, or with a string quartet learning a
              new chart together.
            </p>
            <ExpandableQuote
              prefersReducedMotion={prefersReducedMotion}
              teaser={
                "\u201cAI makes directions infinite—so choosing what actually matters is the skill. Professor Huang told us to pick \u2018personal best interest\u2019; that\u2019s the only reason HarmonyForge exists\u2026\u201d"
              }
            >
              The real turning point for me was realizing that since AI makes project possibilities
              virtually infinite, one&apos;s choice of direction is more important than ever.
              Professor Huang pushed us to pick a topic of &quot;personal best interest,&quot; and
              that advice is the only reason HarmonyForge exists today. If I had just chased a resume
              bullet point or a grade, I would&apos;ve mastered the tools, earned the A+, and
              forgotten everything a week after finals. Instead, I chose a path of inspiration over
              desperation, now continuing the project months after the class ended. The fact that
              I&apos;ll soon be able to play a Whitney Houston song with my string quartet—using
              parts that didn&apos;t exist until I built the tools to create them—is what keeps me
              excited and thrilled. It&apos;s a constant reminder that no matter how advanced the
              tech gets, the most important &quot;framework&quot; is actually caring about what
              you&apos;re building.
            </ExpandableQuote>
          </ProfileBody>
        </motion.section>

        <motion.section
          id="creator-shivam"
          aria-labelledby="shivam-title"
          variants={itemVariants}
          className="scroll-mt-24"
        >
          <ProfileBody
            prefersReducedMotion={prefersReducedMotion}
            titleId="shivam-title"
            name="Shivam Patel"
            role="Lead Fullstack · Frontend & product craft"
            collapsible
            image={
              <Image
                src="/creators/shivam-patel.jpg"
                alt="Portrait of Shivam Patel"
                width={160}
                height={160}
                className="rounded-2xl object-cover w-[140px] h-[140px] sm:w-[160px] sm:h-[160px]"
              />
            }
          >
            <p className="font-mono text-sm leading-relaxed opacity-90">
              Shivam shapes what musicians actually touch: the Next.js app, Document and Sandbox
              flows, RiffScore integration, Theory Inspector chrome, and the visual language that
              keeps dense scores legible. His longest creative loops run in{" "}
              <strong className="font-semibold opacity-100">Claude</strong> around interaction,
              motion, and copy, while <strong className="font-semibold opacity-100">Figma</strong> is
              where layouts prove they deserve to become components. He sweats{" "}
              <strong className="font-semibold opacity-100">notation-first UX</strong>, calm{" "}
              <strong className="font-semibold opacity-100">state architecture</strong>, responsive
              rhythm, and the quiet tactile detail in controls (the kind of thoughtfulness you notice
              in a well-made door handle), so a heavy score still feels approachable instead of
              hostile.
            </p>
            <SkillBundles bundles={SHIVAM_SKILLS} prefersReducedMotion={prefersReducedMotion} />
            <p className="font-mono text-sm leading-relaxed opacity-88">
              <ExternalLink href="https://www.linkedin.com/in/shivam-j-patel/">Shivam</ExternalLink>{" "}
              is a UX-minded builder (UIUC Information Sciences; product design internship at{" "}
              <ExternalLink href="https://www.microsoft.com/">Microsoft</ExternalLink>). Projects
              like GeoGroove and mentoring student builders keep him close to real people learning
              to ship their first good ideas.
            </p>
            <ExpandableQuote
              prefersReducedMotion={prefersReducedMotion}
              teaser={
                "\u201cThe gap to learn these tools is essentially zero—what changed was my mindset. Professor Huang pushed us to use AI in daily life, not only in code\u2026\u201d"
              }
            >
              In this age of AI, I learned how the knowledge gap to learn these tools is essentially
              zero. Through course discussions and live labs, I truly immersed myself in emerging
              technologies. Professor Huang always encouraged us to learn and try different AI tools
              not just for the sake of coding, but in our daily lives. That was the mindset shift I
              needed. As I started to do this, my relationship with these tools has changed. The
              semester long class project tied all these key learnings and insights together. I never
              thought I would be passionate about continuing a class project like HarmonyForge after
              the semester, but I have been fortunate enough to be part of a project that is
              groundbreaking, impactful, and allows me to apply what I learned in class in an
              actionable way. Ultimately, I learned that it does not take a genius to execute a great
              idea anymore. With the right tools, mindset, guidance, and foundation, the sky is the
              limit.
            </ExpandableQuote>
          </ProfileBody>
        </motion.section>

        <motion.section
          id="how-we-work-together"
          aria-labelledby="together-heading"
          variants={itemVariants}
          className="scroll-mt-24 rounded-2xl border p-6 sm:p-8 space-y-4"
          style={{
            borderColor: "var(--hf-detail)",
            backgroundColor: "color-mix(in srgb, var(--hf-surface) 7%, transparent)",
          }}
        >
          <h2
            id="together-heading"
            className="font-brand text-xl sm:text-2xl font-normal"
            style={{ color: "var(--hf-text-primary)" }}
          >
            How we work together
          </h2>
          <p className="font-mono text-sm leading-relaxed opacity-90">
            We&apos;re <strong className="font-semibold opacity-100">distinct</strong> on purpose.{" "}
            <strong className="font-semibold opacity-100">Dulf</strong> pulls the center of gravity
            toward the engine, intake, SATB runtime, exports, and the APIs that have to be correct.{" "}
            <strong className="font-semibold opacity-100">Shivam</strong> pulls it toward the product
            surface, notation UX, and the feel of every screen a musician actually lives in. We hold
            the same bar for honesty and Glass Box clarity. Different home bases mean neither of us
            has to be a generalist at everything.
          </p>
          <p className="font-mono text-sm leading-relaxed opacity-90">
            We still <strong className="font-semibold opacity-100">complement</strong> each other
            constantly. Dulf&apos;s day-to-day desk is{" "}
            <strong className="font-semibold opacity-100">Cursor</strong>. Shivam&apos;s is{" "}
            <strong className="font-semibold opacity-100">Claude</strong>. We meet in the middle with
            small, boring artifacts that save arguments, like repro steps, API sketches, acceptance
            notes, screen recordings, and failing cases. We share the same{" "}
            <strong className="font-semibold opacity-100">context engineering</strong> habits: tight
            prompts, curated excerpts, wiring assistants back to real files when answers need to stay
            grounded, and spec-driven development when it keeps acceptance and scope legible before
            implementation. We share the same instinct to do a short, source-first read together when
            neither of us wants to guess. When material sprawls, we also push{" "}
            <strong className="font-semibold opacity-100">RAG</strong>-style retrieval and{" "}
            <strong className="font-semibold opacity-100">state-of-the-art models</strong> toward what
            they&apos;re built for. <strong className="font-semibold opacity-100">NotebookLM</strong>{" "}
            and <strong className="font-semibold opacity-100">Google</strong>&apos;s AI-assisted
            research tooling are in that rotation. They are not load-bearing infrastructure for the
            product. They help us get citation-friendly, source-tied reads without pretending the
            tools think for us. None of that replaces judgment. It speeds alignment so the solver and
            the interface don&apos;t drift apart.
          </p>
        </motion.section>

        <motion.div variants={itemVariants} className="pt-2">
          <StackOverview prefersReducedMotion={prefersReducedMotion} />
        </motion.div>

        <TeamFooterNav itemVariants={itemVariants} />
      </motion.main>
    </PlaygroundBackground>
  );
}
