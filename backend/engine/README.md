# `backend/engine/` — implementation detail

TypeScript **Logic Core**: parsing, inference, constraints, SATB validation, MusicXML I/O, and **Express** routes wired from **`server.ts`**.

## Main areas

| Area | Role |
|------|------|
| `solver.ts` | Voice-leading search over chord slots |
| `constraints.ts` / `validateSATB.ts` | Rule checks and trace-friendly validation |
| `chordParser.ts` / `chordInference.ts` | Roman / diatonic harmony input and inference |
| `parsers/` | MusicXML (partwise/timewise), MIDI, MXL, PDF intake (`fileIntake.ts`) |
| `satbToMusicXML.ts` | Build partwise MusicXML from internal representation |
| `schemas/` | JSON schemas for engine input/output |

Compiled output is emitted under **`engine/dist/`** when you run **`npm run build:engine`** from **`backend/`**.

For how to run the server and CLI, see **[../README.md](../README.md)**.
