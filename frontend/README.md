# HarmonyForge — frontend (Tactile Sandbox)

Next.js app: upload → document → sandbox, **RiffScore** as the primary score editor, **Theory Inspector** (tutor, audit, stylist), optional **M5 study** arms.

## Run

From **repo root** (recommended):

```bash
make install    # if not already
make dev        # backend :8000 + this app :3000
```

Or frontend only:

```bash
cd frontend
npm install
npm run dev     # http://localhost:3000
```

The browser must reach the engine at **`NEXT_PUBLIC_API_URL`** (default `http://localhost:8000`).

## Environment

Copy **`.env.example`** → **`.env.local`**. Important keys:

- **`OPENAI_API_KEY`** — Theory Inspector LLM paths (optional; offline fallbacks exist).
- **`OPENAI_BASE_URL`** or **`OPENAI_URL`** — compatible API base when not using default OpenAI.
- **`NEXT_PUBLIC_API_URL`** — engine origin for client-side calls.
- **M5:** `NEXT_PUBLIC_HF_STUDY_CONDITION`, `NEXT_PUBLIC_HF_SUGGESTION_EXPLANATION_MODE`, `NEXT_PUBLIC_HF_STUDY_REQUIRES_CONSENT` — see **`docs/plan.md`** (M5 section).

## Routes

| Route | Role |
|-------|------|
| `/` | Playground: upload, optional onboarding modal, link to tour |
| `/onboarding` | Same upload flow with onboarding always available |
| `/document` | Preview, mood/instruments, generate (or melody-only in reviewer arm) |
| `/sandbox` | RiffScore editing, playback, export, Theory Inspector |

API routes live under **`src/app/api/`** (e.g. proxy to engine, theory-inspector, preview MusicXML).

## Source layout (high level)

| Area | Role |
|------|------|
| `src/app/` | App Router pages, layouts, API routes |
| `src/components/` | UI (inspector, sandbox, document, study, etc.) |
| `src/lib/` | AI clients, study config, music/score helpers |
| `src/store/` | Zustand stores (upload, score, inspector, coachmarks, …) |
| `src/hooks/` | React hooks (playback, RiffScore sync, …) |

**Score model:** **`EditableScore`** in the store is canonical; **`useRiffScoreSync`** (and related adapters) keep RiffScore and the store aligned.

## RiffScore patch

**`riffscore`** is patched via **`patch-package`** (see `patches/` and root **`package.json`** `postinstall`). After changing RiffScore version or patches, run `npm install` so the patch applies.

## Test and build

```bash
cd frontend
npm run test    # Vitest
npm run build   # production build
```

From repo root, **`make build`** also builds the engine and this app.

## Docs

- **[../docs/plan.md](../docs/plan.md)** — feature checklist and verification.
- **[../docs/progress.md](../docs/progress.md)** — work log and decisions.
- **[../docs/README.md](../docs/README.md)** — full documentation index.
