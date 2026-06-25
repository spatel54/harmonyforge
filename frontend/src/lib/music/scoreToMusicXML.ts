/**
 * Serialize EditableScore to MusicXML (minimal timewise format).
 */

import type { BarlineStyle, EditableScore, Note } from "./scoreTypes";
import { chordSymbolToHarmonyXml } from "./chordSymbolFormat";
import { noteBeats } from "./scoreUtils";
import { riffQuantsForMeasure } from "./playbackScrub";

function measureGlobalQuantStart(score: EditableScore, measureIndex: number): number {
  let q = 0;
  for (let i = 0; i < measureIndex; i++) {
    q += riffQuantsForMeasure(score, i);
  }
  return q;
}

/** Indented `<harmony>` for timewise export. */
function indentedHarmonyXml(symbol: string): string {
  return chordSymbolToHarmonyXml(symbol)
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");
}

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

/** Duration type to MusicXML duration (divisions) and type — used by scoreToMusicXML (DIVISIONS=4). */
const DUR_MAP: Record<string, { divs: number; type: string }> = {
  w: { divs: 16, type: "whole" },
  h: { divs: 8, type: "half" },
  q: { divs: 4, type: "quarter" },
  "8": { divs: 2, type: "eighth" },
  "16": { divs: 1, type: "16th" },
  "32": { divs: 1, type: "32nd" },
};

function clefAttrs(clef: string): { sign: string; line: number } {
  if (clef === "bass") return { sign: "F", line: 4 };
  if (clef === "alto") return { sign: "C", line: 3 };
  if (clef === "tenor") return { sign: "C", line: 4 };
  return { sign: "G", line: 2 };
}

const MUSICXML_BAR_STYLE: Record<Exclude<BarlineStyle, "normal">, string> = {
  double: "light-light",
  final: "light-heavy",
  "start-repeat": "heavy-light",
  "end-repeat": "light-heavy",
  dashed: "dashed",
  tick: "tick",
};

/** End-of-piece thin + heavy bar unless the measure already has an explicit barline. */
export function effectiveMeasureBarline(
  barline: BarlineStyle | undefined,
  isLastMeasure: boolean,
): BarlineStyle | undefined {
  if (barline && barline !== "normal") return barline;
  if (isLastMeasure) return "final";
  return undefined;
}

function musicXmlBarlineLines(barline: BarlineStyle | undefined): string[] {
  if (!barline || barline === "normal") return [];
  const barStyle = MUSICXML_BAR_STYLE[barline];
  if (!barStyle) return [];
  const repeatEl =
    barline === "start-repeat"
      ? '\n        <repeat direction="forward"/>'
      : barline === "end-repeat"
        ? '\n        <repeat direction="backward"/>'
        : "";
  return [
    `      <barline location="right">
        <bar-style>${barStyle}</bar-style>${repeatEl}
      </barline>`,
  ];
}

// ── partwise serialization helpers ───────────────────────────────────────────

/**
 * DIVISIONS=8 lets us represent every duration down to 32nd notes as integers.
 * w=32  h=16  q=8  8th=4  16th=2  32nd=1
 */
const PW_DIVS: Record<string, number> = {
  w: 32, h: 16, q: 8, "8": 4, "16": 2, "32": 1,
};
const PW_TYPES: Record<string, string> = {
  w: "whole", h: "half", q: "quarter", "8": "eighth", "16": "16th", "32": "32nd",
};

function pwNoteDivs(note: Note): number {
  const base = PW_DIVS[note.duration] ?? 8;
  if (!note.dots) return base;
  if (note.dots === 1) return Math.round(base * 1.5);
  if (note.dots >= 2) return Math.round(base * 1.75);
  return base;
}

type BeamTag = { number: number; value: "begin" | "continue" | "end" };

const BEAM_LEVEL_BY_DURATION: Record<string, number> = {
  "8": 1,
  "16": 2,
  "32": 3,
};

function maxBeamLevel(note: Note): number {
  if (note.isRest) return 0;
  return BEAM_LEVEL_BY_DURATION[note.duration] ?? 0;
}

/** Beat length in quarter-note units for primary beam grouping. */
function beamBeatLength(timeSignature: string): number {
  const m = timeSignature.match(/^(\d+)\s*\/\s*(\d+)$/);
  const beats = Number.parseInt(m?.[1] ?? "4", 10);
  const beatType = Number.parseInt(m?.[2] ?? "4", 10);
  if (!Number.isFinite(beats) || !Number.isFinite(beatType) || beatType <= 0) return 1;
  // Compound meters (6/8, 9/8, 12/8): beam by dotted-quarter beat.
  if (beatType === 8 && beats % 3 === 0) return 1.5;
  return 4 / beatType;
}

function formatBeamXml(tags: BeamTag[] | undefined): string {
  if (!tags?.length) return "";
  return `\n        ${tags.map((b) => `<beam number="${b.number}">${b.value}</beam>`).join("\n        ")}`;
}

/**
 * Assign MusicXML `<beam>` tags for consecutive beamable notes, splitting groups
 * at beat boundaries so OSMD renders standard beaming instead of flagged singles.
 */
function computeMeasureBeams(notes: Note[], timeSignature: string): Map<number, BeamTag[]> {
  const result = new Map<number, BeamTag[]>();
  const beatLen = beamBeatLength(timeSignature);

  interface NoteBeamInfo {
    index: number;
    startBeat: number;
    maxLevel: number;
  }

  let beatCursor = 0;
  const infos: NoteBeamInfo[] = notes.map((note, index) => {
    const info = { index, startBeat: beatCursor, maxLevel: maxBeamLevel(note) };
    beatCursor += noteBeats(note);
    return info;
  });

  const beatGroup = (startBeat: number) => Math.floor(startBeat / beatLen + 1e-9);

  for (let level = 1; level <= 3; level++) {
    let i = 0;
    while (i < infos.length) {
      while (i < infos.length && infos[i]!.maxLevel < level) i++;
      if (i >= infos.length) break;

      const runStart = i;
      let runEnd = i;
      while (runEnd + 1 < infos.length && infos[runEnd + 1]!.maxLevel >= level) {
        runEnd++;
      }

      let j = runStart;
      while (j <= runEnd) {
        const groupBeat = beatGroup(infos[j]!.startBeat);
        let k = j;
        while (k <= runEnd && beatGroup(infos[k]!.startBeat) === groupBeat) k++;

        const group = infos.slice(j, k);
        if (group.length > 1) {
          group.forEach((entry, pos) => {
            const value: BeamTag["value"] =
              pos === 0 ? "begin" : pos === group.length - 1 ? "end" : "continue";
            const tags = result.get(entry.index) ?? [];
            tags.push({ number: level, value });
            result.set(entry.index, tags);
          });
        }
        j = k;
      }
      i = runEnd + 1;
    }
  }

  return result;
}

/**
 * Build the <notations> element string for a note.
 * Covers: tied, slur, fermata, articulations, ornaments.
 */
function buildNotations(note: Note): string {
  const items: string[] = [];

  // Tied (notation counterpart to <tie> note attribute)
  if (note.tie === "stop" || note.tie === "continue") items.push('<tied type="stop"/>');
  if (note.tie === "start" || note.tie === "continue") items.push('<tied type="start"/>');

  // Slur from lineStart / lineEnd (set via line tools)
  if (note.lineStart === "slur") items.push('<slur type="start" number="1"/>');
  if (note.lineEnd === "slur") items.push('<slur type="stop" number="1"/>');

  // Slur from articulations array (set via artic-slur palette button)
  if (note.articulations?.includes("slur")) items.push('<slur type="start" number="2"/>');

  // Fermata lives directly in <notations>, not in <articulations>
  if (note.articulations?.includes("fermata")) items.push("<fermata/>");

  // Articulations block
  const articXmlTag: Record<string, string> = {
    "a.": "staccato",
    "a-": "tenuto",
    "a>": "accent",
    "a^": "strong-accent",
    staccatissimo: "staccatissimo",
    "breath-mark": "breath-mark",
    caesura: "caesura",
  };
  const artics = (note.articulations ?? []).filter(
    (a) => a !== "fermata" && a !== "slur" && articXmlTag[a],
  );
  if (artics.length > 0) {
    items.push(
      `<articulations>${artics.map((a) => `<${articXmlTag[a]}/>`).join("")}</articulations>`,
    );
  }

  // Ornaments block
  const ornamentXmlTag: Record<string, string> = {
    trill: "trill-mark",
    mordent: "mordent",
    "inverted-mordent": "inverted-mordent",
    turn: "turn",
    "inverted-turn": "inverted-turn",
    shake: "shake",
  };
  if (note.ornament && ornamentXmlTag[note.ornament]) {
    items.push(`<ornaments><${ornamentXmlTag[note.ornament]}/></ornaments>`);
  }

  if (items.length === 0) return "";
  return `\n        <notations>${items.map((el) => `\n          ${el}`).join("")}\n        </notations>`;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Serialize EditableScore to MusicXML partwise format with full notation fidelity.
 * OSMD requires partwise; use this for printing/PDF export.
 * Pass `title` to override the work title shown by OSMD.
 */
export function scoreToPartwiseMusicXML(score: EditableScore, title?: string | null): string {
  const DIVISIONS = 8;

  const partList = score.parts
    .map(
      (p, i) =>
        `  <score-part id="P${i + 1}">\n    <part-name>${esc(p.name)}</part-name>\n  </score-part>`,
    )
    .join("\n");

  const parts = score.parts.map((p, pIdx) => {
    const { sign, line } = clefAttrs(p.clef ?? "treble");

    const measureCount = p.measures.length;

    const measures = p.measures.map((measure, mIdx) => {
      const lines: string[] = [];
      const isFirst = mIdx === 0;
      const isLast = mIdx === measureCount - 1;

      // Attributes block
      if (isFirst) {
        const ts = measure.timeSignature ?? "4/4";
        const [beats, beatType] = ts.split("/");
        const fifths = measure.keySignature ?? 0;
        lines.push(`      <attributes>
        <divisions>${DIVISIONS}</divisions>
        <key><fifths>${fifths}</fifths></key>
        <time>
          <beats>${beats ?? 4}</beats>
          <beat-type>${beatType ?? 4}</beat-type>
        </time>
        <clef>
          <sign>${sign}</sign>
          <line>${line}</line>
        </clef>
      </attributes>`);
      } else if (measure.timeSignature !== undefined || measure.keySignature !== undefined) {
        const tsChange = measure.timeSignature
          ? (() => {
              const [b, bt] = measure.timeSignature.split("/");
              return `        <time>\n          <beats>${b}</beats>\n          <beat-type>${bt}</beat-type>\n        </time>`;
            })()
          : "";
        const ksChange =
          measure.keySignature !== undefined
            ? `        <key><fifths>${measure.keySignature}</fifths></key>`
            : "";
        if (tsChange || ksChange) {
          lines.push(
            `      <attributes>\n${[ksChange, tsChange].filter(Boolean).join("\n")}\n      </attributes>`,
          );
        }
      }

      // Tempo — first part / first measure only (standard engraving placement).
      if (pIdx === 0 && isFirst) {
        if (measure.tempoText) {
          lines.push(`      <direction placement="above">
        <direction-type>
          <words>${esc(measure.tempoText)}</words>
        </direction-type>
      </direction>`);
        } else if (score.bpm != null && score.bpm > 0) {
          const bpm = Math.round(score.bpm);
          lines.push(`      <direction placement="above">
        <direction-type>
          <metronome>
            <beat-unit>quarter</beat-unit>
            <per-minute>${bpm}</per-minute>
          </metronome>
        </direction-type>
        <sound tempo="${bpm}"/>
      </direction>`);
        }
      } else if (measure.tempoText) {
        lines.push(`      <direction placement="above">
        <direction-type>
          <words>${esc(measure.tempoText)}</words>
        </direction-type>
      </direction>`);
      }

      // Rehearsal mark
      if (measure.rehearsalMark) {
        lines.push(`      <direction placement="above">
        <direction-type>
          <rehearsal>${esc(measure.rehearsalMark)}</rehearsal>
        </direction-type>
      </direction>`);
      }

      // Repeat / navigation marks
      if (measure.repeatMark) {
        const repeatSymbol: Record<string, string> = { segno: "<segno/>", coda: "<coda/>" };
        const repeatWord: Record<string, string> = { dc: "D.C.", ds: "D.S.", fine: "Fine" };
        const sym = repeatSymbol[measure.repeatMark];
        const word = repeatWord[measure.repeatMark];
        const inner = sym ?? (word ? `<words>${word}</words>` : null);
        if (inner) {
          lines.push(`      <direction placement="above">
        <direction-type>
          ${inner}
        </direction-type>
      </direction>`);
        }
      }

      const qStart = measureGlobalQuantStart(score, mIdx);
      const measureChords =
        pIdx === 0 && score.chords?.length
          ? score.chords
              .filter((c) => c.quant >= qStart && c.quant < qStart + riffQuantsForMeasure(score, mIdx))
              .sort((a, b) => a.quant - b.quant)
          : [];
      let noteBeatCursor = 0;
      let chordIdx = 0;
      const emitGlobalHarmony = (symbol: string) => {
        lines.push(
          chordSymbolToHarmonyXml(symbol)
            .split("\n")
            .map((line) => `      ${line}`)
            .join("\n"),
        );
      };

      // Notes
      const noteEls = measure.notes.length > 0 ? measure.notes : [];
      const measureBeams = computeMeasureBeams(
        noteEls,
        measure.timeSignature ?? "4/4",
      );
      noteEls.forEach((note, noteIdx) => {
        if (measureChords.length > 0) {
          const beatAtNote = noteBeatCursor;
          while (
            chordIdx < measureChords.length &&
            (measureChords[chordIdx]!.quant - qStart) / 16 <= beatAtNote + 1e-4
          ) {
            emitGlobalHarmony(measureChords[chordIdx]!.symbol);
            chordIdx++;
          }
        }
        // Pre-note directions: hairpin / octave-shift start
        if (note.lineStart === "cresc-hairpin") {
          lines.push(`      <direction placement="below">
        <direction-type><wedge type="crescendo" number="1"/></direction-type>
      </direction>`);
        } else if (note.lineStart === "decresc-hairpin") {
          lines.push(`      <direction placement="below">
        <direction-type><wedge type="diminuendo" number="1"/></direction-type>
      </direction>`);
        } else if (note.lineStart === "8va") {
          lines.push(`      <direction placement="above">
        <direction-type><octave-shift type="up" size="8" number="1"/></direction-type>
      </direction>`);
        } else if (note.lineStart === "8vb") {
          lines.push(`      <direction placement="below">
        <direction-type><octave-shift type="down" size="8" number="1"/></direction-type>
      </direction>`);
        }

        // Dynamics direction (standard dynamic marks only; hairpin is handled via lineStart)
        if (note.dynamics && note.dynamics !== "crescendo" && note.dynamics !== "decrescendo") {
          const dynTag: Record<string, string> = {
            p: "<p/>", pp: "<pp/>", ppp: "<ppp/>",
            f: "<f/>", ff: "<ff/>", fff: "<fff/>",
            mp: "<mp/>", mf: "<mf/>", sfz: "<sfz/>", fp: "<fp/>",
          };
          const dynEl = dynTag[note.dynamics];
          if (dynEl) {
            lines.push(`      <direction placement="below">
        <direction-type><dynamics>${dynEl}</dynamics></direction-type>
      </direction>`);
          }
        }

        // Chord symbol (harmony element precedes the note)
        if (note.chordSymbol) {
          lines.push(
            chordSymbolToHarmonyXml(note.chordSymbol)
              .split("\n")
              .map((line) => `      ${line}`)
              .join("\n"),
          );
        }

        // Note element — MusicXML DTD order: pitch/rest, duration, tie*, type, dot*, notations*, lyric*
        const divs = pwNoteDivs(note);
        const noteType = PW_TYPES[note.duration] ?? "quarter";
        const dotsEl = note.dots
          ? "\n" + Array(note.dots).fill("        <dot/>").join("\n")
          : "";

        const tieAttrs: string[] = [];
        if (note.tie === "stop" || note.tie === "continue") tieAttrs.push('<tie type="stop"/>');
        if (note.tie === "start" || note.tie === "continue") tieAttrs.push('<tie type="start"/>');
        const tieAttrStr = tieAttrs.length > 0
          ? "\n        " + tieAttrs.join("\n        ")
          : "";

        const notationsStr = buildNotations(note);
        const beamStr = formatBeamXml(measureBeams.get(noteIdx));
        const lyricStr =
          note.lyric && !note.isRest
            ? `\n        <lyric number="1"><syllabic>single</syllabic><text>${esc(note.lyric)}</text></lyric>`
            : "";

        if (note.isRest) {
          lines.push(`      <note>
        <rest/>
        <duration>${divs}</duration>${tieAttrStr}
        <type>${noteType}</type>${dotsEl}${beamStr}${notationsStr}${lyricStr}
      </note>`);
        } else {
          const { step, alter, octave } = pitchFromStr(note.pitch);
          const alterEl = alter !== 0 ? `\n          <alter>${alter}</alter>` : "";
          lines.push(`      <note>
        <pitch>
          <step>${step}</step>${alterEl}
          <octave>${octave}</octave>
        </pitch>
        <duration>${divs}</duration>${tieAttrStr}
        <type>${noteType}</type>${dotsEl}${beamStr}${notationsStr}${lyricStr}
      </note>`);
        }

        // Post-note directions: hairpin / octave-shift stop
        if (note.lineEnd === "cresc-hairpin" || note.lineEnd === "decresc-hairpin") {
          lines.push(`      <direction placement="below">
        <direction-type><wedge type="stop" number="1"/></direction-type>
      </direction>`);
        } else if (note.lineEnd === "8va" || note.lineEnd === "8vb") {
          lines.push(`      <direction placement="above">
        <direction-type><octave-shift type="stop" size="8" number="1"/></direction-type>
      </direction>`);
        }

        noteBeatCursor += noteBeats(note);
      });

      while (chordIdx < measureChords.length) {
        emitGlobalHarmony(measureChords[chordIdx]!.symbol);
        chordIdx++;
      }

      // Empty measure fallback
      if (measure.notes.length === 0) {
        lines.push(`      <note>
        <rest/>
        <duration>${DIVISIONS}</duration>
        <type>quarter</type>
      </note>`);
      }

      lines.push(
        ...musicXmlBarlineLines(
          effectiveMeasureBarline(measure.barline, isLast),
        ),
      );

      return `    <measure number="${mIdx + 1}">\n${lines.join("\n")}\n    </measure>`;
    });

    return `  <part id="P${pIdx + 1}">\n${measures.join("\n")}\n  </part>`;
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise
  PUBLIC "-//Recordare//DTD MusicXML 3.0 Partwise//EN"
  "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.0">
  <work>
    <work-title>${esc(title ?? "HarmonyForge")}</work-title>
  </work>
  <part-list>
${partList}
  </part-list>
${parts.join("\n")}
</score-partwise>`;
}

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
    const qStart = measureGlobalQuantStart(score, mIdx);
    const harmonyPrefix = (score.chords ?? [])
      .filter((c) => c.quant === qStart)
      .map((c) => indentedHarmonyXml(c.symbol))
      .join("\n");

    const partEls = score.parts
      .map((p, pIdx) => {
        const measure = p.measures[mIdx];
        if (!measure) return `  <part id="P${pIdx + 1}">\n  </part>`;
        const noteEls = measure.notes
          .map((note) => {
            const { divs, type } = DUR_MAP[note.duration] ?? { divs: 4, type: "quarter" };
            if (note.isRest) {
              return `    <note>
    <rest/>
    <duration>${divs}</duration>
    <type>${type}</type>
  </note>`;
            }
            const { step, alter, octave } = pitchFromStr(note.pitch);
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
        const notesBlock =
          noteEls ||
          `    <note>
    <rest/>
    <duration>4</duration>
    <type>quarter</type>
  </note>`;
        const harmonyBlock = pIdx === 0 && harmonyPrefix ? `${harmonyPrefix}\n` : "";
        const content = `${harmonyBlock}${notesBlock}`;
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
