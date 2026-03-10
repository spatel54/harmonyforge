"use client";

import React, { useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { timewiseToPartwise } from "@/lib/music/timewiseToPartwise";

export interface OSMDPreviewProps {
  /** Raw MusicXML string to render */
  musicXML: string;
  className?: string;
  /** Minimum height for the container */
  minHeight?: number;
}

/**
 * Renders MusicXML sheet music using OpenSheetMusicDisplay.
 * Used for Document page preview and Sandbox display when raw MusicXML is available.
 * More reliable than custom parseMusicXML + VexFlow for displaying various MusicXML formats.
 */
export function OSMDPreview({ musicXML, className, minHeight = 280 }: OSMDPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!musicXML || !containerRef.current) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    let cancelled = false;

    if (osmdRef.current) {
      osmdRef.current.clear();
      osmdRef.current = null;
    }

    const container = containerRef.current;
    if (!container) return;

    const osmd = new OpenSheetMusicDisplay(container, {
      autoResize: true,
      drawTitle: true,
      drawComposer: false,
      drawCredits: false,
      backend: "svg",
    });

    osmdRef.current = osmd;

    const xmlForOsmd = timewiseToPartwise(musicXML);

    osmd
      .load(xmlForOsmd)
      .then(() => {
        if (cancelled || !container.isConnected) return;
        osmd.render();
        setIsLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("OSMD render error:", err);
          setError(err instanceof Error ? err.message : "Failed to render sheet music");
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (osmdRef.current) {
        osmdRef.current.clear();
        osmdRef.current = null;
      }
    };
  }, [musicXML]);

  return (
    <div
      className={className}
      style={{ minHeight, position: "relative", width: "100%", height: "100%" }}
    >
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: "var(--hf-text-secondary)", fontSize: "13px" }}
        >
          Loading sheet music…
        </div>
      )}
      {error && (
        <div
          className="absolute inset-0 flex items-center justify-center text-center px-4"
          style={{ color: "var(--hf-text-secondary)", fontSize: "13px" }}
        >
          {error}
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full overflow-auto"
        style={{
          minHeight,
          opacity: isLoading || error ? 0 : 1,
          pointerEvents: isLoading || error ? "none" : "auto",
        }}
      />
    </div>
  );
}
