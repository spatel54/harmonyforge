import type { LucideIcon } from "lucide-react";
import { Code, FileText, Headphones, Music2 } from "lucide-react";
import type { EditableScore } from "@/lib/music/scoreTypes";
import { scoreToPartwiseMusicXML } from "@/lib/music/scoreToMusicXML";
import { scoreToMidiBuffer } from "@/lib/music/scoreToMidi";
import { scoreToWavBuffer } from "@/lib/music/scoreToWav";
import { musicXmlForExportDisplay } from "@/lib/music/musicXmlExportDisplay";
import {
  HARMONYFORGE_EXPORT_ATTRIBUTION_LONG,
  HARMONYFORGE_EXPORT_BRAND,
  injectMusicXmlExportBranding,
} from "@/lib/sandbox/exportBranding";
import { useScoreDisplayStore } from "@/store/useScoreDisplayStore";

export const SANDBOX_EXPORT_FORMATS = [
  { id: "pdf", icon: FileText, label: "PDF", desc: "Print or save as PDF" },
  { id: "xml", icon: Code, label: "MusicXML", desc: "Open in other apps" },
  { id: "wav", icon: Headphones, label: "WAV", desc: "Rendered audio" },
  { id: "midi", icon: Music2, label: "MIDI", desc: "DAW-compatible" },
] as const;

export type SandboxExportFormatId = (typeof SANDBOX_EXPORT_FORMATS)[number]["id"];

export function isSandboxExportFormatId(
  value: string,
): value is SandboxExportFormatId {
  return SANDBOX_EXPORT_FORMATS.some((f) => f.id === value);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Partwise MusicXML + branding; harmony kept for export-preview toggles. */
export function scoreToBrandedExportMusicXML(
  score: EditableScore,
  sourceFileName?: string | null,
): string {
  const xml = scoreToPartwiseMusicXML(score, sourceFileName ?? undefined);
  return injectMusicXmlExportBranding(xml);
}

/** Partwise MusicXML for download and print — respects chord/letter display prefs. */
export function scoreToExportMusicXML(
  score: EditableScore,
  sourceFileName?: string | null,
): string {
  const branded = scoreToBrandedExportMusicXML(score, sourceFileName);
  const { showChordSymbols } = useScoreDisplayStore.getState();
  return musicXmlForExportDisplay(branded, { showChordSymbols });
}

export type RunSandboxExportOptions = {
  format: SandboxExportFormatId;
  score: EditableScore;
  sourceFileName?: string | null;
  onPrintPdf: () => void | Promise<void>;
};

/**
 * Run a single sandbox export. PDF invokes `onPrintPdf` (print dialog); caller
 * should close the export modal before printing when appropriate.
 */
export async function runSandboxExport(
  opts: RunSandboxExportOptions,
): Promise<void> {
  const { format, score, sourceFileName, onPrintPdf } = opts;
  const xml = scoreToExportMusicXML(score, sourceFileName);

  switch (format) {
    case "xml":
      downloadBlob(
        new Blob([xml], { type: "application/vnd.recordare.musicxml+xml" }),
        "harmony-forge-score.musicxml",
      );
      return;
    case "midi": {
      const mid = scoreToMidiBuffer(score, {
        attributionText: HARMONYFORGE_EXPORT_ATTRIBUTION_LONG,
      });
      downloadBlob(
        new Blob([new Uint8Array(mid)], { type: "audio/midi" }),
        "harmony-forge-score.mid",
      );
      return;
    }
    case "wav": {
      const ab = await scoreToWavBuffer(score, {
        softwareTag: HARMONYFORGE_EXPORT_BRAND,
      });
      downloadBlob(new Blob([ab], { type: "audio/wav" }), "harmony-forge-score.wav");
      return;
    }
    case "pdf":
      await onPrintPdf();
      return;
    default: {
      const _exhaustive: never = format;
      throw new Error(`Unsupported export format: ${_exhaustive}`);
    }
  }
}
