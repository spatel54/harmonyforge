# PROGRESS

---

## [2026-10-30 Session 4] — Close the OMR origin edges (localhost + Vercel previews)

**Session goal:** Make OMR usable from local dev and preview deployments, and stop `/api/health` claiming "ready" on origins the sidecar would refuse.

### Reasoning

Two coupled defects after the sidecar went live: the allowlist held only the production origin, and the health probe is **server-side** (no `Origin` header), so the sidecar answered about *itself* rather than about the caller. A preview therefore hid the banner and then failed at upload with an opaque CORS error — strictly worse than an honest "unavailable".

### Action

| Change | File |
|---|---|
| `*` globs in the origin allowlist; `/health?origin=` returns `originAllowed` | `services/omr/server.mjs` |
| `probeOmrService(origin)`; `ready` now means "an upload from HERE will convert" | `frontend/src/server/omrService.ts` |
| Forward the deployment's own origin via `x-forwarded-host` | `frontend/src/app/api/health/route.ts` |
| Third banner message: "not authorized for this URL" vs cold-start vs not-configured | `frontend/src/app/page.tsx` |
| `OMR_ORIGINS` (prod + team + preview glob + localhost 3000/3001); single `--set-env-vars` with `^|^` delimiter | `Makefile` |
| 8 new origin-contract tests | `frontend/src/server/omrService.test.ts` |

Commit `4477ebc8`, pushed to `spatel54/main`; Cloud Run revision `00003`.

### Learning

- **A `*.suffix` subdomain wildcard is the wrong tool for Vercel previews.** Preview hostnames are **flat** — `harmonyforge-<hash>-sjp10-9620s-projects.vercel.app` has no dot before the team segment — so the subdomain wildcard never matches, and the tempting fallback `*.vercel.app` would admit **every app on Vercel** to a metered free tier. The glob now matches `[A-Za-z0-9-]+` and never a dot, anchored, with everything else regex-escaped. **My own test caught this** before deploy.
- Repeated `--set-env-vars` flags are fragile when a value contains commas; one flag with the `^|^` alternate delimiter is the robust form.

### Verification

Live against revision 00003: prod / localhost:3000 / branch-preview origins all receive `access-control-allow-origin`; `evil.example` blocked. `/health?origin=` → `true / true / false`, and `null` when unasked. Production `/api/health` now reports `originAllowed: true` with the resolved `origin`. 549 tests, lint clean, build clean.

### Progression / remaining

- **Local dev still needs a one-time step:** add `OMR_SERVICE_URL` + `OMR_SHARED_SECRET` to `frontend/.env.local` to get `transport: "remote"` without a JDK. Until then the local banner persists — the original complaint is fixed in production and *available* locally, not automatic.
- **Preview health not verified end-to-end:** the project has SSO deployment protection, so preview URLs could not be curled anonymously. Origin logic is proven at the sidecar and in tests, not on a live preview page.
- **Secret hygiene:** `OMR_SHARED_SECRET` is a plain Cloud Run env var, readable by anyone with console access to `harmonyforge-omr`. Fine solo; Secret Manager is the hardening step if collaborators appear.

---

## [2026-10-30 Session 3] — Lane C deployed: PDF → MusicXML works in the cloud (verified on real scores)

**Session goal:** Stand up the Cloud Run OMR sidecar and prove a real PDF converts end-to-end.
**Workflow used:** Provision → deploy → verify with real scores → fix what verification exposed.

### Action

| Step | Result |
|---|---|
| `gcloud` install + auth | ✅ `sh.patel5445@gmail.com`; already on PATH via `/opt/homebrew/bin/gcloud` (brew caveat does not apply) |
| Billing | ⚠️ Original account `011F90-…` was **closed**; Superman created `0139F8-4FC072-A29F7E` ("Personal Billing", open) |
| Project | ✅ Created dedicated `harmonyforge-omr`, linked billing, enabled `run` + `cloudbuild` + `artifactregistry` |
| Artifact Registry | ⚠️ `--source` deploy failed with `PERMISSION_DENIED` on `cloud-run-source-deploy`. Cause was **"repo does not exist"**, not IAM (confirmed `roles/owner`, 0 repos). Created the repo explicitly → deploy succeeded |
| Deploy | ✅ `harmonyforge-omr-00002-7p5` → `https://harmonyforge-omr-6ioyvvatqq-uc.a.run.app` |
| Vercel env | ✅ `OMR_SERVICE_URL` + `OMR_SHARED_SECRET` set on **Production** (encrypted) |

### Verification — real end-to-end OMR, first time ever on a deployed host

| Score (source) | Convert | MusicXML | Notes | Metadata read |
|---|---|---|---|---|
| Bach WTK1 Prelude 1 (Mutopia, LilyPond) | **96 s** | 265 KB | **709** | "Das Wohltemperierte Clavier I" / "Prelude 1" |
| Schumann *Träumerei* Op. 15 No. 7 (Mutopia) | **86 s** | 182 KB | **392** | "Kinderscenen" / composer "Robert…" |
| `IMG_9642.pdf` (repo fixture, **macOS photo PDF**) | 7.5 s | — | — | **422 no notation** — the documented raster-PDF gap, reproduced exactly |

`/api/omr-merge` parsed both real `.mxl` outputs to 200. Title OCR rendered "Träumerei" as "Traiimerei" (umlaut misread — normal Tesseract behavior; note data unaffected).

### Learning

- **Cloud Run throttles CPU outside request handling**, so the startup `java -version` probe hit its 10 s timeout and the service logged `java=false ready=false` — a **false negative** that `/health` masked (during a request CPU is allocated, so it returned `ready: true`). Found only by reading logs after a successful health check. Fixed with `--cpu-boost` + a 30 s probe timeout; revision 00002 now logs `audiveris=true java=true ready=true` at boot. **A green health check did not mean the startup path was healthy.**
- **`PERMISSION_DENIED` from Artifact Registry can mean "absent", not "forbidden".** Checking IAM first (`roles/owner`, zero repos) turned a misleading error into a one-command fix.
- ~90 s per 2-page score is the real cost curve: comfortably inside Cloud Run's 3600 s ceiling, and it would have **fit** Vercel's 300 s cap for small scores — but not the 15-min budget a long score needs, which is why the sidecar is still the right call.
- The photo-PDF gap is **confirmed real**, not theoretical. Phone photos need the local rasterize-then-OMR path, which has no remote equivalent.

### Progression

- **Done:** sidecar live and proven on real scores; Vercel production env vars set; startup bug found and fixed.
- **Blocking production:** **the OMR code is still uncommitted.** Vercel deploys from git, so `harmonyforge.vercel.app` does not yet have `/api/omr-grant` or `/api/omr-merge` — the env vars alone change nothing. Commit + push is required and was **not** done (no instruction to commit).
- **Untested in production:** the browser → sidecar hop from the real Vercel origin. CORS is allowlisted to `https://harmonyforge.vercel.app` only, so **preview deployments will 403** until their origins are added.

### History — do not silently reverse

- Secret lives only in Vercel (encrypted) + Cloud Run env + the session scratchpad. **It is not in the repo.** Rotating it means updating both sides together or every upload 401s.
- `--cpu-boost` and the 30 s java probe are load-bearing for honest startup readiness; removing either reintroduces the false negative.
- CORS allowlist is intentionally explicit (never `*`) because `/convert` spends CPU against a metered free tier.
- Cloud Run service URL is `https://harmonyforge-omr-6ioyvvatqq-uc.a.run.app`. The deploy output also prints a `-8137929273.us-central1` form; the `describe`-reported URL above is the one configured in Vercel.

---

## [2026-10-30 Session 2] — Lane C: free PDF OMR via a Cloud Run sidecar (ADR 004)

**Session goal:** Make deployed PDF → MusicXML work at **$0**, keeping the app on Vercel.
**Workflow used:** Research (verified pricing/limits against vendor docs) → Plan + gate → Implement → Verify.

### Reasoning

Session 1 built lane A (whole app on Fly). Superman then asked whether a *free* option existed. Research changed the picture and produced one correction:

- **I had claimed "OMR cannot be serverless." That was wrong** — it cannot run on *Vercel Functions* (no JVM; 300s cap vs. a 900 000 ms budget), but **Cloud Run** is a serverless container platform with a **60-minute** max request and an always-free tier (**180,000 vCPU-s / 360,000 GiB-s / 2M requests per month, no end date**). That is ~600 free conversions/month — the workload fits at $0.
- **Fly's real cost was also mis-stated:** I said "$5–20/mo"; the config I wrote (`shared-cpu-2x` + 4 GB) is **≈ $25.39/mo** ($13.39 for 2 GB + $6/GB). Scaled to zero it is ~$2.
- **A third limit set the topology:** Vercel caps function request bodies at **4.5 MB** against 25 MB uploads, so the app cannot even *proxy* a score. The browser **must** upload to the sidecar directly. This is a constraint, not a preference.
- **Hugging Face Spaces was evaluated and rejected** — idiomatic for ISMIR demos, but Docker Spaces now require a paid plan; only Static Spaces are free.

### Action

| Task | File(s) | Status |
|---|---|---|
| OMR sidecar service | `services/omr/{server.mjs,Dockerfile,package.json,README.md}` *(new)* | ✅ Zero dependencies — Node stdlib only |
| Capability minting + sidecar probe | `frontend/src/server/omrService.ts` *(new)* | ✅ 5-min HMAC-SHA256 grant; secret never reaches the browser |
| Grant endpoint | `frontend/src/app/api/omr-grant/route.ts` *(new)* | ✅ 501 with guidance when unconfigured |
| Parse + merge endpoint | `frontend/src/app/api/omr-merge/route.ts` *(new)* | ✅ Size/count caps; reuses the local parser |
| Reuse the local parser for remote output | `audiverisPipeline.ts` | ✅ `parseRemoteOmrDocuments()` → same `parseAudiverisWorkDir()`; basename-only, `.xml`/`.mxl` only |
| Client two-hop transport | `frontend/src/lib/ui/remoteOmrUpload.ts` *(new)* | ✅ |
| Transport selection | `api/health/route.ts`, `lib/ui/omrTransport.ts` *(new)* | ✅ `local` wins over `remote` so `make dev` never bills the sidecar |
| Playground wiring + transport-aware banner | `frontend/src/app/page.tsx` | ✅ Distinguishes "starting up" from "not configured" |
| Cross-service contract tests | `frontend/src/server/omrService.test.ts` *(new)* | ✅ 13 tests incl. tamper, expiry, traversal, secret-leak |
| Deploy targets | `Makefile` | ✅ `omr-secret`, `omr-build`, `omr-run`, `omr-deploy`, `omr-health` |
| ADR + docs + env template | `docs/adr/004-omr-service-boundary.md` *(new)*, `docs/deployment.md`, `frontend/.env.example` | ✅ Paths renumbered A–D; "one artifact" premise amended |

**Verification:** 541/541 tests pass (85 files) · `tsc` 23 errors, all pre-existing and all in test files, **none in source** · eslint clean on all 9 changed/new files · `npm run build` succeeds with `/api/omr-grant` + `/api/omr-merge` registered · `make` parses, all 10 targets resolve.

**Live integration run** (sidecar on :8113 + `next start` on :3010): `/api/health` correctly reported `transport: "none"`, `remote.configured: true`, `remote.ready: false` ("sidecar /health returned 503"); `/api/omr-grant` minted a 300 s grant that the **sidecar accepted** (reached the Audiveris check → 501), with the shared secret absent from the response; `/api/omr-merge` round-tripped a real MusicXML document → 200, and returned 422/400 on bad-extension and empty input. Direct sidecar probes confirmed 401 (no/bad token), 403 (disallowed origin), 415 (bad extension), 413 guard, and CORS allowlisting.

### Learning

- **A readiness probe that spawns a process is an attack surface.** `convert()` originally probed `omrStatus()` (which forks `java -version`) *before* validating the extension, so a junk-extension flood could fork a process per request. Reordered: cheap validation first. Caught only by running the service, not by reading it.
- **The decisive Vercel limit was the 4.5 MB body cap**, not the JVM or the timeout. It is what forces browser→sidecar upload and makes a tidy app-proxies-backend design impossible.
- Keeping parsing in the app (sidecar returns raw `.mxl`/`.xml`) means there is still exactly **one** score parser. The alternative would have duplicated `mergeParsedScores` across two services.

### Progression

- **Done:** full lane C implementation, verified to the limit of what is testable without Java on this machine.
- **Pending (Superman):** install `gcloud`, enable `run`+`cloudbuild`, `make omr-secret` → `make omr-deploy` → `make omr-health`, then set `OMR_SERVICE_URL` + `OMR_SHARED_SECRET` on Vercel and redeploy.
- **Never executed here:** no image was built and nothing was deployed. **No real PDF has been converted end-to-end** — this machine has no JDK, so the Audiveris leg is unproven in CI and in production. First real PDF after deploy is the actual test.

### History — do not silently reverse

- **ADR 004 is now the recorded decision**: OMR lives in a separate service. Lane A (`fly.toml`, root `Dockerfile`) is retained and still works — reverting is a hosting change, not a code change.
- **Local transport must keep winning over remote.** If that order flips, `make dev` silently spends the free tier on work the machine can already do.
- `OMR_SHARED_SECRET` is server-side only. Exposing it via `NEXT_PUBLIC_*` would hand anyone an unlimited grant minter.
- The sidecar must **not** gain a MusicXML parser. Returning raw documents is deliberate.
- `--max-instances=2` and `--concurrency=1` bound free-tier burn; raising them raises the bill.
- **Known gap, not a bug:** the sidecar takes one file per request. The local raster-image-PDF path (rasterize → OMR per page) has no remote equivalent, so phone-photo PDFs may do worse remotely than locally.

---

## [2026-10-30 Session 1] — Move production to a container host so Audiveris OMR works deployed

**Session goal:** PDF → MusicXML works locally but not in the cloud. Make deployed OMR real.
**Workflow used:** Research → Plan (preview + gate, lane chosen by Superman) → Implement.

### Reasoning

Two *independent* blockers were found on Vercel, and only the first is the one people notice:

1. **No JVM.** `resolveAudiverisBin()` finds nothing in a serverless bundle → `getOmrStatus().ready === false` → OMR uploads 501.
2. **Timeout arithmetic.** `to-preview-musicxml/route.ts` sets `maxDuration = 300` against a `DEFAULT_AUDIVERIS_MS` of `900_000`. Even with a JVM shipped into the function, Vercel kills the request at 5 min on a 15-min job.

Because of (2), *no amount of bundling fixes Vercel* — OMR cannot be request-scoped serverless. Two lanes were offered: (A) move the whole app to the existing Docker image on a container host, zero new app code; (B) keep Vercel and add an OMR sidecar + async job API. **Superman chose lane A.**

### Action

| Task | File(s) | Status |
|---|---|---|
| Add root build-context ignore | `.dockerignore` *(new)* | ✅ Context was **2.1 GB** (1 GB `node_modules`, 656 MB `.next`, 92 MB `.mov`, 293 MB `.git`) and swept `frontend/.env.local` into the image |
| Bump runtime off EOL Node | `Dockerfile` | ✅ Node 20 → 22 (Node 20 is past EOL; Next 16 needs ≥ 20.9) |
| Stop baking the API key into build layers | `Dockerfile` | ✅ Dropped `OPENAI_API_KEY` build ARG — runtime-only secret now |
| Explicit bind + no boot-time `npx` | `Dockerfile` | ✅ `next start -H 0.0.0.0`, resolved from `node_modules/.bin` |
| Fly deploy config | `fly.toml` *(new)* | ✅ `fly config validate` passes |
| Make the OMR budget host-tunable | `audiverisPipeline.ts` | ✅ New `HF_AUDIVERIS_MAX_MS`; `FALLBACK_AUDIVERIS_MS` keeps the 900 000 default |
| Deploy targets | `Makefile` | ✅ `fly-launch`, `fly-secrets`, `fly-deploy`, `fly-logs`, `fly-health` |
| Rewrite the deployment guide | `docs/deployment.md` | ✅ Fly is Path A; Vercel demoted to Path B (previews); Docker-by-hand is Path C |

**Verification:** `tsc --noEmit` → 49 errors, confirmed **identical with the change stashed** (all pre-existing, in test files + missing `sonner`). `vitest fileIntake.test.ts` → 22/22 pass. `eslint audiverisPipeline.ts` → clean. `fly config validate` → valid. **Image not built and not deployed** — `make fly-deploy` creates billable infrastructure and is Superman's to run.

### Learning

- The 2.1 GB build context was invisible until measured — `frontend/.dockerignore` existed and gave false comfort, but the Dockerfile builds from the **repo root**, where no ignore file existed.
- `.dockerignore` does **not** do gitignore-style basename matching at every level. A bare `brand` would not have matched `frontend/public/brand`, but patterns are now root-anchored (`/brand`) so the shipped brand assets cannot be excluded by accident.
- A JVM OOM-kills on Fly's 256 MB default machine; 4 GB is the floor for a multi-page score.

### Progression

- **Done:** every artifact needed to deploy lane A, verified as far as is possible without building.
- **Pending (Superman):** `make fly-launch` → `make fly-secrets` → `make fly-deploy` → `make fly-health`. First build compiles Audiveris from source.
- **Pending (known gap, not done):** PDF intake still holds **one HTTP request open for the whole conversion**. Fly tolerates it; an intermediary with an idle-response timeout will not. The real fix is an async job API (`POST /jobs` → poll), which is lane B work and was explicitly out of scope.

### History — do not silently reverse

- **Vercel is no longer the production target for PDF intake, by decision.** It stays as a preview/UI-review host. Do not "simplify" by folding OMR back into a Vercel route — blocker (2) makes that impossible, not merely slow.
- `OPENAI_API_KEY` must **not** be reintroduced as a Docker build ARG; ARG values persist in build cache and image history.
- `docs/deployment.md` still opens with "HarmonyForge is one Next.js app… You deploy one artifact." Lane A **preserves** that invariant. Lane B would have broken it and needed an ADR.
- The Playground Audiveris banner is still non-dismissible and will keep showing **locally** (no JDK on this machine). Deployed, it self-resolves once `omr.ready` is true. The dismissible-banner change was scoped and *not* approved.

---

## [2026-08-16 Session 1] — Set up Slack + a persistent daily Vercel deploy digest

**Session goal:** Verify Slack MCP connectivity, then stand up a recurring notification of Vercel deploy activity to the team that survives independent of any Claude session.
**Workflow used:** Chat, iterative build-test-fix on a GitHub Actions workflow.

### Skills Invoked

| Skill | Purpose | Outcome |
|---|---|---|
| `/ruflo-loop-workers:cron-schedule` | Look for a way to make a cron job survive session restarts | Rejected — skill's claim contradicted `CronCreate`'s own tool spec (session-only, 7-day expiry); used GitHub Actions `schedule:` instead |

### Tasks Completed

| Task | File(s) | Status |
|---|---|---|
| Authenticate Slack MCP plugin | — | ✅ OAuth flow completed, verified live with a test API call |
| Locate/unarchive `#daily-dev-updates` channel | — | ✅ Found via `slack_search_public_and_private`, user unarchived it |
| Scaffold daily Vercel digest workflow | `.github/workflows/daily-vercel-digest.yml` | ✅ Created, posts prod-deploy summary to Slack at 9:03am CT + manual `workflow_dispatch` |
| Fix broken message formatting | `.github/workflows/daily-vercel-digest.yml` | ✅ Switched to `printf` for real newlines, truncated commit messages to first line |
| Fix false-failure / duplicate-link noise | `.github/workflows/daily-vercel-digest.yml` | ✅ Filtered to `target=production`, dedupe by `meta.githubCommitSha` |
| Verify end-to-end | — | ✅ Triggered `workflow_dispatch` 3x, confirmed final message renders cleanly in Slack |

### Key Decisions

- Rejected in-session `CronCreate` for the recurring digest — user explicitly wants something not tied to a live Claude session. Went with a GitHub Actions `schedule:` trigger instead, which runs on GitHub's infra independent of any AI session.
- Workflow pushed to the `spatel54/harmonyforge` fork only (user's explicit choice), not `origin` (`salt-family/harmonyforge`). Secrets (`VERCEL_TOKEN`, `SLACK_BOT_TOKEN`) must live on whichever repo actually runs the workflow.

### Learnings

- Vercel's `/v6/deployments` API returns every deployment attempt (all branches, all preview builds) unless filtered by `target=production` — unfiltered, this makes a digest look like it's reporting failed merges when it's really just noisy preview builds.
- Bash double-quoted strings don't expand `\n` — use `printf` when building multi-line text destined for a JSON payload in a `run:` step.
- A locally installed skill's guidance can be factually wrong relative to the tool's own spec (ruflo's cron-schedule skill claimed session-durability that `CronCreate`'s description explicitly disclaims) — trust the tool's own docs over a skill's summary when they conflict.
