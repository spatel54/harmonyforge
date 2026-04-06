/**
 * Dual-mode Theory Inspector: Origin Justifier (unchanged generated pitch)
 * vs Harmonic Guide (edited or no baseline) vs melody context.
 */

export type TheoryInspectorMode =
  | "origin-justifier"
  | "harmonic-guide"
  | "melody-context";

/** Resolve engine-origin pitch: prefer stamped note field, then baseline map. */
export function resolveOriginalEnginePitch(
  note: { originalGeneratedPitch?: string } | null | undefined,
  baselineMap: Record<string, string>,
  noteId: string,
): string | null {
  const stamped = note?.originalGeneratedPitch;
  if (typeof stamped === "string" && stamped.length > 0) {
    return stamped;
  }
  return baselineMap[noteId] ?? null;
}

export function computeUserModifiedPitch(
  originalEnginePitch: string | null,
  currentPitch: string,
): boolean {
  return originalEnginePitch !== null && originalEnginePitch !== currentPitch;
}

export function computeTheoryInspectorMode(input: {
  isMelodyPart: boolean;
  originalEnginePitch: string | null;
  currentPitch: string;
}): TheoryInspectorMode {
  if (input.isMelodyPart) return "melody-context";
  if (
    input.originalEnginePitch !== null &&
    input.originalEnginePitch === input.currentPitch
  ) {
    return "origin-justifier";
  }
  return "harmonic-guide";
}
