# HarmonyForge — self-hosted single-image deploy
# Node.js + Next.js + pdfalto + Poppler + Python/oemer all in one container.
#
# Build:   make docker-build
# Run:     make docker-run
#
# Layers:
#   1. pdfalto-builder  — C++ toolchain to compile the vendored pdfalto binary
#   2. node-builder     — Next.js production build (Next output + node_modules)
#   3. runner           — slim runtime with pdfalto + Poppler + Python + oemer

# ────────────────────────────────────────────────────────────────────────────
# 1. pdfalto builder
# ────────────────────────────────────────────────────────────────────────────
FROM debian:bookworm-slim AS pdfalto-builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake git ca-certificates \
    libfreetype6-dev libfontconfig1-dev zlib1g-dev libjpeg-dev libpng-dev \
    pkg-config \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY miscellaneous/pdfalto/ ./pdfalto/
RUN cd pdfalto \
 && git submodule update --init --recursive || true \
 && (./install_deps.sh || true) \
 && cmake . \
 && make -j"$(nproc)"

# ────────────────────────────────────────────────────────────────────────────
# 2. Next.js builder
# ────────────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS node-builder
WORKDIR /app

# Copy the patch-package patches before install so postinstall hooks work.
COPY frontend/package.json frontend/package-lock.json ./frontend/
COPY frontend/patches/ ./frontend/patches/
RUN cd frontend && npm ci --no-audit --no-fund

# Copy source after install layer so dep changes do not invalidate build cache.
COPY frontend/ ./frontend/

# Optional build-time env forwarded to the client bundle.
ARG OPENAI_API_KEY
ARG OPENAI_MODEL=gpt-5-nano
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV OPENAI_MODEL=$OPENAI_MODEL

RUN cd frontend && npm run build

# ────────────────────────────────────────────────────────────────────────────
# 3. Runtime
# ────────────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Where oemer caches ONNX checkpoints (backed by a Docker volume in production
# deploys so first-run download happens only once per host).
ENV OEMER_CHECKPOINT_DIR=/var/oemer
ENV PDFALTO_BIN=/app/bin/pdfalto
ENV POPPLER_PDFTOPPM=/usr/bin/pdftoppm
ENV OEMER_BIN=/usr/local/bin/oemer

# Runtime OMR tooling. Keep installs narrow to minimize image size.
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils ca-certificates \
    python3.11 python3.11-venv python3-pip \
    libgomp1 \
 && rm -rf /var/lib/apt/lists/*

# Create a dedicated venv for oemer + onnxruntime (Python 3.10–3.12 is required).
RUN python3.11 -m venv /opt/oemer \
 && /opt/oemer/bin/pip install --no-cache-dir --upgrade pip wheel setuptools \
 && /opt/oemer/bin/pip install --no-cache-dir \
      "onnxruntime==1.17.3" \
      "Pillow>=10.0.0" \
      "numpy<2" \
      "opencv-python-headless>=4.8.0.76" \
 && /opt/oemer/bin/pip install --no-cache-dir --no-deps "oemer==0.1.8" \
 && ln -sf /opt/oemer/bin/oemer /usr/local/bin/oemer

# Copy pdfalto binary from builder stage.
COPY --from=pdfalto-builder /build/pdfalto/pdfalto /app/bin/pdfalto
RUN chmod +x /app/bin/pdfalto

# Copy Next standalone-ish output (we use regular `next start` for simplicity).
COPY --from=node-builder /app/frontend/.next        ./frontend/.next
COPY --from=node-builder /app/frontend/public       ./frontend/public
COPY --from=node-builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=node-builder /app/frontend/package.json ./frontend/package.json
COPY --from=node-builder /app/frontend/next.config.ts ./frontend/next.config.ts

# Preflight helper runs at container start to warm the oemer checkpoint dir.
COPY frontend/scripts/preflight-omr.sh /usr/local/bin/preflight-omr
RUN chmod +x /usr/local/bin/preflight-omr

RUN mkdir -p /var/oemer && chown -R node:node /var/oemer /app

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

# preflight-omr is best-effort (first run caches checkpoints); Next.js then takes over.
CMD ["sh", "-c", "/usr/local/bin/preflight-omr || true; cd frontend && npx next start -p 3000"]
