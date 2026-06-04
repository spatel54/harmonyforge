"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SmuflIcon } from "../atoms/SmuflIcon";
import { extractMusicXMLMetadata } from "@/lib/music/musicxmlParser";
import { renderOsmdExportScore } from "@/lib/music/osmdExportRender";
import { HARMONYFORGE_EXPORT_ATTRIBUTION } from "@/lib/sandbox/exportBranding";

export interface ScorePreviewPaneProps {
  /** Partwise MusicXML — rendered with the same OSMD path as PDF export. */
  musicXML?: string | null;
  className?: string;
}

export function ScorePreviewPane({ musicXML, className }: ScorePreviewPaneProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const renderGenRef = React.useRef(0);
  const [status, setStatus] = React.useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const meta = React.useMemo(() => {
    if (!musicXML) return null;
    return extractMusicXMLMetadata(musicXML);
  }, [musicXML]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!musicXML?.trim() || !container) {
      setStatus(musicXML ? "idle" : "idle");
      setErrorMessage(null);
      if (container) container.innerHTML = "";
      return;
    }

    const gen = ++renderGenRef.current;
    setStatus("loading");
    setErrorMessage(null);
    container.innerHTML = "";

    void renderOsmdExportScore(container, musicXML)
      .then(() => {
        if (renderGenRef.current !== gen) return;
        setStatus("ready");
      })
      .catch((err) => {
        if (renderGenRef.current !== gen) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Could not render PDF preview",
        );
      });

    return () => {
      renderGenRef.current += 1;
    };
  }, [musicXML]);

  return (
    <div
      className={cn(
        "flex flex-col flex-1 min-w-0 md:min-w-[520px] h-[min(360px,42vh)] md:h-[700px] shrink-0 min-h-0",
        "bg-[var(--hf-bg)] border-b md:border-b-0 md:border-r border-[color-mix(in_srgb,var(--hf-detail)_55%,transparent)]",
        "rounded-t-[12px] md:rounded-t-none md:rounded-l-[12px]",
        className,
      )}
    >
      <div className="flex items-center justify-between h-[56px] px-6 border-b border-[color-mix(in_srgb,var(--hf-detail)_70%,transparent)] shrink-0">
        <div className="flex flex-col gap-0.5">
          <h2
            id="export-modal-title"
            className="font-serif text-[17px] text-[var(--hf-text-primary)] leading-tight"
          >
            PDF preview
          </h2>
          <span className="font-sans text-[11px] text-[var(--hf-text-primary)] opacity-45">
            Same layout as print export
          </span>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden min-h-0 bg-[#F8F3EA] [color-scheme:light]">
        {musicXML ? (
          <>
            {status === "loading" && (
              <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 bg-[#F8F3EA]/90">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--hf-text-primary)] opacity-50" />
                <span className="font-mono text-[10px] text-[var(--hf-text-primary)] opacity-50">
                  Preparing preview…
                </span>
              </div>
            )}
            {status === "error" && (
              <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="font-mono text-xs text-amber-800/90">{errorMessage}</p>
              </div>
            )}
            <div
              ref={containerRef}
              className="hf-export-osmd-preview absolute inset-0 overflow-auto px-3 py-4"
            />
          </>
        ) : (
          <>
            <div className="absolute inset-0 pointer-events-none opacity-60 bg-gradient-to-br from-[#F0E8D8] to-[#E8DCB8]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-35 px-6 text-center">
              <SmuflIcon
                name="duration-quarter"
                className="w-14 h-14 text-[var(--hf-text-primary)] mb-3"
              />
              <p className="font-mono text-xs text-[var(--hf-text-primary)]">
                Open Export after your score is loaded
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col items-center justify-center min-h-[56px] py-2 px-4 gap-0.5 border-t border-[color-mix(in_srgb,var(--hf-detail)_70%,transparent)] bg-[var(--hf-bg)] shrink-0 md:rounded-bl-[12px]">
        <span className="font-mono text-[10px] text-[var(--hf-text-primary)] opacity-50 text-center leading-snug">
          {meta ? `${meta.title || "Score"} · ${meta.meta}` : "Export your score"}
        </span>
        {musicXML ? (
          <span className="hf-export-attribution text-[9px] tracking-[0.08em] opacity-90">
            {HARMONYFORGE_EXPORT_ATTRIBUTION}
          </span>
        ) : null}
      </div>
    </div>
  );
}
