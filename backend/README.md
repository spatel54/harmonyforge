# HarmonyForge — backend (Logic Core)

Node package **`harmony-forge-mvp`**: deterministic harmony pipeline (parse → infer → SATB-style solve → MusicXML) and a small **Express** HTTP API on **port 8000** by default.

## Layout

| Path | Role |
|------|------|
| `engine/` | TypeScript source: solver, parsers, chord inference, `server.ts`, JSON schemas |
| `engine/server.ts` | HTTP entry (generate-from-file, validate, preview helpers, etc.) |
| `scripts/` | CLI helpers (e.g. engine CLI used by Make) |
| `input/` / `output/` | Sample CLI I/O for **`make test-engine`** |
| `requirements.txt` | Python deps for **PDF / OMR** tooling (oemer path), not for the Node server itself |

## Commands

From **`backend/`**:

```bash
npm install
npm run dev:backend    # watch mode: tsx engine/server.ts
npm test               # Jest: engine/
npm run lint           # ESLint engine/*.ts
npm run build:engine   # tsc -p engine/tsconfig.json
```

From **repo root**, **`Makefile`** wraps these (`make dev`, `make test`, `make lint`, `make build`, `make test-engine`).

## Python / PDF

The Node engine shells out to **pdfalto**, **Poppler**, and **oemer** for some PDF flows. Install Python deps from **`requirements.txt`** when working that path. Limitations and open work: **`docs/plan.md`** § **1.9m** (production-ready PDF→MusicXML).

## Docs

- **[../docs/context/system-map.md](../docs/context/system-map.md)** — how this service talks to the frontend.
- **[../docs/plan.md](../docs/plan.md)** — backend checklist (1.1–1.9).
- **[engine/README.md](engine/README.md)** — optional detail on `engine/` submodules.
