# HarmonyForge MVP Makefile — The Commander
# Use these commands for cross-language tests and evaluation.
# See .cursor/rules/architecture.mdc: AI should rely on Makefile to trigger tests.

.PHONY: install dev dev-clean dev-backend dev-frontend test lint lint-frontend verify build test-engine pdfalto

# Install dependencies (update when package.json / requirements.txt exist)
install:
	@if [ -f backend/package.json ]; then cd backend && npm install; fi
	@if [ -f frontend/package.json ]; then cd frontend && npm install; fi
	@if [ -f backend/requirements.txt ]; then \
		python3 -m pip install -r backend/requirements.txt && \
		python3 -m pip install "oemer==0.1.8" --no-deps; \
	fi
	@echo "Install complete."

# Build vendored pdfalto binary at miscellaneous/pdfalto/pdfalto (C++/cmake). Fetches the xpdf submodule first.
# If linking fails, see miscellaneous/pdfalto/Readme.md (e.g. ./install_deps.sh for bundled libs).
pdfalto:
	@test -f miscellaneous/pdfalto/CMakeLists.txt || (echo "miscellaneous/pdfalto/CMakeLists.txt missing" && exit 1)
	cd miscellaneous/pdfalto && git submodule update --init --recursive
	cd miscellaneous/pdfalto && cmake . && $(MAKE)

# Kill listeners on 8000 (engine), 3000/3001 (Next). Run before `make dev` if you see EADDRINUSE or Next lock errors.
# Removes stale frontend/.next/dev/lock after killing Next (safe if no dev server remains).
dev-clean:
	@for port in 8000 3000 3001; do \
		pids=$$(lsof -nP -iTCP:$$port -sTCP:LISTEN -t 2>/dev/null || true); \
		if [ -n "$$pids" ]; then echo "Killing PID(s) on port $$port: $$pids"; kill -9 $$pids 2>/dev/null || true; fi; \
	done
	@rm -f frontend/.next/dev/lock 2>/dev/null || true
	@echo "Ports 8000, 3000, 3001 cleared (and Next dev lock removed if present)."

# Full stack (frontend + backend)
dev:
	@trap 'kill 0' EXIT; cd backend && npm run dev:backend & cd frontend && npm run dev

# Backend only
dev-backend:
	@if [ -f backend/package.json ]; then cd backend && npm run dev:backend; else echo "No backend/package.json."; fi

# Frontend only (Next.js in frontend/)
dev-frontend:
	@cd frontend && npm run dev

# Run tests + lint (pre-flight before manual flow test)
verify: test lint build

# Run tests
test:
	@if [ -f backend/package.json ] && grep -q '"test"' backend/package.json; then cd backend && npm test; \
	elif [ -d backend/engine ] && command -v pytest >/dev/null 2>&1; then python -m pytest backend/engine/ -v -x; \
	else echo "No test target. Add npm test script or backend/engine/ with pytest."; fi

# Run linters
lint:
	@if [ -f backend/package.json ] && grep -q '"lint"' backend/package.json; then cd backend && npm run lint; \
	else echo "No lint target. Add npm run lint script."; fi

# Frontend lint (currently optional because the redesign app has unrelated legacy lint debt)
lint-frontend:
	@cd frontend && npm run lint

# Build backend + frontend
build:
	@if [ -f backend/package.json ]; then cd backend && npm run build:engine && cd ../frontend && npm run build; \
	else echo "No build script. Add npm run build:engine and frontend build scripts."; fi

# Test algorithmic engine: input MusicXML → output with melody + harmonies (flute, cello, major)
test-engine:
	@mkdir -p backend/input backend/output
	@cp -f frontend/public/samples/月亮代表我的心.xml backend/input/ 2>/dev/null || true
	@cd backend && npx tsx scripts/run-engine-cli.ts
