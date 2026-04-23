/**
 * Map vertical position on a 5-line staff to diatonic pitch (scientific notation)
 * for note-input preview labeling. One staff = 5 lines + 4 spaces (9 anchor pitches).
 *
 * **Clefs and “the scale”:** Alto / tenor / bass do **not** use a different chromatic scale or
 * tuning — they only change **which absolute pitch** each line and space represents (e.g. viola
 * **alto C-clef**: middle C on the **middle** staff line; treble: middle C is **ledger below**).
 * Letter names are still concert scientific pitch (C4 = middle C). Do not confuse **alto clef**
 * (viola) with **SATB “Alto” voice**, which is usually notated in **treble** clef.
 *
 * Geometry helpers snap to the **nearest diatonic** line/space; on-screen letter+accidental
 * labels for real notes should prefer RiffScore / store pitch when available (see learner overlay).
 */

export type StaffClef =
  | "treble"
  | "bass"
  | "alto"
  | "tenor"
  /** C clef: middle C on line 1 (bottom line), MusicXML `<line>1</line>`. */
  | "soprano_c"
  /** C clef: middle C on line 2 (mezzo-soprano clef). */
  | "mezzo"
  /** C clef: middle C on line 5 (top line), not F-clef baritone. */
  | "baritone_c";

/** Pitches from top line downward (SVG y increases downward). */
const ANCHOR_PITCHES: Record<StaffClef, string[]> = {
  treble: ["F5", "E5", "D5", "C5", "B4", "A4", "G4", "F4", "E4"],
  bass: ["A3", "G3", "F3", "E3", "D3", "C3", "B2", "A2", "G2"],
  /**
   * Alto (viola) C-clef: C4 on middle line (MusicXML staff line 3 from bottom).
   * Top line → bottom line (nine staff positions): G4 F4 E4 D4 C4 B3 A3 G3 F3.
   */
  alto: ["G4", "F4", "E4", "D4", "C4", "B3", "A3", "G3", "F3"],
  /**
   * C clef on line 4 from bottom (MusicXML `<clef><sign>C</sign><line>4</line></clef>`).
   * Nine positions top → bottom: line, space, …, bottom line.
   */
  tenor: ["E4", "D4", "C4", "B3", "A3", "G3", "F3", "E3", "D3"],
  /** C on line 1 from bottom (soprano C-clef). */
  soprano_c: ["D5", "C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"],
  /** C on line 2 from bottom (mezzo-soprano C-clef). */
  mezzo: ["B4", "A4", "G4", "F4", "E4", "D4", "C4", "B3", "A3"],
  /** C on line 5 from bottom (baritone C-clef). */
  baritone_c: ["C4", "B3", "A3", "G3", "F3", "E3", "D3", "C3", "B2"],
};

function normalizeClef(raw: string): StaffClef {
  const c = raw.toLowerCase();
  if (
    c === "bass" ||
    c === "alto" ||
    c === "tenor" ||
    c === "treble" ||
    c === "mezzo" ||
    c === "soprano_c" ||
    c === "baritone_c"
  ) {
    return c;
  }
  return "treble";
}

/** Build 9 anchor Y positions: line, space, line, …, line from top to bottom. */
export function buildStaffAnchorYs(sortedLineYsAsc: number[]): number[] {
  if (sortedLineYsAsc.length < 5) return [];
  const lines = sortedLineYsAsc.slice(0, 5);
  const ys: number[] = [];
  for (let i = 0; i < 5; i++) {
    ys.push(lines[i]);
    if (i < 4) {
      ys.push((lines[i] + lines[i + 1]) / 2);
    }
  }
  return ys;
}

/**
 * @param lineYsFive - five staff line Y values in SVG space, sorted ascending (top → bottom).
 * @param noteCenterY - vertical center of the preview notehead in the same coordinate space.
 */
export function pitchFromStaffGeometry(
  clefRaw: string,
  lineYsFive: number[],
  noteCenterY: number,
): string | null {
  if (lineYsFive.length < 5) return null;
  const clef = normalizeClef(clefRaw);
  const anchors = ANCHOR_PITCHES[clef];
  const ys = buildStaffAnchorYs([...lineYsFive].sort((a, b) => a - b));
  if (ys.length !== 9) return null;

  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < 9; i++) {
    const d = Math.abs(noteCenterY - ys[i]);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return anchors[best] ?? null;
}

/** Vertical center (container Y) for a diatonic anchor pitch on the staff, inverse of `pitchFromStaffGeometry`. */
export function staffAnchorYForPitch(
  clefRaw: string,
  lineYsFive: number[],
  pitch: string,
): number | null {
  if (lineYsFive.length < 5) return null;
  const clef = normalizeClef(clefRaw);
  const anchors = ANCHOR_PITCHES[clef];
  const idx = anchors.indexOf(pitch);
  if (idx < 0) return null;
  const ys = buildStaffAnchorYs([...lineYsFive].sort((a, b) => a - b));
  if (ys.length !== 9) return null;
  const y = ys[idx];
  return typeof y === "number" && Number.isFinite(y) ? y : null;
}
