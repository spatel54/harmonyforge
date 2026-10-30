# HarmonyForge OMR sidecar — Audiveris 5.9.0 behind a small HTTP API.
#
# Exists because PDF → MusicXML cannot run on Vercel: no JVM in the function
# runtime, and a 300s function cap against a multi-minute batch. Cloud Run
# allows 60-minute requests and scales to zero, so OMR lives here instead.
#
# Build:  make omr-build
# Deploy: make omr-deploy
#
# Stages:
#   1. audiveris-builder — JDK 25 + Gradle build of Audiveris + Tesseract data
#   2. runner            — Node 22 + Audiveris CLI + JRE

# ────────────────────────────────────────────────────────────────────────────
# 1. Audiveris builder (mirrors the root Dockerfile so versions cannot drift)
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
# 2. Runtime
# ────────────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV AUDIVERIS_BIN=/app/audiveris/bin/Audiveris
ENV TESSDATA_PREFIX=/app/tessdata
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="/opt/java/openjdk/bin:${PATH}"

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fontconfig \
 && rm -rf /var/lib/apt/lists/*

COPY --from=audiveris-builder /opt/java/openjdk /opt/java/openjdk
COPY --from=audiveris-builder /build/audiveris/app/build/install/app /app/audiveris
COPY --from=audiveris-builder /build/tessdata /app/tessdata
RUN chmod +x /app/audiveris/bin/Audiveris

# No dependencies by design — the server uses only the Node standard library,
# so there is no npm install step and nothing to keep patched.
COPY server.mjs package.json ./

RUN chown -R node:node /app
USER node

EXPOSE 8080
CMD ["node", "server.mjs"]
