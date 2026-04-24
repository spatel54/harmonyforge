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

The template documents:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-nano
# OPENAI_BASE_URL=https://api.openai.com/v1   # optional — gateway or self-hosted OpenAI-compatible API
```

Set **`OPENAI_API_KEY`** if you use the Theory Inspector LLM; leave blank for offline fallbacks. **`OPENAI_MODEL`** sets the chat model id (default in code is **`gpt-5-nano`**, the cheapest standard tier on [OpenAI pricing](https://platform.openai.com/docs/pricing); use e.g. **`gpt-4o-mini`** if your account does not serve **`gpt-5-nano`** yet). **`OPENAI_BASE_URL`** (or legacy **`OPENAI_URL`**) targets a non-default OpenAI-compatible API root (include `.../v1` when required). Solver limits, OMR, and deploy-only vars are in [docs/deployment.md](../docs/deployment.md).

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
