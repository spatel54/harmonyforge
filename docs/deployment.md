# Deployment guide

> **HarmonyForge is one fullstack app:** a **Next.js** app (`frontend/`) with the SATB engine running **server-side** via **Next Route Handlers** (`/api/*`).  
> **Vercel** can host the UI and engine together (no separate backend host, no CORS routing).

Pair this with **[progress.md](progress.md)** (current blockers) and **[plan.md](plan.md)** (checklist).

---

## Order of operations

```text
1. Create a new Vercel project (root directory = frontend)
2. Set Vercel env (OPENAI_* optional; HF_* solver limits optional)
3. Deploy Vercel → get https://your-app.vercel.app
4. Browser smoke test (upload → generate → sandbox)
```

---

## 1. Fullstack app (Vercel)

1. **Import** the GitHub repo into Vercel.
2. **Root Directory:** `frontend` (required).
3. **Framework:** Next.js (auto).

**Environment variables (Vercel → Settings → Environment Variables)**

| Variable | Where it runs | Notes |
|----------|----------------|--------|
| **`NEXT_PUBLIC_GENERATE_TIMEOUT_MS`** | Browser | Optional. Abort **`generate-from-file`** after this many ms (default **180000**). Set high enough for your typical inputs; PDFs can spend most time in OMR. |
| **`OPENAI_API_KEY`** | Server (API routes) | **Secret.** Theory Inspector; omit for offline fallbacks where supported. |
| **`OPENAI_BASE_URL`** / **`OPENAI_URL`** | Server | Optional compatible API base. |
| **`OPENAI_MODEL`** | Server | Optional. |
| **`HF_SOLVER_MAX_MS`** | Server | Optional. Wall-clock SATB limit for file routes. **0 = unlimited**; if unset, file routes default to ~108s. |
| **`HF_SOLVER_MAX_NODES`** | Server | Optional. SATB node budget. |
| **`HF_MAX_CHORD_SLOTS`** | Server | Optional. Caps chord-grid density for long melodies. |
| M5 **`NEXT_PUBLIC_HF_*`** | Browser | Study toggles — see [plan.md](plan.md) M5 section. |

> **Never** put API keys in **`NEXT_PUBLIC_*`** variables — they are exposed in the client bundle.

Template for local dev: **[../frontend/.env.example](../frontend/.env.example)**.

---

## 2. Notes on PDF/OMR

PDF preview/generation still depends on external tooling (`pdfalto`, Poppler `pdftoppm`, and Python `oemer`). On Vercel this is typically **not** available; prefer **MusicXML / MXL / MIDI** for production deploys unless you’ve explicitly built a custom runtime.

More details and current status live in **[progress.md — Multi-format intake & PDF](progress.md#multi-format-pdf-intake)** and **[plan.md](plan.md)** section **1.9m**.

---

## 3. Safety checklist

- [ ] **`.env.local`** and **`.env`** under `frontend/` are **gitignored**; secrets live in **Vercel** only.
- [ ] No secrets are placed in `NEXT_PUBLIC_*` variables.
- [ ] Solver budgets are tuned (`HF_SOLVER_MAX_MS`, `HF_SOLVER_MAX_NODES`) so requests fail with clear 4xx errors instead of timing out.

---

## Related docs

| Doc | Why |
|-----|-----|
| [README.md](../README.md) | Local run, Makefile, folder map |
| [../frontend/README.md](../frontend/README.md) | Routes, `src/` layout, patch-package |
| [../backend/README.md](../backend/README.md) | Legacy engine layout (kept for CLI/tests) |

