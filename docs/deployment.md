# Deployment guide

> **HarmonyForge is two services:** a **Next.js** app (`frontend/`) and a **Node/Express** engine (`backend/`).  
> **Vercel** hosts the frontend well; the engine must run on a **separate** host that keeps a long-lived Node process (Railway, Render, Fly.io, Cloud Run, etc.).

Pair this with **[progress.md](progress.md)** (current blockers) and **[plan.md](plan.md)** (checklist).

---

## Order of operations

```text
1. Deploy backend  →  get https://your-api.example.com
2. Create Vercel project (root directory = frontend)
3. Set Vercel env   →  NEXT_PUBLIC_API_URL = that API URL
4. Deploy Vercel    →  get https://your-app.vercel.app
5. Set backend env  →  CORS_ORIGIN = exact Vercel origin (https://…)
6. Restart backend  →  browser smoke test (upload → generate → sandbox)
```

---

## 1. Backend (engine)

| Setting | Typical value |
|---------|----------------|
| **Project root** | `backend` (on hosts that support monorepo subfolders) |
| **Install** | `npm ci` or `npm install` |
| **Build** | `npm run build:engine` (outputs `engine/dist/`) |
| **Start** | `node engine/dist/server.js` (use a **production** start, not `tsx watch`) |
| **Port** | Engine defaults to **8000**; many platforms set **`PORT`** — map the platform port to the process or extend the server to read `process.env.PORT` if needed. |

**Environment**

| Variable | Purpose |
|----------|---------|
| **`CORS_ORIGIN`** | Must match your **frontend origin** exactly (scheme + host, no path), e.g. `https://my-app.vercel.app`. Default in code is `http://localhost:3000`. |

Optional PDF/OMR: **`PDFALTO_BIN`**, **`POPPLER_PDFTOPPM`**, **`OEMER_BIN`** — see [plan.md](plan.md) section **1.9m**.

---

## 2. Frontend (Vercel)

1. **Import** the GitHub repo into Vercel.
2. **Root Directory:** `frontend` (required).
3. **Framework:** Next.js (auto).

**Environment variables (Vercel → Settings → Environment Variables)**

| Variable | Where it runs | Notes |
|----------|----------------|--------|
| **`NEXT_PUBLIC_API_URL`** | Browser bundle | **Public.** Base URL of the engine, e.g. `https://your-api.example.com`. Changing it requires a **new deployment** (build-time inlining). |
| **`OPENAI_API_KEY`** | Server (API routes) | **Secret.** Theory Inspector; omit for offline fallbacks where supported. |
| **`OPENAI_BASE_URL`** / **`OPENAI_URL`** | Server | Optional compatible API base. |
| **`OPENAI_MODEL`** | Server | Optional. |
| M5 **`NEXT_PUBLIC_HF_*`** | Browser | Study toggles — see [plan.md](plan.md) M5 section. |

> **Never** put API keys in **`NEXT_PUBLIC_*`** variables — they are exposed in the client bundle.

Template for local dev: **[../frontend/.env.example](../frontend/.env.example)**.

---

## 3. CORS and preview deployments

The engine sends a **single** `Access-Control-Allow-Origin` header from **`CORS_ORIGIN`**.

| Scenario | What to do |
|----------|------------|
| **Production** | Set **`CORS_ORIGIN`** to your production Vercel URL (or custom domain). |
| **Vercel Preview** | Each preview has a **different** `*.vercel.app` URL. One fixed **`CORS_ORIGIN`** will **not** allow all previews unless you run a **staging** API with that preview origin, or **change the server** to allow multiple origins (not implemented in-repo today). |

---

## 4. Safety checklist

- [ ] **`.env.local`** and **`.env`** under `frontend/` are **gitignored**; secrets live in **Vercel** / backend dashboard only.
- [ ] **`NEXT_PUBLIC_API_URL`** points to **HTTPS** in production.
- [ ] **`CORS_ORIGIN`** matches the **exact** frontend URL users open in the browser.
- [ ] Backend process is **started with `node`** on compiled `dist`, not dev watch mode.

---

## Related docs

| Doc | Why |
|-----|-----|
| [README.md](../README.md) | Local run, Makefile, folder map |
| [../frontend/README.md](../frontend/README.md) | Routes, `src/` layout, patch-package |
| [../backend/README.md](../backend/README.md) | Engine layout, `build:engine`, Python/PDF note |
