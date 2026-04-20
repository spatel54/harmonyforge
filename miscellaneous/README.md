# Miscellaneous

Not part of the main Next.js app — **PDF tooling** and optional local assets.

---

## Layout

```text
miscellaneous/
└── pdfalto/          # Vendored pdfalto source (see pdfalto/README or upstream)
```

---

## pdfalto

Used by the engine when converting PDFs to ALTO/XML on hosts that build the binary. The root **`Makefile`** exposes `make pdfalto` to compile **`miscellaneous/pdfalto/`** (CMake + submodules).

Full PDF/OMR (Poppler, **oemer**, checkpoints) is documented in **[docs/deployment.md](../docs/deployment.md)** and the root **`Dockerfile`**.

---

## See also

| Doc | Purpose |
|-----|---------|
| [../docs/deployment.md](../docs/deployment.md) | Where PDF pipelines run (Vercel vs Docker) |
| [../Makefile](../Makefile) | `pdfalto`, `docker-build`, `preflight-omr` |
