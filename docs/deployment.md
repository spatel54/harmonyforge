# Deployment guide

> **HarmonyForge is one Next.js app.** The SATB engine lives inside the same process under [`frontend/src/server/engine/`](../frontend/src/server/engine) and is reachable at `/api/*` route handlers. You deploy **one artifact**.

Pair this with **[progress.md](progress.md)** (current status) and **[plan.md](plan.md)** (checklist).

**Local secrets template:** [`frontend/.env.example`](../frontend/.env.example) lists **`OPENAI_API_KEY`**, optional **`OPENAI_BASE_URL`** / **`OPENAI_URL`**, and **`OPENAI_MODEL`** (chat model id; code defaults to **`gpt-5-nano`** for lowest standard-tier API cost—override if your provider uses another id). The tables below add **production tuning**; you do not need every variable in `.env.local` for development.

---

## Pick your target

| Target | What it gets you | Trade-off |
|--------|------------------|-----------|
| **Vercel (serverless)** | Zero-config Next.js hosting, instant previews, free tier. Client rasterizes PDFs so the Document preview still shows a thumbnail everywhere. | **PDF → MusicXML is not available** on Vercel (no Java/Audiveris). Uploads that need OMR fail with a clear 501 message. MusicXML/MXL/MIDI work fully. |
| **Self-hosted Docker** | Full PDF → MusicXML pipeline (**Audiveris** baked into one image). | You run a container host (Render / Fly / Railway / DigitalOcean App Platform / your own VM). Larger image (Java 25 + Audiveris build). |

Both paths produce the same UX for symbolic files; PDF melody intake requires Audiveris (Docker or local **`make audiveris-setup`**).

---

## Path A — Vercel (fast, serverless)

1. **Import** the GitHub repo into Vercel.
2. **Root Directory:** `frontend` (required).
3. **Framework:** Next.js (auto-detected).
4. **Install command:** the repo ships [`frontend/vercel.json`](../frontend/vercel.json) with **`npm ci --include=dev`** so each build gets a **clean** `node_modules` from `package-lock.json`. That avoids Vercel’s dependency cache leaving a **stale `riffscore`** tree when the version string is unchanged but [`patch-package`](../frontend/patches/riffscore+1.0.0-alpha.9.patch) expects a pristine tarball — otherwise postinstall can fail with **“Failed to apply patch for package riffscore”**. If you ever override the install command in the dashboard, prefer the same `npm ci --include=dev` (the `--include=dev` part matters when `NODE_ENV=production` during install). As a one-off, **Redeploy** with **“Clear build cache”** also fixes a poisoned cache.
5. **Environment variables** (Vercel → Settings → Environment Variables):

| Variable | Where it runs | Notes |
|----------|----------------|--------|
| `OPENAI_API_KEY` | Server | Secret. Enables Theory Inspector; omit for offline fallback. |
| `OPENAI_BASE_URL` / `OPENAI_URL` | Server | Optional compatible OpenAI base. |
| `OPENAI_MODEL` | Server | Chat model / deployment id (default **`gpt-5-nano`** in app code—cheapest standard tier on OpenAI’s pricing table; set e.g. `gpt-4o-mini` if needed). |
| `HF_SOLVER_MAX_MS` | Server | SATB wall-clock cap (ms). `0` = unlimited. Default ~108s on file routes. |
| `HF_SOLVER_MAX_NODES` | Server | SATB search node budget. |
| `HF_MAX_CHORD_SLOTS` | Server | Chord-grid density cap for long melodies. |
| `NEXT_PUBLIC_GENERATE_TIMEOUT_MS` | Browser | Client abort on `/api/generate-from-file` (default 180000). |
| `NEXT_PUBLIC_HF_*` | Browser | M5 study toggles — see [plan.md §M5](plan.md). |

If Theory Inspector returns **401** and the error text names a **model** (e.g. `gpt-4o-mini`) instead of `sk-…`, you almost certainly put the **model id in `OPENAI_API_KEY`** and the **secret in `OPENAI_MODEL`**. Swap them in the Vercel dashboard, attach vars to **Preview** as well as **Production** if you use preview URLs, and **redeploy**. The app’s **`getServerOpenAIEnv()`** can auto-recover when one side looks like **`sk-…`** and the other like **`gpt-…`**, but fixing env names is the durable fix—see **[progress.md — 2026-04-27 naturals / LLM / audit](progress.md#wl-sandbox-naturals-llm-audit-2026-04-27)**.

6. **Deploy** → confirm `/api/health` returns `{ "status": "ok" }`.
7. **Smoke test** the upload → generate → sandbox flow with MusicXML (fastest) and MXL.

**PDF on Vercel:** the browser client-rasterizes PDFs via `pdfjs-dist` so you always see a thumbnail on `/document`. Running **Audiveris** requires Java on the server — if you need PDF → MusicXML, use Path B or local **`make audiveris-setup`**.

**Local dev — `Preview failed: 500` on PDF:** If the Next dev log shows **`@napi-rs/canvas`** / **`skia.*.node` MODULE_NOT_FOUND**, run **`make install`**, ensure **`frontend/next.config.ts`** lists **`@napi-rs/canvas`** under **`serverExternalPackages`**, then **`make dev-clean && make dev`**. That failure is **not** fixed by Audiveris setup alone — see **[progress.md — PDF intake 2026-06-04 PM](progress.md#wl-pdf-intake-chords-export-2026-06-04-pm)**.

> Never put secrets in `NEXT_PUBLIC_*` variables — they're in the client bundle.

---

## Path B — Self-hosted Docker (full PDF support)

This image bundles Node + Next.js + **Audiveris** (Java 25) in one container.

```bash
make docker-build     # multi-stage build (Audiveris + Next.js)
make docker-run       # serves on http://localhost:3000
```

Or use `docker compose up --build` at the repo root.

### Host-side checklist

| Requirement | Notes |
|-------------|-------|
| Docker / compose | Any modern runtime (Docker Desktop, OrbStack, Colima, …). |
| Inbound port 3000 | Map to whatever public port your host expects. |
| Build time | First **`docker build`** compiles Audiveris from source (several minutes). |

### Environment variables (same names as Vercel)

See the [`.env.example`](../.env.example) at the repo root. Pass them with `docker compose` or your orchestrator's secrets manager. The container additionally honors:

| Variable | Purpose |
|----------|---------|
| `AUDIVERIS_BIN` | Path to Audiveris CLI (default `/app/audiveris/bin/Audiveris` in Docker). |
| `TESSDATA_PREFIX` | Tesseract English data (default `/app/tessdata` in Docker). |
| `JAVA_HOME` | JRE for Audiveris (set in Docker image). |

### Local development (without Docker)

```bash
make install           # Node deps
make audiveris-setup   # Java 25+, clone/build Audiveris under scripts/audiveris/vendor/, tessdata
make audiveris-convert # PDFs in scripts/audiveris/input/ → MusicXML in output/
make dev
```

Upload a PDF on Playground after setup completes.

### Recommended hosts

- **Render / Railway / Fly.io / DigitalOcean App Platform** — all accept the repo's root `Dockerfile` directly.
- **Your own VM + Compose** — `docker compose up -d` behind a reverse proxy.

---

## Order of operations (both paths)

```text
1. Configure env vars on the host
2. Build / deploy
3. GET /api/health → expect { status: "ok" }
4. Upload a MusicXML sample → /document shows preview → Generate → Sandbox
5. (Docker or local Audiveris) Upload a PDF → /document shows raster + melody preview → Generate → Sandbox
6. Sandbox → Export → PDF → print preview shows OSMD engraving (no app chrome)
```

If step 5 fails with a **501**, confirm **`AUDIVERIS_BIN`** is on PATH or run **`make audiveris-setup`** locally. If step 5 fails with **500** and the server log mentions **`@napi-rs/canvas`**, fix native canvas deps and restart dev (see PDF note above). Playground may show an Audiveris hint even for **500** — read the **first line** of the error and the dev-server stack trace.

---

## Related docs

| Doc | Why |
|-----|-----|
| [README.md](../README.md) | Repo overview, Makefile, folder map |
| [frontend/README.md](../frontend/README.md) | Routes, `src/` layout, RiffScore patch |
| [plan.md](plan.md) | Feature checklist + study toggles |
| [progress.md](progress.md) | Day-to-day log, current status |
