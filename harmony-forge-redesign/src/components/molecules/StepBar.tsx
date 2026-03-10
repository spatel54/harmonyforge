"use client";

import React from "react";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface StepBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 1 = Playground, 2 = Document, 3 = Sandbox */
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { n: 1, label: "Playground", href: "/" },
  { n: 2, label: "Document", href: "/document" },
  { n: 3, label: "Sandbox", href: "/sandbox" },
] as const;

/**
 * StepBar Molecule
 * Extracted from Pencil Node ID: CCRux ("StepBar")
 * Three-step progress indicator: done (amber pill + check), active (surface pill + dot), pending (dim).
 * Steps < currentStep → done. Step === currentStep → active. Steps > currentStep → pending.
 */
export const StepBar = React.forwardRef<HTMLDivElement, StepBarProps>(
  ({ currentStep, className, ...props }, ref) => {
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
                onClick={isDone ? () => router.push(step.href) : undefined}
                className={cn(
                  "flex items-center gap-[5px] rounded-full px-[12px] py-[6px]",
                  "font-mono text-[11px] font-medium leading-none whitespace-nowrap",
                  isDone &&
                    "bg-[var(--hf-accent)] cursor-pointer hover:opacity-85 transition-opacity",
                  isActive && "bg-[var(--hf-surface)]",
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
                  {step.n} {step.label}
                </span>
              </div>

              {/* Connector line between steps */}
              {i < STEPS.length - 1 && (
                <div
                  className="w-[24px] h-[1px] shrink-0"
                  style={{
                    backgroundColor:
                      step.n < currentStep
                        ? "var(--hf-accent)"
                        : "var(--hf-surface)",
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
