import { cn } from "@/lib/utils";
import { BrandTitle } from "@/components/atoms/BrandTitle";

export type PlaygroundHeroBrandProps = {
  titleClassName?: string;
  className?: string;
};

/**
 * Playground hero: integrated HarmonyForge wordmark (monogram as leading “H”).
 */
export function PlaygroundHeroBrand({
  titleClassName,
  className,
}: PlaygroundHeroBrandProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="hf-playground-title-wrap">
        <BrandTitle className={cn("text-center justify-center", titleClassName)} />
      </div>
    </div>
  );
}
