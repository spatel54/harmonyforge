"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { UploadPromptContent } from "@/components/molecules/UploadPromptContent";

export interface ScoreDropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  onFileDrop?: (files: FileList) => void;
}

/**
 * ScoreDropzone Organism
 * Extracted from Pencil Node IDs: ktaiB / 3Jfj4
 * Massive central dashed-border dropzone for importing MusicXML.
 */
export const ScoreDropzone = React.forwardRef<
  HTMLDivElement,
  ScoreDropzoneProps
>(({ className, onFileDrop, ...props }, ref) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(false);
    if (e.dataTransfer.files && onFileDrop) {
      onFileDrop(e.dataTransfer.files);
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        // Outer dimensions mimicking Node 80t2V central bounding box.
        // We set 1513px width to accommodate the stand (n4ubU), and let it center.
        "relative flex flex-col items-center w-full max-w-[1513px] mx-auto mt-auto",
        className,
      )}
      {...props}
    >
      {/* Node ktaiB: The massive 1439x648 Dropzone Canvas */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center w-full max-w-[1439px]",
          "h-[648px] rounded-t-[20px] z-10",
          "border-2 border-dashed transition-all duration-300",
          isHovered
            ? "border-[#2d1817] bg-[#7a6b69]/5 dark:border-white"
            : "border-[#7a6b69] border-opacity-50 hover:border-opacity-100",
        )}
      >
        <div className="absolute inset-0 -z-10 rounded-t-[20px] bg-linear-to-b from-[#fdf5e6] to-[#d2b48c] opacity-40 mix-blend-multiply dark:opacity-10" />
        <UploadPromptContent />
      </div>

      {/* Node n4ubU: The 1513x70 wooden stand base that the canvas rests inside/on top of. */}
      {/* We apply a negative margin so the canvas overlaps the top lip of the stand. */}
      <div className="relative flex justify-center w-full h-[70px] bg-[#dec7a7] rounded-[20px] overflow-hidden border border-black/10 z-0 -mt-[20px]">
        {/* Dark left accent rectangle (Node: 79ha5) */}
        <div className="absolute left-[50%] -translate-x-[20px] bottom-0 w-[48px] h-[390px] bg-[#1f1f1f] border border-black/10" />

        {/* Wooden accent center (Node: 1ZRgJ) */}
        <div className="absolute left-[50%] -translate-x-[60px] bottom-0 w-[82px] h-[288px] bg-[var(--sonata-detail, #d2b48c)] border border-black/10" />
      </div>
    </div>
  );
});

ScoreDropzone.displayName = "ScoreDropzone";
