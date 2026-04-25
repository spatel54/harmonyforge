/**
 * Coarse timbre groups for in-browser preview — not orchestral realism, just register + timbre variety.
 * Iteration 7: trust-building audition when labels say "viola" but a single piano sample felt "crunchy."
 */

export type TimbreKind = "strings" | "winds" | "brass" | "bass" | "keyboard" | "other";

const STRINGS = /\b(violin|viola|cello|contrabass|bass|guitar|harp|string)/i;
const BASS_LOW = /\b(tuba|bassoon|contrabass|double bass|electric bass|bass trom)/i;
const BRASS = /\b(trumpet|trombone|horn|euphonium|tuba|sax|brass|cornet|flugel)/i;
const WINDS = /\b(flute|piccolo|oboe|clarinet|bassoon|marimba|mallet|reed|woodwind|english horn|picc)/i;
const KEYS = /\b(piano|keyboard|organ)/i;

/** Exported for unit tests. */
export function partNameToTimbreKind(partName: string): TimbreKind {
  const s = partName.trim();
  if (!s) return "other";
  if (KEYS.test(s)) return "keyboard";
  if (BASS_LOW.test(s) && !STRINGS.test(s)) return "bass";
  if (STRINGS.test(s)) return "strings";
  if (BRASS.test(s)) return "brass";
  if (WINDS.test(s)) return "winds";
  if (/\b(piano|keyboard)\b/i.test(s)) return "keyboard";
  return "other";
}
