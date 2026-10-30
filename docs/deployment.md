# Deployment guide

> **HarmonyForge is one Next.js app.** The SATB engine lives inside the same process under [`frontend/src/server/engine/`](../frontend/src/server/engine) and is reachable at `/api/*` route handlers.
>
> **One exception:** optical music recognition (PDF/image → MusicXML) runs in a separate container, because Audiveris needs a JVM and minutes of CPU that no serverless function provides. Everything else is still one artifact. See [ADR 004](adr/004-omr-service-boundary.md).

Pair this with **[progress.md](progress.md)** (current status) and **[plan.md](plan.md)** (checklist).

**Local secrets template:** [`frontend/.env.example`](../frontend/.env.example) lists **`OPENAI_API_KEY`**, optional **`OPENAI_BASE_URL`** / **`OPENAI_URL`**, and **`OPENAI_MODEL`** (chat model id; code defaults to **`gpt-5-nano`** for lowest standard-tier API cost—override if your provider uses another id). The tables below add **production tuning**; you do not need every variable in `.env.local` for development.

---

## Pick your target

| Target | What it gets you | Trade-off |
|--------|------------------|-----------|
| **Vercel + Cloud Run OMR sidecar** ← *production* | Keeps Vercel (previews, instant rollbacks) **and** full PDF → MusicXML. **$0** within Cloud Run's always-free tier. | Two deploys, a shared secret, and a CORS allowlist. Cold starts are user-visible. See [ADR 004](adr/004-omr-service-boundary.md). |
| **Fly.io / container host** | One artifact, no service split, no cold start. | ~$25/mo warm, ~$2/mo scaled to zero. Fly has no free tier. |
| **Vercel alone** | Previews only. | **PDF → MusicXML cannot work** — two independent blockers (below). MusicXML/MXL/MIDI work fully. |

All three produce identical UX for symbolic files. PDF intake needs Audiveris somewhere — the sidecar, a container host, or local **`make audiveris-setup`**.

### Why OMR cannot run on Vercel

This is a structural limit, not a configuration gap. Two separate blockers:

1. **No JVM.** Audiveris is a Java application. `resolveAudiverisBin()` finds nothing in a serverless bundle, so `getOmrStatus()` reports `ready: false` and OMR uploads 501.
2. **Timeout arithmetic.** [`to-preview-musicxml/route.ts`](../frontend/src/app/api/to-preview-musicxml/route.ts) declares `maxDuration = 300`, while the Audiveris budget is **900 000 ms (15 min)**. Even with a JVM present, Vercel would kill the request at 5 minutes. Audiveris is a multi-minute batch process; it does not fit a request-scoped function.

Shipping a JDK into a function would only address blocker 1. That is why Audiveris runs in a container — either a sidecar (Path A) or the whole app (Path B).

A third limit sets the topology: **Vercel caps function request/response bodies at 4.5 MB** while uploads are allowed to 25 MB. The app therefore cannot even *proxy* a score to a backend — the browser must upload to the sidecar directly.

---

## Path A — Vercel + Cloud Run OMR sidecar (production, free)

The Next.js app stays on Vercel. Audiveris moves to [`services/omr/`](../services/omr) on Cloud Run, which allows **60-minute requests** (vs. Vercel's 300 s) and scales to zero.

```text
browser ──(1) POST /api/omr-grant ─────→ Vercel     mint a 5-min HMAC capability
browser ──(2) POST {sidecar}/convert ──→ Cloud Run  25 MB PDF, long request
browser ──(3) POST /api/omr-merge ─────→ Vercel     small MusicXML, parsed + merged
```

### Cost

Cloud Run's always-free tier is **180,000 vCPU-s · 360,000 GiB-s · 2M requests per month**, with no end date. At 2 GiB and ~5 min per conversion that is **≈ 600 free conversions/month**. Beyond that it bills, so `--max-instances=2` bounds the blast radius.

### Deploy the sidecar

Requires the `gcloud` CLI (`brew install --cask google-cloud-sdk`) and a GCP project with billing enabled — the free tier still requires a billing account on file.

```bash
gcloud auth login
gcloud config set project <your-project-id>
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

make omr-secret                 # generate a shared secret — save it
export OMR_SHARED_SECRET=<that value>
make omr-deploy                 # builds the Dockerfile on Cloud Build
make omr-health                 # must print ready: true
```

### Then configure Vercel

| Variable | Value | Notes |
|---|---|---|
| `OMR_SERVICE_URL` | the Cloud Run URL from `make omr-health` | Server-side only. No trailing slash needed — it is stripped. |
| `OMR_SHARED_SECRET` | the same value you set on Cloud Run | **Must match exactly**, or every upload 401s. |

Redeploy Vercel, then confirm `/api/health` reports `omr.transport: "remote"` and `omr.ready: true`.

> The secret is a server-side variable. **Never** put it in a `NEXT_PUBLIC_*` variable — the browser receives only a short-lived signed grant.

If you change the Vercel domain, update `VERCEL_ORIGIN` and re-run `make omr-deploy` — the sidecar's CORS allowlist is explicit and will refuse an unknown origin with `403`.

### Transport selection

`GET /api/health` reports `omr.transport`:

| Value | Meaning |
|---|---|
| `local` | Audiveris on this host — dev machine, or the all-in-one image. **Wins when both exist**, so `make dev` never bills the sidecar. |
| `remote` | The Cloud Run sidecar. |
| `none` | PDF intake unavailable; symbolic formats still work. |

### Known gaps

- **Cold starts are visible.** A scaled-to-zero instance pulling a JDK + Audiveris image takes seconds before OMR begins. The Playground banner says "starting up" rather than "not configured" when a sidecar is set.
- **Multi-image page sets are not supported remotely.** The sidecar takes one file per request. The local raster-image-PDF path (rasterize → OMR per page) has no remote equivalent, so phone-photo PDFs may do worse remotely than locally.

---

## Path B — Fly.io, single artifact (~$2–25/mo)

Use this instead of Path A if you would rather pay a couple of dollars a month than maintain a service split. No cold starts, no shared secret, no CORS.

Runs the root [`Dockerfile`](../Dockerfile) — Node 22 + Next.js + Audiveris 5.9.0 (JDK 25) + Tesseract in one image. Config lives in [`fly.toml`](../fly.toml), committed.

```bash
fly auth login          # once per machine
make fly-launch         # once per app — creates it from fly.toml, no deploy
export OPENAI_API_KEY=sk-...
make fly-secrets        # runtime secrets; never baked into the image
make fly-deploy         # build (remote builder) + release
make fly-health         # asserts omr.ready === true on the live host
```

`make fly-deploy` uses `--remote-only`, so **no local Docker daemon is required**. The first build compiles Audiveris from source — expect several minutes; later builds reuse cached layers.

### Why the machine is sized the way it is

| `fly.toml` setting | Reason |
|---|---|
| `memory = "4gb"`, `shared-cpu-2x` | A JVM running OMR **OOM-kills on Fly's 256 MB default.** 4 GB is the smallest size that reliably finishes a multi-page score. |
| `min_machines_running = 1` | Keeps `/api/health` truthful and avoids a cold JVM start on the first PDF. |
| `auto_stop_machines = "suspend"` | Never stop a machine with an OMR batch in flight. |
| `soft_limit = 2` | Audiveris is CPU-hungry — queue batches instead of running them in parallel. |
| `grace_period = "60s"` | The health check must not fail the app while a long batch saturates the CPU. |
| `HF_AUDIVERIS_MAX_MS = 600000` | 10-min cap so one stuck batch cannot pin the only machine for a quarter hour. Unset → 900 000 ms. |

### Known residual risk — long synchronous requests

PDF intake holds **one HTTP request open for the entire conversion** (up to `HF_AUDIVERIS_MAX_MS`). Fly's proxy tolerates long-lived connections, but any intermediary with an idle-response timeout will sever a multi-minute upload. If you see client-side aborts on large PDFs while the server log shows Audiveris still running, the fix is an **async job API** (`POST /jobs` → poll `GET /jobs/:id`), not a larger timeout. That work is **not** done — the current design is synchronous.

### Other container hosts

`fly.toml` is Fly-specific; the `Dockerfile` is not. Render, Railway, DigitalOcean App Platform, and Cloud Run all accept it directly — replicate the memory floor (≥ 4 GB) and the request-timeout considerations above. Cloud Run allows 60-minute requests, which clears the OMR budget with the most headroom.

---

## Path C — Vercel alone (previews, no PDF OMR)

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
| `OMR_SERVICE_URL` | Server | Cloud Run OMR sidecar base URL. Unset → no PDF intake. **Path A only.** |
| `OMR_SHARED_SECRET` | Server | HMAC key for sidecar grants. Must match the sidecar exactly. **Never `NEXT_PUBLIC_*`.** |
| `NEXT_PUBLIC_HF_*` | Browser | M5 study toggles — see [plan.md §M5](plan.md). |

If Theory Inspector returns **401** and the error text names a **model** (e.g. `gpt-4o-mini`) instead of `sk-…`, you almost certainly put the **model id in `OPENAI_API_KEY`** and the **secret in `OPENAI_MODEL`**. Swap them in the Vercel dashboard, attach vars to **Preview** as well as **Production** if you use preview URLs, and **redeploy**. The app’s **`getServerOpenAIEnv()`** can auto-recover when one side looks like **`sk-…`** and the other like **`gpt-…`**, but fixing env names is the durable fix—see **[progress.md — 2026-04-27 naturals / LLM / audit](progress.md#wl-sandbox-naturals-llm-audit-2026-04-27)**.

6. **Deploy** → confirm `/api/health` returns `{ "status": "ok" }` (self-hosted / local with Audiveris also **`omr.ready`**).
7. **Smoke test** the upload → generate → sandbox flow with MusicXML (fastest) and MXL.

**PDF on Vercel:** the browser client-rasterizes PDFs via `pdfjs-dist` so you always see a thumbnail on `/document`. Running **Audiveris** requires Java on the server — if you need PDF → MusicXML, use **Path A** (Cloud Run sidecar) or **Path B** (Fly.io), or local **`make audiveris-setup`**.

**Local dev — `Preview failed: 500` on PDF:** If the Next dev log shows **`@napi-rs/canvas`** / **`skia.*.node` MODULE_NOT_FOUND**, run **`make install`**, ensure **`frontend/next.config.ts`** lists **`@napi-rs/canvas`** under **`serverExternalPackages`**, then **`make dev-clean && make dev`**. That failure is **not** fixed by Audiveris setup alone — see **[progress.md — PDF intake 2026-06-04 PM](progress.md#wl-pdf-intake-chords-export-2026-06-04-pm)**.

**Local dev — Audiveris batch fails with `Application is not launched`:** You likely built the **`development`** branch. Re-run **`make audiveris-setup`** — it pins **Audiveris 5.9.0** (see **[progress.md — PDF I/O 2026-08-14](progress.md#wl-pdf-io-2026-08-14)**).

> Never put secrets in `NEXT_PUBLIC_*` variables — they're in the client bundle.

---

## Path D — Docker on your own host (same image, no Fly)

Identical image to Path B, driven by hand instead of `fly.toml` — use this for local production parity or your own VM. It bundles Node + Next.js + **Audiveris** (Java 25) in one container.

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
| `HF_AUDIVERIS_MAX_MS` | Audiveris wall-clock cap (ms). Unset → **900 000** (15 min). Read at process start, so restart after changing it. |

### Local development (without Docker)

```bash
make install           # Node deps
make audiveris-setup   # Java 25+, clone/build Audiveris under scripts/audiveris/vendor/, tessdata
make audiveris-convert # PDFs in scripts/audiveris/input/ → MusicXML in output/
make dev
```

Upload a PDF on Playground after setup completes.

### Recommended hosts

- **Fly.io** — committed `fly.toml`, see **Path B**.
- **Render / Railway / DigitalOcean App Platform / Cloud Run** — all accept the root `Dockerfile` directly; match the ≥ 4 GB memory floor.
- **Your own VM + Compose** — `docker compose up -d` behind a reverse proxy. Raise the proxy's read/response timeout above `HF_AUDIVERIS_MAX_MS`, or long PDF conversions will be cut off mid-request (nginx default `proxy_read_timeout` is 60s).

---

## Order of operations (both paths)

```text
1. Configure env vars on the host
2. Build / deploy
3. **GET /api/health** → expect `{ status: "ok" }`. Local with Audiveris: **`omr.ready: true`**.
4. Upload a MusicXML sample → /document shows **editable** preview → **optionally fix notes** → Generate → Sandbox melody matches the staff
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
