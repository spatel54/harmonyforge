# Backend — Logic Core

> **This folder is the harmony engine:** reads your file (MusicXML, MIDI, MXL, sometimes PDF), infers chords, runs a **SATB-style solver**, returns **MusicXML** — exposed as a small **Express** HTTP API.

---

## At a glance

| Topic | Detail |
|-------|--------|
| **Package name** | `harmony-forge-mvp` (see `package.json`) |
| **Default port** | **8000** |
| **Language** | TypeScript (Node), compiled to `engine/dist/` |
| **Python** | Only for optional **PDF / OMR** tooling — not required to boot the API |

---

## What happens inside (conceptual)

```text
  File upload / JSON
        │
        ▼
  Parse & normalize  ──►  Chord inference (if needed)
        │
        ▼
  SATB-style solver  ──►  MusicXML out (+ validation endpoints)
```

Source code lives in **`engine/`**; **`engine/server.ts`** wires routes (generate-from-file, validate, preview helpers, etc.).

---

## Folder tour

| Path | Role |
|------|------|
| `engine/` | All TypeScript: parsers, solver, server, schemas |
| `engine/server.ts` | HTTP entry — start here to see routes |
| `scripts/` | CLI helpers (used by Make) |
| `input/` · `output/` | Sample files for **`make test-engine`** |
| `requirements.txt` | **Python** deps for PDF/OMR (`oemer` path), **not** for `npm run dev` |

Deeper module map: [engine/README.md](engine/README.md).

---

## Commands

**Inside `backend/`:**

```bash
npm install
npm run dev:backend    # Local dev: watch + tsx (hot reload)
npm run build:engine   # Compile to engine/dist/
npm test               # Jest tests under engine/
npm run lint           # ESLint
```

**From repo root** the **Makefile** wraps the same flows: `make dev`, `make test`, `make lint`, `make build`, `make test-engine`.

---

## Python and PDF

Some flows call **pdfalto**, **Poppler**, and **oemer** from Node. If you care about PDF upload quality, install Python packages from **`requirements.txt`** and read the open work in [docs/plan.md](../docs/plan.md) (section **1.9m** — production-ready PDF→MusicXML).

**Reproducible OMR (optional):** a reference **Dockerfile** lives at [`docker/oemer-omr.Dockerfile`](docker/oemer-omr.Dockerfile) (Python 3.11 + `requirements.txt` + `oemer==0.1.8 --no-deps`). It does not replace **`PDFALTO_BIN`** / **Poppler** on the host; use it to validate oemer installs or as a template for containerized workers. Pre-download ONNX checkpoints from the [oemer checkpoints release](https://github.com/BreezeWhite/oemer/releases/tag/checkpoints) when the runtime has no outbound HTTPS, then point **`OEMER_BIN`** at a venv where `oemer` runs (Python **3.10–3.12** recommended).

**Symbolic intake:** `engine/parsers/fileIntake.ts` ZIP-sniffs MXL, detects **PDF** (`%PDF`) and **SMF MIDI** (`MThd`), accepts **`.mxml`** and UTF-8 **MusicXML** even when the filename is `.txt` or extensionless. Root detection lives in **`engine/parsers/musicXmlMarkers.ts`** (namespace-prefixed `<ns:score-partwise>` / `<ns:score-timewise>`, same idea as `newfiles/harmonize-core.ts` validation, without loading DTDs).

---

## CORS (when deploying)

The server sends **`Access-Control-Allow-Origin`** from env **`CORS_ORIGIN`** (default `http://localhost:3000`). For production, set it to your **exact** frontend origin (e.g. `https://your-app.vercel.app`).

---

## More reading

| Doc | Use when… |
|-----|-----------|
| [../docs/context/system-map.md](../docs/context/system-map.md) | You need a diagram of frontend ↔ engine |
| [../docs/plan.md](../docs/plan.md) | You need the backend checklist (sections 1.x) |
| [engine/README.md](engine/README.md) | You are editing solver/parsers and want a file map |
