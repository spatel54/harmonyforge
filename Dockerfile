# HarmonyForge — self-hosted single-image deploy
# Node.js + Next.js + Audiveris OMR in one container.
#
# Build:   make docker-build
# Run:     make docker-run
#
# Layers:
#   1. audiveris-builder — Java 25 + Gradle build of Audiveris + Tesseract data
#   2. node-builder      — Next.js production build
#   3. runner            — Node runtime + Audiveris CLI + JRE

# ────────────────────────────────────────────────────────────────────────────
# 1. Audiveris builder
# ────────────────────────────────────────────────────────────────────────────
FROM eclipse-temurin:25-jdk-jammy AS audiveris-builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /build
RUN git clone --depth 1 --branch 5.9.0 https://github.com/Audiveris/audiveris.git
WORKDIR /build/audiveris
RUN ./gradlew installDist --no-daemon -x test

RUN mkdir -p /build/tessdata \
 && curl -fsSL -o /build/tessdata/eng.traineddata \
    https://github.com/tesseract-ocr/tessdata/raw/4.1.0/eng.traineddata

# ────────────────────────────────────────────────────────────────────────────
# 2. Next.js builder
# ────────────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS node-builder
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./frontend/
COPY frontend/patches/ ./frontend/patches/
RUN cd frontend && npm ci --no-audit --no-fund

COPY frontend/ ./frontend/

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
ENV AUDIVERIS_BIN=/app/audiveris/bin/Audiveris
ENV TESSDATA_PREFIX=/app/tessdata
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="/opt/java/openjdk/bin:${PATH}"

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY --from=audiveris-builder /opt/java/openjdk /opt/java/openjdk
COPY --from=audiveris-builder /build/audiveris/app/build/install/app /app/audiveris
COPY --from=audiveris-builder /build/tessdata /app/tessdata
RUN chmod +x /app/audiveris/bin/Audiveris

COPY --from=node-builder /app/frontend/.next        ./frontend/.next
COPY --from=node-builder /app/frontend/public       ./frontend/public
COPY --from=node-builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=node-builder /app/frontend/package.json ./frontend/package.json
COPY --from=node-builder /app/frontend/next.config.ts ./frontend/next.config.ts

RUN chown -R node:node /app

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["sh", "-c", "cd frontend && npx next start -p 3000"]
