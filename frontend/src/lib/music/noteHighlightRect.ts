import type { NotePosition } from "./scoreTypes";

/** Raw DOM bboxes often include stems, beams, or whole chord columns — cap to notehead scale. */
const HEAD_H_MIN = 11;
const HEAD_H_MAX = 17;

/** Default pad (px) around the notehead for score overlays — single knob for “a bit bigger” pills. */
export const DEFAULT_NOTE_HIGHLIGHT_PAD = 3;

/**
 * Padded rectangle centered on the raw note box, with height clamped so overlays
 * read as a short “pill” on the notehead (not a tall staff slice).
 */
export function tightNoteHighlightRect(
  pos: NotePosition,
  padX: number,
  padY: number,
): { left: number; top: number; width: number; height: number } {
  const w = Math.max(pos.w, 6);
  const hRaw = Math.max(pos.h, 4);
  const headH = Math.min(hRaw, Math.max(HEAD_H_MIN, Math.min(w * 1.12, HEAD_H_MAX)));
  const cx = pos.x + w / 2;
  const cy = pos.y + hRaw / 2;
  const outW = w + padX * 2;
  const outH = headH + padY * 2;
  return {
    left: cx - outW / 2,
    top: cy - outH / 2,
    width: outW,
    height: outH,
  };
}
