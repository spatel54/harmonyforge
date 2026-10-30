# HarmonyForge OMR sidecar

Audiveris 5.9.0 behind a two-endpoint HTTP API. Exists because **PDF → MusicXML cannot run on Vercel**: no JVM in the function runtime, and a 300 s function cap against a 15-minute batch. See [ADR 004](../../docs/adr/004-omr-service-boundary.md).

Deployed to **Cloud Run**, which allows 60-minute requests and scales to zero — the workload fits the always-free tier.

## API

| Endpoint | Purpose |
|---|---|
| `GET /health` | `{ ok, audiveris, java, ready, details }`. `503` when not ready. |
| `POST /convert?name=score.pdf` | Raw file body (`application/octet-stream`, ≤ 25 MB). Returns `{ documents: [{ name, encoding: "base64", data }], elapsedMs }`. |

`/convert` requires `Authorization: Bearer <grant>` — a 5-minute HMAC-SHA256 capability minted by the app at `/api/omr-grant`. The browser never sees the shared secret.

**This service does not parse MusicXML.** It returns the raw `.mxl`/`.xml` Audiveris produced; the app parses and merges via `parseRemoteOmrDocuments()`, reusing the same parser a local run uses. One score parser, not two.

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `OMR_SHARED_SECRET` | **yes** | HMAC key. Must match the app's value exactly, or every upload 401s. |
| `OMR_ALLOWED_ORIGINS` | **yes** | Comma-separated CORS allowlist. Empty → browser calls refused. Never `*` — this endpoint spends CPU. |
| `HF_AUDIVERIS_MAX_MS` | no | Wall-clock budget (default `900000`). Split across the two batch phases. |
| `AUDIVERIS_BIN` | set in image | `/app/audiveris/bin/Audiveris` |
| `TESSDATA_PREFIX` | set in image | `/app/tessdata` |
| `PORT` | no | Default `8080` (Cloud Run sets this). |

## Deploy

```bash
make omr-secret                      # generate; set on BOTH Cloud Run and Vercel
export OMR_SHARED_SECRET=...
make omr-deploy                      # gcloud run deploy --source
make omr-health                      # must report ready: true
```

First deploy compiles Audiveris from source — several minutes.

## Design notes

- **Zero dependencies.** Standard library only, so there is no `npm install` in the image and no dependency surface to patch.
- **`--concurrency=1`.** Audiveris saturates CPU; a second concurrent batch on one instance makes both slower.
- **`--max-instances=2`.** Bounds how much of the free tier a burst can consume.
- **Input validation precedes the readiness probe.** The probe spawns `java -version`; a junk-extension flood must not fork a process per request.

## Known gap

v1 accepts **one file per request** and runs the two-phase batch on it, matching `tryAudiverisOnInputFile`. The local-only raster-image-PDF path (rasterize → OMR per page) has no remote equivalent, so phone-photo PDFs may do worse here than locally.
