import React from "react";
import { cn } from "@/lib/utils";
import { SmuflIcon } from "../atoms/SmuflIcon";
import { RiffScoreEditor } from "../score/RiffScoreEditor";
import { extractMusicXMLMetadata, parseMusicXML } from "@/lib/music/musicxmlParser";

export interface ScorePreviewPaneProps {
  /** Raw MusicXML — when provided, renders preview via RiffScoreEditor */
  musicXML?: string | null;
  /** Ref to the scrollable preview region (PNG export) */
  previewRootRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

export function ScorePreviewPane({ musicXML, previewRootRef, className }: ScorePreviewPaneProps) {
  const meta = React.useMemo(() => {
    if (!musicXML) return null;
    return extractMusicXMLMetadata(musicXML);
  }, [musicXML]);

  const score = React.useMemo(() => {
    if (!musicXML) return null;
    return parseMusicXML(musicXML);
  }, [musicXML]);

  return (
    <div
      className={cn(
        "flex flex-col w-[480px] h-[700px] shrink-0",
        "bg-[var(--hf-bg)] border-r border-[var(--hf-detail)] rounded-l-[8px]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-[60px] px-[24px] border-b border-[var(--hf-detail)] shrink-0">
        <h2 className="font-serif text-[18px] text-[var(--hf-text-primary)]">
          Score Preview
        </h2>
      </div>

      {/* Preview Area — RiffScoreEditor when musicXML provided, else placeholder */}
      <div className="flex-1 relative overflow-hidden bg-[#F8F3EA] dark:bg-[#1A1110] min-h-0">
        {score ? (
          <div ref={previewRootRef} className="absolute inset-0 overflow-auto">
            <RiffScoreEditor
              score={score}
              className="w-full min-h-full"
              presentation
            />
          </div>
        ) : (
          <>
            <div className="absolute inset-0 pointer-events-none opacity-60 dark:opacity-0 bg-gradient-to-br from-[#F0E8D8] to-[#E8DCB8]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
              <SmuflIcon
                name="duration-quarter"
                className="w-16 h-16 text-[var(--hf-text-primary)] mb-4"
              />
              <p className="font-mono text-xs text-[var(--hf-text-primary)]">
                Nothing to preview yet—upload or generate on the previous steps
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center justify-center h-[72px] gap-[4px] border-t border-[var(--hf-detail)] bg-[var(--hf-bg)] shrink-0 rounded-bl-[8px]">
        <span className="font-mono text-[10px] text-[var(--hf-text-primary)] opacity-50">
          {meta ? `${meta.title || "Score"} · ${meta.meta || "HarmonyForge"}` : "Export your score"}
        </span>
      </div>
    </div>
  );
}
