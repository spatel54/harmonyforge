# HarmonyForge Makefile
# Single-process Next.js app (engine runs inside Next route handlers under src/server/engine/).

.PHONY: install dev dev-clean test test-engine lint lint-frontend verify verify-strict build e2e \
        audiveris-setup audiveris-convert docker-build docker-run

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
