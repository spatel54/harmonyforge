export type VoiceKey = "soprano" | "alto" | "tenor" | "bass";

interface VoiceRange {
  min: number;
  max: number;
}

/**
 * Centralized SATB thresholds used by inspector explainability/highlighting.
 * Mirrors the deterministic engine rule families used in validation.
 */
export const SATB_RULES = {
  ranges: {
    soprano: { min: 60, max: 79 }, // C4-G5
    alto: { min: 55, max: 74 }, // G3-D5
    tenor: { min: 48, max: 67 }, // C3-G4
    bass: { min: 41, max: 62 }, // F2-D4
  } satisfies Record<VoiceKey, VoiceRange>,
  maxSpacing: {
    sopranoAlto: 12, // octave
    altoTenor: 12, // octave
    tenorBass: 19, // twelfth
  },
} as const;

export function isVoiceInRange(voice: VoiceKey, midi: number): boolean {
  const range = SATB_RULES.ranges[voice];
  return midi >= range.min && midi <= range.max;
}
