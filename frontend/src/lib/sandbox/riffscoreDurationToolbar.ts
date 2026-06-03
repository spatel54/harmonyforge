import type { DurationType } from "@/lib/music/scoreTypes";
import { rsDurationToHf } from "@/lib/music/riffscoreAdapter";

/** RiffScore `DurationControls` button `title` prefix → RS duration id. */
const TITLE_PREFIX_TO_RS: Array<{ prefix: string; rs: string }> = [
  { prefix: "whole", rs: "whole" },
  { prefix: "half", rs: "half" },
  { prefix: "quarter", rs: "quarter" },
  { prefix: "eighth", rs: "eighth" },
  { prefix: "16th", rs: "sixteenth" },
  { prefix: "32nd", rs: "thirtysecond" },
  { prefix: "64th", rs: "sixtyfourth" },
];

export function hfDurationFromRiffToolbarTitle(title: string | null | undefined): DurationType | null {
  if (!title) return null;
  const lower = title.toLowerCase();
  for (const { prefix, rs } of TITLE_PREFIX_TO_RS) {
    if (lower.startsWith(prefix)) return rsDurationToHf(rs);
  }
  return null;
}

/**
 * True when `target` is a duration glyph button in RiffScore's native duration strip
 * (not HF toolbar plugins or other control groups).
 */
export function isRiffScoreDurationToolbarButton(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const btn = target.closest("button");
  if (!btn) return false;
  const title = btn.getAttribute("title");
  if (!hfDurationFromRiffToolbarTitle(title)) return false;
  const group = btn.closest(".riff-ControlGroup");
  if (!group) return false;
  const row = group.closest(".riff-Toolbar__row");
  if (!row?.querySelector(".riff-ControlGroup")) return false;
  return true;
}

export function hfDurationFromRiffToolbarClick(target: EventTarget | null): DurationType | null {
  if (!(target instanceof Element)) return null;
  const btn = target.closest("button");
  if (!btn) return null;
  return hfDurationFromRiffToolbarTitle(btn.getAttribute("title"));
}
