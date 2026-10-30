# ADR 004 — OMR runs in a separate service

**Status:** Accepted
**Date:** 2026-10-30
**Supersedes:** nothing. **Amends:** the "one artifact" premise stated at the top of [`docs/deployment.md`](../deployment.md).

---

## Context

PDF/image → MusicXML works locally via the Audiveris CLI (`make audiveris-setup`) but has never worked on the deployed app. The deployment target is Vercel (`harmonyforge.vercel.app`). Two *independent* blockers were identified:

1. **No JVM in the Vercel function runtime.** `resolveAudiverisBin()` finds nothing in a serverless bundle, so `getOmrStatus()` reports `ready: false` and OMR uploads return 501.
2. **Timeout arithmetic.** `to-preview-musicxml/route.ts` declares `maxDuration = 300`; the Audiveris budget is `900_000` ms. Even with a JVM bundled, Vercel kills the request at 5 minutes on a 15-minute job.

Blocker 2 is the decisive one: bundling a JRE would address only blocker 1. **OMR cannot be a request-scoped Vercel function at any price.**

A third constraint shaped the topology: **Vercel caps function request/response bodies at 4.5 MB**, while score uploads are allowed up to 25 MB. So the app cannot even *proxy* the upload to a backend.

Two options were weighed:

- **A — move the whole app to a container host.** Zero new application code (the root `Dockerfile` already bakes Audiveris in). Costs ~$25/mo warm, ~$2/mo scaled-to-zero on Fly.io. Preserves the one-artifact invariant.
- **B — keep Vercel, extract OMR into a sidecar.** Cloud Run's always-free tier (180,000 vCPU-s / 360,000 GiB-s / 2M requests per month, no end date) and 60-minute max request timeout cover the workload at **$0**. Costs an architectural split.

Lane A was built first and remains on disk (`fly.toml`). Superman then chose **B**, prioritizing zero running cost.

## Decision

**OMR is a separate service.** `services/omr/` is a container bundling Audiveris 5.9.0 + JDK 25 + Tesseract behind a two-endpoint HTTP API, deployed to Cloud Run. The Next.js app stays on Vercel.

**The browser uploads directly to the sidecar.** Forced by the 4.5 MB Vercel body cap — this is a constraint, not a preference.

**The sidecar does not parse MusicXML.** It returns the raw `.mxl`/`.xml` documents Audiveris produced; the app parses and merges them via `parseRemoteOmrDocuments()`, which materializes them into a work dir and calls the same `parseAudiverisWorkDir()` a local run uses. There is exactly one score parser.

**Access is capability-gated.** `/api/omr-grant` mints a 5-minute HMAC-SHA256 token; the sidecar verifies it with a shared secret. An unauthenticated endpoint that spends CPU is an invitation to have your free tier drained.

```
browser ──(1) POST /api/omr-grant ─────────────→ Vercel    (mint capability)
browser ──(2) POST {sidecar}/convert ──────────→ Cloud Run (25 MB PDF, long request)
browser ──(3) POST /api/omr-merge ─────────────→ Vercel    (small MusicXML, parsed)
```

`GET /api/health` reports `omr.transport`: `"local" | "remote" | "none"`. **Local wins when both are available**, so `make dev` never bills a remote service for work the machine can do.

## Consequences

**Good**

- PDF intake works on the deployed app for the first time, at $0 within the Cloud Run free tier.
- Cloud Run's 60-minute request ceiling clears the 15-minute Audiveris budget with real headroom — no async job queue needed, where Fly or nginx would have required one.
- Scales to zero. An idle demo costs nothing.
- Local dev is untouched: no sidecar configured → `transport: "local"` → the existing `spawnSync` path.

**Bad**

- **The one-artifact invariant is gone.** Two deploys, two sets of secrets, a shared secret to rotate, and a CORS allowlist to maintain. `docs/deployment.md` is amended accordingly.
- **Cold starts are user-visible.** A scaled-to-zero instance pulling a JDK+Audiveris image takes seconds before OMR begins. The Playground banner distinguishes "starting up" from "not configured" for this reason.
- **Free tier is a ceiling, not a guarantee.** ~600 conversions/month at 2 GiB × 5 min. Past that it bills. `--max-instances=2` bounds the blast radius.
- **A multi-image page set is not supported in v1.** The sidecar accepts one file per request and runs the two-phase batch on it, matching `tryAudiverisOnInputFile`. The local-only raster-image-PDF path (`tryAudiverisOnPdfBuffer` → client/server rasterization → OMR per page) has no remote equivalent yet. Phone-photo PDFs may therefore do worse remotely than locally. Tracked, not fixed.

**Rejected alternatives**

- **Bundle a JRE into a Vercel function** — blocker 2 stands regardless; Active CPU pricing on a 300 s CPU-saturated function is not free.
- **Vercel Sandbox** — billed; no free tier.
- **Hugging Face Spaces** — checked because it is idiomatic for ISMIR demos. Docker Spaces now require a paid plan; only Static Spaces are free.
- **Proxy the upload through a Vercel route** — impossible at 25 MB against a 4.5 MB body cap.
- **Have the sidecar parse and merge** — would duplicate the score parser across two services and invite drift.

## Reversibility

Unsetting `OMR_SERVICE_URL` / `OMR_SHARED_SECRET` returns the app to `transport: "none"` with symbolic intake fully working. `fly.toml` and the root `Dockerfile` still implement lane A, so reverting to a single artifact is a hosting change, not a code change.
