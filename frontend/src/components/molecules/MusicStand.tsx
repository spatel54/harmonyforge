import React from "react";
import { cn } from "@/lib/utils";

export type MusicStandProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * MusicStand Molecule
 * Pencil Node: fqxzb / 79ha5 / 1ZRgJ (inside Node 80t2V — PLAYGROUND LIGHT)
 * Scaled down to fit naturally inside the upload dropzone.
 * Shelf: 48px tall, max-w-[900px].
 */
export const MusicStand = React.forwardRef<HTMLDivElement, MusicStandProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex justify-center w-full max-w-[900px]",
          className,
        )}
        {...props}
      >
        {/* Curved stand shelf (Node: fqxzb) */}
        <div className="relative w-full h-[48px] bg-[#dec7a7] rounded-[16px] overflow-hidden border border-black/10">
          {/* Dark center spine (Node: 79ha5) */}
          <div className="absolute left-[50%] -translate-x-[14px] bottom-0 w-[28px] h-[220px] bg-[#1f1f1f] border border-black/10" />
          {/* Wooden accent (Node: 1ZRgJ) */}
          <div
            className="absolute left-[50%] -translate-x-[36px] bottom-0 w-[52px] h-[160px] border border-black/10"
            style={{ backgroundColor: "var(--sonata-detail, #d2b48c)" }}
          />
        </div>
      </div>
    );
  },
);

MusicStand.displayName = "MusicStand";
