import { cn } from "@/lib/utils";
import {
  HF_LOGO_PATH_D,
  HF_LOGO_TRANSFORM,
  HF_LOGO_VIEWBOX,
} from "@/components/atoms/harmonyForgeLogoPath";

export type LogoMarkSize = 16 | 32 | 64 | 128 | 256 | number;

export type LogoMarkProps = {
  size?: LogoMarkSize;
  className?: string;
  /** Kept for call-site compatibility; inline SVG needs no fetch priority. */
  priority?: boolean;
};

/** Intrinsic aspect from the monogram viewBox (width / height). */
const HF_LOGO_ASPECT = 845.255 / 723.173;

/**
 * HarmonyForge HF monogram — transparent SVG with no background plate.
 * Fill tracks `--hf-text-primary` (Sonata dark / Nocturne light) so the mark
 * stays readable across theme switches.
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  const width = size;
  const height = Math.round(size / HF_LOGO_ASPECT);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={HF_LOGO_VIEWBOX}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      className={cn("hf-logo-mark shrink-0", className)}
    >
      <g transform={HF_LOGO_TRANSFORM} stroke="none">
        <path d={HF_LOGO_PATH_D} />
      </g>
    </svg>
  );
}
