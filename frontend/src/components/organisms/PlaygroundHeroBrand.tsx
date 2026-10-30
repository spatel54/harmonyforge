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
        size={72}
        priority
        className="hf-playground-hero-mark w-[clamp(2.75rem,10vw,4.25rem)] h-auto"
      />
      <div className="hf-playground-title-wrap">
        <BrandTitle className={cn("text-center", titleClassName)} />
      </div>
    </div>
  );
}
