import Image from "next/image";
import { cn } from "@/lib/utils";

export type LogoMarkSize = 16 | 32 | 64 | 128 | 256;

const LOGO_SRC: Record<LogoMarkSize, string> = {
  16: "/brand/logo-16.png",
  32: "/brand/logo-32.png",
  64: "/brand/logo-64.png",
  128: "/brand/logo-128.png",
  256: "/brand/logo-256.png",
};

export type LogoMarkProps = {
  size?: LogoMarkSize;
  className?: string;
  priority?: boolean;
};

/**
 * HarmonyForge HF monogram mark (white glyph on black plate, PNG raster).
 */
export function LogoMark({ size = 32, className, priority = false }: LogoMarkProps) {
  return (
    <Image
      src={LOGO_SRC[size]}
      alt=""
      width={size}
      height={size}
      priority={priority}
      aria-hidden
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
