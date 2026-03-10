/**
 * HarmonyForge Logic Core — Shared types and pitch helpers
 * SATB ranges per Taxonomy.md §1.6
 */
export type PitchClass = "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#" | "A" | "A#" | "B";
export type Voice = "Soprano" | "Alto" | "Tenor" | "Bass";
/** Genre affects harmony theory only (chord inference, voice-leading strictness). Per HFLitReview. */
export type Genre = "classical" | "jazz" | "pop";
/** Config for generation: mood + genre affect chord inference/voice-leading; instruments used for MusicXML part names */
export interface GenerationConfig {
    mood?: "major" | "minor";
    genre?: Genre;
    instruments?: Record<Voice, string[]>;
}
export interface KeyContext {
    tonic: PitchClass;
    mode: "major" | "minor";
}
export interface ChordSlot {
    roman: string;
    duration?: string;
    beat?: number;
}
export interface MelodyNote {
    pitch: string;
    beat: number;
    duration?: number;
    measure?: number;
}
export interface LeadSheet {
    key: KeyContext;
    chords: ChordSlot[];
    melody?: MelodyNote[];
}
/** Canonical format from file parsers (XML/MIDI) before solver */
export interface ParsedScore {
    key: KeyContext;
    melody: MelodyNote[];
    chords?: ChordSlot[];
    timeSignature?: {
        beats: number;
        beatType: number;
    };
    totalBeats?: number;
    totalMeasures?: number;
    /** Original melody part name from input (e.g. "Violin") for additive output */
    melodyPartName?: string;
}
export interface SATBVoices {
    soprano: string;
    alto: string;
    tenor: string;
    bass: string;
}
/** Parsed chord with pitch classes (0–11) */
export interface ParsedChord {
    rootPc: number;
    thirdPc: number;
    fifthPc: number;
    seventhPc?: number;
    bassPc: number;
    /** Chord tones as pitch classes for voice assignment */
    chordTones: number[];
}
/** Parse "C4" or "G#3" → MIDI note number */
export declare function pitchToMidi(pitch: string): number;
/** MIDI note number → "C4" or "G#3" */
export declare function midiToPitch(midi: number): string;
/** Check if pitch (as "C4" or MIDI) is within voice range */
export declare function inRange(voice: Voice, pitch: string | number): boolean;
/** Get valid MIDI range for a voice */
export declare function getVoiceRange(voice: Voice): {
    min: number;
    max: number;
};
/** Get pitch class (0–11) from pitch string */
export declare function pitchToPc(pitch: string): number;
