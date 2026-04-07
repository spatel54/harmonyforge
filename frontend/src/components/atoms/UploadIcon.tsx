import React from "react";
import { cn } from "@/lib/utils";

export type UploadIconProps = React.SVGProps<SVGSVGElement>;

/**
 * UploadIcon Atom
 * Extracted from Pencil Node ID: AP3r2/TkOWZ
 * Raw geometry implies a centered arrow + base line.
 */
export const UploadIcon = React.forwardRef<SVGSVGElement, UploadIconProps>(
  ({ className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("transition-colors duration-200", className)}
        {...props}
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
    );
  },
);

UploadIcon.displayName = "UploadIcon";
