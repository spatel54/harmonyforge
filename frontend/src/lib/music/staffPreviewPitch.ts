/**
 * Map vertical position on a 5-line staff to diatonic pitch (scientific notation)
 * for note-input preview labeling. One staff = 5 lines + 4 spaces (9 anchor pitches).
 */

export type StaffClef = "treble" | "bass" | "alto" | "tenor";

/** Pitches from top line downward (SVG y increases downward). */
const ANCHOR_PITCHES: Record<StaffClef, string[]> = {
  treble: ["F5", "E5", "D5", "C5", "B4", "A4", "G4", "F4", "E4"],
  bass: ["A3", "G3", "F3", "E3", "D3", "C3", "B2", "A2", "G2"],
  alto: ["G4", "F4", "E4", "D4", "C4", "B3", "A3", "G3", "F3"],
  tenor: ["B4", "A4", "G4", "F4", "E4", "D4", "C4", "B3", "A3"],
};

function normalizeClef(raw: string): StaffClef {
  const c = raw.toLowerCase();
  if (c === "bass" || c === "alto" || c === "tenor" || c === "treble") {
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
