# `engine/` — module map

> **You are inside the TypeScript engine:** parsing, harmony logic, validation, MusicXML output, and the Express **route handlers** imported by **`server.ts`**.

---

## Pipeline (mental model)

```text
  parsers/*  ──►  chordInference  ──►  solver
                         │                │
                         └──────►  validateSATB*  ──►  satbToMusicXML
```

HTTP wiring and multer uploads live in **`server.ts`** (parent folder: see [../README.md](../README.md)).

---

## Main files and folders

| Name | Plain-English role |
|------|---------------------|
| **`server.ts`** | Express app: routes, CORS, file upload |
| **`solver.ts`** | Search for voice-leading assignments over chord slots |
| **`constraints.ts`** · **`validateSATB.ts`** | Rule checks + trace-friendly validation for the inspector |
| **`chordParser.ts`** · **`chordInference.ts`** | Read Roman / diatonic harmony or infer from melody |
| **`parsers/`** | MusicXML (partwise/timewise), MIDI, MXL, PDF intake (`fileIntake.ts`) |
| **`satbToMusicXML.ts`** | Turn internal representation into partwise MusicXML |
| **`schemas/`** | JSON schemas describing engine I/O |

---

## Build output

| | |
|--|--|
| **Compiled JS + types** | Written to **`engine/dist/`** |
| **Command** | From **`backend/`**: `npm run build:engine` |

---

## Parent docs

| Link | When to open |
|------|----------------|
| [../README.md](../README.md) | Run commands, ports, Python/PDF note, CORS |
