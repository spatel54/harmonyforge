import { cn } from "@/lib/utils";
import { BrandTitle } from "@/components/atoms/BrandTitle";
import { LogoMark } from "@/components/atoms/LogoMark";

export type PlaygroundHeroBrandProps = {
  titleClassName?: string;
  className?: string;
};

/**
 * Playground hero: HF kit logo mark stacked above the HarmonyForge wordmark.
 */
export function PlaygroundHeroBrand({
  titleClassName,
  className,
}: PlaygroundHeroBrandProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4 sm:gap-5", className)}>
      <LogoMark
        size={128}
        priority
        className="hf-playground-hero-mark w-[clamp(4.5rem,18vw,7rem)] h-[clamp(4.5rem,18vw,7rem)] rounded-2xl"
      />
      <div className="hf-playground-title-wrap">
        <BrandTitle className={cn("text-center", titleClassName)} />
      </div>
    </div>
  );
}
