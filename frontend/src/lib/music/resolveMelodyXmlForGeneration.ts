import type { EditableScore, Note } from "@/lib/music/scoreTypes";
import { scoreToPartwiseMusicXML } from "@/lib/music/scoreToMusicXML";

function noteFingerprint(note: Note): string {
  if (note.isRest) return "";
  return `${note.pitch}:${note.duration}:${note.dots ?? 0}:${note.tie ?? ""}`;
}

/** Sounding-note content only — rest padding from RiffScore must not count as an edit. */
export function soundingMelodyFingerprint(score: EditableScore): string {
  return score.parts
    .map((part) =>
      part.measures
        .map((measure) =>
          measure.notes
            .map(noteFingerprint)
            .filter((s) => s.length > 0)
            .join(","),
        )
        .join("|"),
    )
    .join("/");
}

function withBaselineMeasureMeta(
  live: EditableScore,
  baseline?: EditableScore | null,
): EditableScore {
  if (!baseline) return live;
  return {
    ...live,
    bpm: live.bpm ?? baseline.bpm,
    parts: live.parts.map((part, pi) => {
      const bPart = baseline.parts[pi];
      if (!bPart) return part;
      return {
        ...part,
        clef: part.clef ?? bPart.clef,
        measures: part.measures.map((measure, mi) => {
          const bm = bPart.measures[mi];
          if (!bm) return measure;
          return {
            ...measure,
            timeSignature: measure.timeSignature ?? bm.timeSignature,
            keySignature: measure.keySignature ?? bm.keySignature,
          };
        }),
      };
    }),
  };
}

/**
 * MusicXML sent to generate-from-file / melody-only sandbox.
 * Prefer the live Document editor score only when sounding notes differ from the
 * intake baseline — otherwise keep the original preview XML / upload (OMR fidelity).
 */
export function resolveMelodyXmlForGeneration(opts: {
  liveScore: EditableScore | null | undefined;
  baselineScore?: EditableScore | null;
  previewXml: string | null | undefined;
  title?: string | null;
}): string | null {
  const live = opts.liveScore;
  const baseline = opts.baselineScore;
  if (live && live.parts.length > 0) {
    const edited =
      !baseline ||
      soundingMelodyFingerprint(live) !== soundingMelodyFingerprint(baseline);
    if (edited) {
      const xml = scoreToPartwiseMusicXML(withBaselineMeasureMeta(live, baseline), opts.title);
      if (xml.trim().length > 0) return xml;
    }
  }
  const preview = opts.previewXml?.trim();
  return preview && preview.length > 0 ? preview : null;
}
