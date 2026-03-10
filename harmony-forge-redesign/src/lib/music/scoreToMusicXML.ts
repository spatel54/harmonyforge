/**
 * Serialize EditableScore to MusicXML (minimal timewise format).
 */

import type { EditableScore } from "./scoreTypes";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** "C4" -> step, alter, octave */
function pitchFromStr(pitch: string): { step: string; alter: number; octave: number } {
  const m = pitch.match(/^([A-G])(#|b)?(\d+)$/);
  if (!m) return { step: "C", alter: 0, octave: 4 };
  const step = m[1] ?? "C";
  const alter = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
  const octave = parseInt(m[3] ?? "4", 10);
  return { step, alter, octave };
}

/** Duration type to MusicXML duration (divisions) and type */
const DUR_MAP: Record<string, { divs: number; type: string }> = {
  w: { divs: 16, type: "whole" },
  h: { divs: 8, type: "half" },
  q: { divs: 4, type: "quarter" },
  "8": { divs: 2, type: "eighth" },
  "16": { divs: 1, type: "16th" },
  "32": { divs: 1, type: "32nd" },
};

export function scoreToMusicXML(score: EditableScore): string {
  const partList = score.parts
    .map(
      (p, i) =>
        `  <score-part id="P${i + 1}">
    <part-name>${esc(p.name)}</part-name>
  </score-part>`
    )
    .join("\n");

  const measures: string[] = [];
  const maxMeasures = Math.max(...score.parts.map((p) => p.measures.length), 1);

  for (let mIdx = 0; mIdx < maxMeasures; mIdx++) {
    const partEls = score.parts
      .map((p, pIdx) => {
        const measure = p.measures[mIdx];
        if (!measure) return `  <part id="P${pIdx + 1}">\n  </part>`;
        const noteEls = measure.notes
          .map((note) => {
            const { step, alter, octave } = pitchFromStr(note.pitch);
            const { divs, type } = DUR_MAP[note.duration] ?? { divs: 4, type: "quarter" };
            const alterEl = alter !== 0 ? `\n    <alter>${alter}</alter>` : "";
            return `    <note>
    <pitch>
      <step>${step}</step>${alterEl}
      <octave>${octave}</octave>
    </pitch>
    <duration>${divs}</duration>
    <type>${type}</type>
  </note>`;
          })
          .join("\n");
        const content =
          noteEls ||
          `    <note>
    <rest/>
    <duration>4</duration>
    <type>quarter</type>
  </note>`;
        return `  <part id="P${pIdx + 1}">
${content}
  </part>`;
      })
      .join("\n");
    measures.push(`  <measure number="${mIdx + 1}">
${partEls}
  </measure>`);
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-timewise
  PUBLIC "-//Recordare//DTD MusicXML 3.0 Timewise//EN"
  "http://www.musicxml.org/dtds/timewise.dtd">
<score-timewise version="3.0">
  <work>
    <work-title>HarmonyForge</work-title>
  </work>
  <part-list>
${partList}
  </part-list>
${measures.join("\n")}
</score-timewise>`;
}
