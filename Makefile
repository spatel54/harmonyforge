# HarmonyForge Makefile
# Single-process Next.js app (engine runs inside Next route handlers under src/server/engine/).

.PHONY: install dev dev-clean test test-engine lint lint-frontend verify verify-strict build \
        pdfalto docker-build docker-run preflight-omr

# Install Node + Python deps. Python is only needed for local PDF/OMR via oemer.
install:
	@cd frontend && npm install
	@if [ -f requirements.txt ]; then \
		python3 -m pip install -r requirements.txt && \
		python3 -m pip install "oemer==0.1.8" --no-deps; \
	fi
	@echo "Install complete."

# Build the vendored pdfalto binary. Runs submodule init once; links with system xpdf/poppler.
pdfalto:
	@test -f miscellaneous/pdfalto/CMakeLists.txt || (echo "miscellaneous/pdfalto/CMakeLists.txt missing" && exit 1)
	cd miscellaneous/pdfalto && git submodule update --init --recursive
	cd miscellaneous/pdfalto && cmake . && $(MAKE)

# Cache oemer ONNX checkpoints into a writable dir so first-use PDF OMR doesn’t spend
# minutes downloading over HTTPS. Respects OEMER_CHECKPOINT_DIR when set.
preflight-omr:
	@bash frontend/scripts/preflight-omr.sh

# Kill listeners on 3000/3001 and remove Next dev lock. Run before `make dev` if you see EADDRINUSE.
dev-clean:
	@for port in 3000 3001; do \
		pids=$$(lsof -nP -iTCP:$$port -sTCP:LISTEN -t 2>/dev/null || true); \
		if [ -n "$$pids" ]; then echo "Killing PID(s) on port $$port: $$pids"; kill -9 $$pids 2>/dev/null || true; fi; \
	done
	@rm -f frontend/.next/dev/lock 2>/dev/null || true
	@echo "Ports 3000, 3001 cleared (and Next dev lock removed if present)."

# Start Next.js dev server (single process; engine runs inside /api/* routes).
dev:
	@cd frontend && npm run dev

# Frontend-only alias kept for documentation consistency.
dev-frontend: dev

# Run tests: frontend Vitest covers both the UI and the engine (src/server/engine/**/*.test.ts).
test:
	@cd frontend && npm test

# Backwards-compat alias: the engine CLI smoke test from docs/plan.md.
test-engine:
	@mkdir -p frontend/engine-cli-output
	@cd frontend && npm run test-engine

# Lint (ESLint) the whole Next app (includes engine under src/server/engine).
lint:
	@cd frontend && npm run lint

# Alias preserved from the split-repo era.
lint-frontend: lint

# Full local gate: tests + lint + build.
verify: test lint build

# Stricter: everything above, zero warnings expected.
verify-strict: verify

# Next production build (also type-checks engine code under src/server/engine).
build:
	@cd frontend && npm run build

# Build the self-hosted image bundling Next + pdfalto + Poppler + Python/oemer.
docker-build:
	@docker build -f Dockerfile -t harmonyforge:latest .

docker-run:
	@docker run --rm -it -p 3000:3000 \
		-e OPENAI_API_KEY="$$OPENAI_API_KEY" \
		-e OPENAI_MODEL="$${OPENAI_MODEL:-gpt-4o-mini}" \
		-v harmonyforge-oemer:/var/oemer \
		harmonyforge:latest
