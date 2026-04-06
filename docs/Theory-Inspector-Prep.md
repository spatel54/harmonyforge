# Theory Inspector — Preparation (No AI Yet)

> **Status**: Files prepared for future Theory Inspector integration. No LLM/AI wired yet.

## Overview

The Theory Inspector will provide ante-hoc explanations when users query flagged notes. RAG retrieves from `docs/Taxonomy.md`; genre selection loads only the active genre's section to minimize context (per #76).

## Genre → Taxonomy Section Mapping

| Genre (Engine) | Taxonomy Section | RAG Scope |
|----------------|------------------|------------|
| `classical` | §1 Classical & Functional Harmony | Strict voice-leading, phrase model, Schenkerian |
| `jazz` | §2 Jazz & Blues Harmony | ii–V–I, chord-scale, 3–7 paradigm, extensions |
| `pop` | §3 Popular & Rock Music | Cyclical schemas, plagal, modal borrowing |

## Files Ready

- **docs/Taxonomy.md** — Canonical lexicon with §1 Classical, §2 Jazz, §3 Pop, §4 Mariachi, §5 Post-Tonal
- **backend/engine/validateSATB.ts** — Violation detection (parallel fifths, octaves, range, spacing, etc.)
- **POST /api/validate-satb**, **POST /api/validate-from-file** — Validation API

## Future Integration Points

1. **Auditor**: Call `validateSATBSequence` on score changes; map violations to Taxonomy terms
2. **RAG**: Index `docs/Taxonomy.md` by section; retrieve by `genre` + violation type
3. **Tutor**: Format RAG chunks into compact, axiomatic explanations
4. **Red Line**: Visual indicators on ScoreCanvas for flagged notes (TheoryInspectorPanel already has violation card UI)

## Engine Genre Support (Implemented)

- **Chord inference**: `inferChords(parsed, mood, genre)` — classical=triads, jazz=7ths, pop=cyclical+bVII/bVI
- **Voice leading**: `generateSATB(leadSheet, { genre })` — classical=strict first, jazz/pop=relaxed first
- **Config**: `GenerationConfig.genre` passed from Document page → API
