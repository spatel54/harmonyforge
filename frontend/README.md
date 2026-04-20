# HarmonyForge — Next.js app

The **entire product** runs here: UI (App Router), `/api/*` route handlers, and the SATB engine under [`src/server/engine/`](src/server/engine). Same-origin `fetch` — no separate backend URL.

---

## Stack

| Area | Details |
|------|---------|
| UI | Next.js, React, Tailwind, RiffScore (see `patches/`) |
| State | Zustand (`src/store/`) |
| Audio | Tone.js |
| Engine | `src/server/engine/` — parsers, solver, SATB→MusicXML |
| Tests | Vitest — `src/**/*.test.ts` and `src/server/engine/**/*.test.ts` |

---

## Run

From repo root (recommended):

```bash
cd ..
make install
make dev
```

Or from this folder:

```bash
npm install
npm run dev
```

Default URL: **http://localhost:3000**

---

## Environment

1. Copy **`.env.example`** → **`.env.local`** (same directory as this README).  
2. Never commit `.env.local`.

The template only defines:

```bash
OPENAI_API_KEY=
```

Set it if you use the Theory Inspector LLM; leave blank for offline fallbacks. Advanced tuning (solver limits, OMR paths, etc.) is optional and documented in code comments and [docs/deployment.md](../docs/deployment.md) — not in `.env.example` on purpose.

---

## Routes

| URL | Purpose |
|-----|---------|
| `/` | Upload / playground |
| `/document` | Preview + generate |
| `/sandbox` | Editor, playback, inspector |

| API (sample) | Purpose |
|--------------|---------|
| `POST /api/generate-from-file` | Intake + SATB MusicXML |
| `POST /api/theory-inspector` | LLM stream |
| `GET /api/health` | Health check |

See [README.md](../README.md) for the full list.

---

## Source layout

```text
src/
├── app/           Pages and route handlers
├── components/    UI
├── hooks/
├── lib/           AI helpers, music utils
├── server/engine/ Engine (Node)
└── store/         Zustand
```

---

## RiffScore

`riffscore` is patched via `patch-package` (`postinstall`). After upgrading the dependency, re-run `npm install`.

---

## Scripts

| Command | What |
|---------|------|
| `npm test` | Vitest |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test-engine` | CLI smoke → `engine-cli-output/` |

From repo root, `make verify` = test + lint + build.

---

## More docs

| Doc | When |
|-----|------|
| [../docs/plan.md](../docs/plan.md) | Checklist |
| [../docs/progress.md](../docs/progress.md) | Recent work |
| [../docs/deployment.md](../docs/deployment.md) | Hosting |
| [../docs/design/](../docs/design/) | UI design spec |
