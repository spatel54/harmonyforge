"use client";

import React from "react";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface StepBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 1 = Playground, 2 = Document, 3 = Sandbox */
  currentStep: 1 | 2 | 3;
  /** Narrow pills (step number only); full step name in title/aria-label */
  compact?: boolean;
}

const STEPS = [
  { n: 1, label: "Playground", href: "/" },
  { n: 2, label: "Configure", href: "/document" },
  { n: 3, label: "Sandbox", href: "/sandbox" },
] as const;

/**
 * StepBar Molecule
 * Extracted from Pencil Node ID: CCRux ("StepBar")
 * Three-step progress indicator: done (amber pill + check), active (surface pill + dot), pending (dim).
 * Steps < currentStep → done. Step === currentStep → active. Steps > currentStep → pending.
 */
export const StepBar = React.forwardRef<HTMLDivElement, StepBarProps>(
  ({ currentStep, compact = false, className, ...props }, ref) => {
    const router = useRouter();
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-[8px]", className)}
        role="list"
        aria-label="Progress steps"
        {...props}
      >
        {STEPS.map((step, i) => {
          const isDone = step.n < currentStep;
          const isActive = step.n === currentStep;
          const isPending = step.n > currentStep;

          return (
            <React.Fragment key={step.n}>
              {/* Step pill */}
              <div
                role="listitem"
                aria-current={isActive ? "step" : undefined}
                aria-label={`${step.n} ${step.label}`}
                title={`${step.n} ${step.label}`}
                onClick={isDone ? () => router.push(step.href) : undefined}
                className={cn(
                  "flex items-center gap-[5px] rounded-full py-[6px]",
                  compact ? "px-[8px]" : "px-[12px]",
                  "font-mono text-[11px] font-medium leading-none whitespace-nowrap",
                  "transition-[transform,filter,box-shadow,background-color] duration-200 ease-out",
                  isDone &&
                    "bg-[var(--hf-accent)] cursor-pointer shadow-sm hover:brightness-[1.06] hover:shadow-md active:scale-[0.98]",
                  isActive && "bg-[var(--hf-surface)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--hf-accent)_35%,transparent)]",
                  isPending && "bg-[var(--hf-surface)]/40",
                )}
              >
                {isDone && (
                  <Check
                    className="w-3 h-3 shrink-0"
                    style={{ color: "#1a0f0c" }}
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                )}

                {isActive && (
                  <span
                    className="w-[6px] h-[6px] rounded-full shrink-0"
                    style={{ backgroundColor: "var(--hf-accent)" }}
                    aria-hidden="true"
                  />
                )}

                <span
                  style={{
                    color: isDone
                      ? "#1a0f0c"
                      : isActive
                        ? "#F5F0EF"
                        : "var(--hf-text-sub)",
                  }}
                >
                  {compact ? step.n : `${step.n} ${step.label}`}
                </span>
              </div>

              {/* Connector line between steps */}
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px shrink-0 transition-[background-color] duration-300 ease-out",
                    compact ? "w-[12px]" : "w-[24px]",
                  )}
                  style={{
                    backgroundColor:
                      step.n < currentStep
                        ? "var(--hf-accent)"
                        : "color-mix(in srgb, var(--hf-surface) 55%, transparent)",
                  }}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  },
);

StepBar.displayName = "StepBar";
