/**
 * Static RAG index for Taxonomy.md content.
 * Genre-filtered section retrieval for Theory Inspector prompts.
 *
 * Source: /home/yirenl2/projects/harmonyforge/Taxonomy.md
 */

export type ViolationKey =
  | "parallelFifths"
  | "parallelOctaves"
  | "rangeViolations"
  | "spacingViolations"
  | "voiceOrderViolations"
  | "voiceOverlapViolations";

export type Genre = "classical" | "jazz" | "pop";

interface TaxonomyEntry {
  term: string;
  definition: string;
  flagWhen: string;
  source: string;
}

/** Violation-specific definitions from Taxonomy.md §1.1 and §1.6 */
const VIOLATION_ENTRIES: Record<ViolationKey, TaxonomyEntry> = {
  parallelFifths: {
    term: "Parallel fifths",
    definition:
      'Two voices move in same direction to perfect fifth. Forbidden: perfect 5th "defines triadic root" and deprives voices of independence.',
    flagWhen: "Same two voices form perfect fifth in consecutive chords",
    source: "Fux, Aldwell-Schachter",
  },
  parallelOctaves: {
    term: "Parallel octaves",
    definition:
      'Two voices move in same direction to perfect octave. One part "duplicates pitch and motion of the other in different register."',
    flagWhen: "Same two voices form octave in consecutive chords",
    source: "Aldwell-Schachter",
  },
  rangeViolations: {
    term: "Range",
    definition:
      "Soprano C4-G5; Alto G3-D5; Tenor C3-G4; Bass F2-D4.",
    flagWhen: "Voice pitch falls outside standard SATB range",
    source: "Standard SATB",
  },
  spacingViolations: {
    term: "Spacing",
    definition:
      "Max one octave between adjacent upper voices; max twelfth between Tenor and Bass.",
    flagWhen:
      "Adjacent upper voices exceed one octave, or Tenor-Bass exceeds a twelfth",
    source: "Standard SATB",
  },
  voiceOrderViolations: {
    term: "Voice crossing",
    definition:
      'Two voices exchange position (e.g., alto below tenor). "Soprano or bass line can become obscured." Least problematic when brief, inner voices only.',
    flagWhen: "Adjacent voices intersect",
    source: "Aldwell-Schachter",
  },
  voiceOverlapViolations: {
    term: "Voice overlap",
    definition:
      'Lower voice moves above prior upper-voice note, or upper below prior lower. "Melodic stepwise connection can be made between the two voices"; confusing in four-part vocal style.',
    flagWhen: "One voice exceeds the other's prior position",
    source: "Aldwell-Schachter",
  },
};

/** Genre sections from Taxonomy.md — raw text for LLM context injection */
const GENRE_SECTIONS: Record<Genre, string> = {
  classical: `## Classical & Functional Harmony (Axiomatic Core)
Constraint-satisfaction ground truth. Sources: Fux (Counterpoint), Aldwell & Schachter (Harmony & Voice Leading), SchenkerGUIDE.

### Strict Voice-Leading (Red-Line Triggers)
- Parallel fifths: Two voices move in same direction to perfect fifth. Forbidden. (Fux, Aldwell-Schachter)
- Parallel octaves: Two voices move in same direction to perfect octave. (Aldwell-Schachter)
- Hidden fifths/octaves: Perfect consonance approached by similar motion. (Fux, Aldwell-Schachter)
- Voice crossing: Two voices exchange position. (Aldwell-Schachter)
- Voice overlap: Lower voice moves above prior upper-voice note. (Aldwell-Schachter)
- False relation: Chromatic contradiction split between different voices. (HarmonySolver)

### Doubling Rules
- Leading tone: Never double when part of V or VII. (Aldwell-Schachter)
- Chord 7th: Must never be doubled. (Aldwell-Schachter)
- Root-position triads: Double root most often. (Aldwell-Schachter, Fux)
- Cadential 6/4: Bass is the best tone to double. (Aldwell-Schachter)

### Cadence Rules
- Perfect authentic cadence: V-I with soprano on scale degree 1. (Aldwell-Schachter)
- Semicadence: Ends on V without resolving to I. (Aldwell-Schachter)
- Phrygian cadence: iv6-V in minor. (Aldwell-Schachter)

### Harmonic Syntax
- Phrase model: T -> PD -> D -> T (Tonic -> Pre-dominant -> Dominant -> Tonic).
- Backward progressions (D -> PD) are flagged.

### Schenkerian Hierarchy
- Ursatz: Deepest archetypal progression (Urlinie + Bassbrechung). (SchenkerGUIDE)
- Urlinie: Fundamental line; stepwise descent toward scale degree 1. (SchenkerGUIDE)
- Bassbrechung: Bass arpeggiation I-V-I. (SchenkerGUIDE)
- Prolongation: Simple structures elaborated through time. (SchenkerGUIDE)

### Algorithmic Constraints
- Range: Soprano C4-G5; Alto G3-D5; Tenor C3-G4; Bass F2-D4.
- Spacing: Max octave between adjacent upper voices; max twelfth between Tenor-Bass.
- One direction: Not all four voices moving in same direction simultaneously.
- Forbidden jumps: Restrict unnatural or overly wide melodic leaps.`,

  jazz: `## Jazz & Blues Harmony
Extended tertian harmony; chord-scale correlation. Sources: Open Music Theory.

### Chord-Scale Mappings
- Minor seventh (ii7): Dorian (Phrygian, Aeolian possible)
- Dominant seventh (V7): Mixolydian (Altered, Whole-tone for alterations)
- Major seventh (I7): Ionian (Lydian also common)
- Half-diminished (ii-half-dim-7): Locrian

### ii-V-I Schema
- Major: ii7-V7-Imaj7 (minor7 -> dominant7 -> major7)
- Minor: ii-half-dim-7-V7-i7
- Applied ii-V: Used to tonicize other chords

### Tritone Substitution
- Replace V7 with dominant a tritone away; shared tritone (guide tones).
- Bass resolves chromatically down by minor 2nd to target root.

### Voicing & Extensions
- Fifth often omitted; adds little character.
- 3-7 paradigm: 3rd of chord A -> 7th of chord B; smooth voice leading.
- Extensions: 9, 11, 13 in upper voices; root/bass in lower.
- 12-bar blues: All dominant sevenths; plagal (IV-I) emphasis.

Note: Jazz genre relaxes classical voice-leading rules. Parallel fifths and octaves are generally permissible when stylistically appropriate.`,

  pop: `## Popular & Rock Music
Cyclical schemas; chord loops; rotations. Sources: Open Music Theory.

### Four-Chord Cyclical Schemas
- Doo-wop: I-vi-IV-V (rotations: IV-V-I-vi)
- Singer/songwriter: vi-IV-I-V (tonally ambiguous, plagal motion)
- Hopscotch: IV-V-vi-I (root motion by step-step-skip)

### Plagal & Blues-Based Schemas
- Plagal vamp: I-IV alternation (R&B, soul)
- Plagal sigh: IV-iv-I (chromatic la-le-sol; nostalgia)
- Double plagal: bVII-IV-I (Mixolydian)
- Extended plagal: bVI-bIII-bVII-IV-I (flat side of circle of fifths)

### Modal Schemas
- Subtonic shuttle: I-bVII (Mixolydian/Aeolian)
- Aeolian shuttle: i-bVII-bVI-bVII
- Aeolian cadence: bVI-bVII-i (goal-oriented)
- Lament: i-bVII-bVI-V (descending minor tetrachord)

Note: Pop genre uses modal and cyclical progressions. Classical voice-leading rules are relaxed; parallel motion is common and stylistically expected.`,
};

/**
 * Get the relevant Taxonomy.md section text for prompt injection.
 *
 * @param genre - Active genre (determines which section to load)
 * @param violationType - Optional violation key for a targeted definition
 * @returns Text to inject into the LLM system prompt
 */
export function getTaxonomyContext(
  genre: Genre,
  violationType?: ViolationKey,
): string {
  const parts: string[] = [];

  // Always include the genre section
  parts.push(GENRE_SECTIONS[genre]);

  // If a specific violation type is requested, add the detailed definition
  if (violationType && VIOLATION_ENTRIES[violationType]) {
    const entry = VIOLATION_ENTRIES[violationType];
    parts.push(
      `\n### Specific Violation Reference\n` +
        `**${entry.term}** is defined as: ${entry.definition}\n` +
        `Flag when: ${entry.flagWhen}\n` +
        `Source: ${entry.source}`,
    );
  }

  return parts.join("\n\n");
}

/**
 * Get the human-readable label for a violation key.
 */
export function getViolationLabel(key: ViolationKey): string {
  return VIOLATION_ENTRIES[key]?.term ?? key;
}

/**
 * Get the fallback explanation for a violation (no LLM needed).
 * Returns the academic definition from Taxonomy.md directly.
 */
export function getFallbackExplanation(
  violationType: ViolationKey,
): string {
  const entry = VIOLATION_ENTRIES[violationType];
  if (!entry) return "No definition available for this violation type.";
  return (
    `**${entry.term}** is defined as: ${entry.definition} ` +
    `(per ${entry.source}).\n\n` +
    `This is flagged when: ${entry.flagWhen}.`
  );
}
