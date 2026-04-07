/**
 * Parse MIDI → ParsedScore (canonical format)
 * Uses @tonejs/midi for parsing.
 * Format 1: track 0 may be meta-only; uses first track with notes.
 * Extracts key and time signature from header when available.
 *
 * @tonejs/midi is CommonJS (`exports.Midi`). Node ESM `import { Midi }` fails under `tsx`.
 * Resolve via `createRequire` anchored at `backend/package.json` (cwd is `backend/` for dev, Jest, CLI).
 */
import type { ParsedScore } from "../types.js";
/** Extract melody from the best candidate track; key/time from header */
export declare function parseMIDI(buffer: Buffer): ParsedScore | null;
