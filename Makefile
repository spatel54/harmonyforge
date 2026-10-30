# HarmonyForge Makefile
# Single-process Next.js app (engine runs inside Next route handlers under src/server/engine/).

.PHONY: install dev dev-clean test test-engine lint lint-frontend verify verify-strict build e2e \
        audiveris-setup audiveris-convert docker-build docker-run \
        fly-launch fly-deploy fly-secrets fly-logs fly-health \
        omr-build omr-run omr-deploy omr-health omr-secret

# Install Node dependencies. For PDF → MusicXML locally, also run `make audiveris-setup`.
install:
	@cd frontend && npm install
	@echo "Install complete. For PDF intake run: make audiveris-setup"

# First-run Audiveris: Java 25+, clone/build Audiveris, download Tesseract eng data.
audiveris-setup:
	@bash scripts/audiveris/setup.sh

# Manual QA: convert PDFs in scripts/audiveris/input/ to MusicXML in output/.
audiveris-convert:
	@bash scripts/audiveris/convert.sh

# Kill listeners on 3000/3001 and remove Next dev lock. Run before `make dev` if you see EADDRINUSE.
dev-clean:
	@for port in 3000 3001; do \
		pids=$$(lsof -nP -iTCP:$$port -sTCP:LISTEN -t 2>/dev/null || true); \
		if [ -n "$$pids" ]; then echo "Killing PID(s) on port $$port: $$pids"; kill -9 $$pids 2>/dev/null || true; fi; \
	done
	@rm -f frontend/.next/dev/lock 2>/dev/null || true
	@echo "Ports 3000, 3001 cleared (and Next dev lock removed if present)."

# Start Next.js dev server (single process; engine runs inside /api/* routes).
# Sources Audiveris paths when built so PDF OMR works without manual env exports.
dev:
	@bash -c 'set -euo pipefail; \
		source scripts/audiveris/paths.sh 2>/dev/null || true; \
		cd frontend && npm run dev'

dev-frontend: dev

test:
	@cd frontend && npm test

e2e:
	@cd frontend && npm run test:e2e

test-engine:
	@mkdir -p frontend/engine-cli-output
	@cd frontend && npm run test-engine

lint:
	@cd frontend && npm run lint

lint-frontend: lint

verify: test lint build

verify-strict: verify

build:
	@cd frontend && npm run build

# Self-hosted image bundling Next.js + Audiveris OMR.
docker-build:
	@docker build -f Dockerfile -t harmonyforge:latest .

docker-run:
	@docker run --rm -it -p 3000:3000 \
		-e OPENAI_API_KEY="$$OPENAI_API_KEY" \
		-e OPENAI_MODEL="$${OPENAI_MODEL:-gpt-4o-mini}" \
		harmonyforge:latest

# ── OMR sidecar on Cloud Run (ADR 004) — free-tier PDF → MusicXML ──────────────
# Vercel cannot run Audiveris (no JVM, 300s function cap). Cloud Run allows
# 60-minute requests, scales to zero, and covers this workload on the always-free
# tier. Requires: gcloud CLI + a GCP project with billing enabled.

GCP_PROJECT ?= $(shell gcloud config get-value project 2>/dev/null)
GCP_REGION  ?= us-central1
OMR_SERVICE ?= harmonyforge-omr
# Browser origins allowed to call /convert. Exact matches plus `*` globs, where
# `*` never crosses a dot (see isOriginAllowed in services/omr/server.mjs).
# Vercel preview hostnames are FLAT (harmonyforge-<hash>-<team>.vercel.app), so
# they need a within-label glob, not a `*.` subdomain wildcard.
OMR_ORIGINS ?= https://harmonyforge.vercel.app,https://harmonyforge-sjp10-9620s-projects.vercel.app,https://harmonyforge-*-sjp10-9620s-projects.vercel.app,http://localhost:3000,http://localhost:3001

# Generate a shared secret once, then set it on BOTH Cloud Run and Vercel.
omr-secret:
	@node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64url"))'

omr-build:
	@docker build -f services/omr/Dockerfile -t $(OMR_SERVICE):latest services/omr

# Local sidecar for development (needs AUDIVERIS_BIN + JAVA_HOME on the host).
omr-run:
	@test -n "$$OMR_SHARED_SECRET" || { echo "Set OMR_SHARED_SECRET first (make omr-secret)."; exit 1; }
	@cd services/omr && \
		OMR_ALLOWED_ORIGINS="http://localhost:3000" \
		AUDIVERIS_BIN="$$(pwd)/../../scripts/audiveris/vendor/audiveris/app/build/install/app/bin/Audiveris" \
		PORT=8080 node server.mjs

# Build + deploy from source. Cloud Run builds the Dockerfile for you.
#   --timeout=3600       : 60 min, clears the 15-min Audiveris budget
#   --memory=2Gi         : a JVM doing OMR will OOM below this
#   --max-instances=2    : bounds how much free tier a burst can consume
#   --cpu-boost          : Cloud Run throttles CPU outside requests; without
#                          this the startup `java -version` probe times out and
#                          the service logs a false "java unavailable"
#   --no-allow-unauthenticated is NOT used: the browser calls this directly and
#   authorizes with our own HMAC grant (ADR 004), not with Google IAM.
omr-deploy:
	@test -n "$(GCP_PROJECT)" || { echo "No GCP project set. Run: gcloud config set project <id>"; exit 1; }
	@test -n "$$OMR_SHARED_SECRET" || { echo "Set OMR_SHARED_SECRET first (make omr-secret)."; exit 1; }
	@gcloud run deploy $(OMR_SERVICE) \
		--source services/omr \
		--project $(GCP_PROJECT) \
		--region $(GCP_REGION) \
		--allow-unauthenticated \
		--timeout=3600 \
		--memory=2Gi \
		--cpu=2 \
		--cpu-boost \
		--concurrency=1 \
		--min-instances=0 \
		--max-instances=2 \
		--set-env-vars "^|^OMR_ALLOWED_ORIGINS=$(OMR_ORIGINS)|HF_AUDIVERIS_MAX_MS=900000|OMR_SHARED_SECRET=$$OMR_SHARED_SECRET"

# Confirm the deployed sidecar reports Audiveris + Java ready.
omr-health:
	@url=$$(gcloud run services describe $(OMR_SERVICE) --project $(GCP_PROJECT) \
		--region $(GCP_REGION) --format='value(status.url)' 2>/dev/null); \
	test -n "$$url" || { echo "Service not found. Run: make omr-deploy"; exit 1; }; \
	echo "GET $$url/health"; \
	curl -fsS "$$url/health" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(JSON.stringify(j,null,2));process.exit(j.ready?0:1)})'

# ── Fly.io: alternative single-artifact host (lane A, ~$2-25/mo) ────────────────
# Audiveris needs a JVM and minutes of CPU, which serverless cannot provide.
# Builds run on Fly's remote builder, so a local Docker daemon is not required.

# One-time: create the app from the committed fly.toml without deploying yet.
fly-launch:
	@fly launch --no-deploy --copy-config --name harmonyforge --region iad

# Set runtime secrets (never baked into the image). Reads your shell env.
fly-secrets:
	@test -n "$$OPENAI_API_KEY" || { echo "OPENAI_API_KEY is not set in your shell."; exit 1; }
	@fly secrets set OPENAI_API_KEY="$$OPENAI_API_KEY" OPENAI_MODEL="$${OPENAI_MODEL:-gpt-5-nano}"

# Build + release. First build compiles Audiveris from source (several minutes).
fly-deploy:
	@fly deploy --remote-only

fly-logs:
	@fly logs

# Confirm OMR really is live on the deployed host. Override host with:
#   make fly-health FLY_HOST=my-app.fly.dev
FLY_HOST ?= harmonyforge.fly.dev
fly-health:
	@echo "GET https://$(FLY_HOST)/api/health"
	@curl -fsS "https://$(FLY_HOST)/api/health" \
		| node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const o=(JSON.parse(s)||{}).omr||{};console.log(JSON.stringify(o,null,2));if(!o.ready){console.error("omr.ready is false — PDF intake will 501.");process.exit(1)}console.log("OMR ready.")})'
