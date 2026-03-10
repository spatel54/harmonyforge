# HarmonyForge MVP Makefile — The Commander
# Use these commands for cross-language tests and evaluation.
# See .cursor/rules/architecture.mdc: AI should rely on Makefile to trigger tests.

.PHONY: install dev dev-clean dev-backend dev-frontend test lint lint-frontend verify build test-engine

# Install dependencies (update when package.json / requirements.txt exist)
install:
	@if [ -f package.json ]; then npm install; fi
	@if [ -f harmony-forge-redesign/package.json ]; then cd harmony-forge-redesign && npm install; fi
	@if [ -f requirements.txt ]; then python3 -m pip install -r requirements.txt; fi
	@echo "Install complete."

# Kill processes on ports 8000, 3000, 3001 (run before dev if "Address already in use")
dev-clean:
	@lsof -ti:8000 -ti:3000 -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
	@echo "Ports 8000, 3000, 3001 cleared."

# Full stack (frontend + backend)
dev:
	@trap 'kill 0' EXIT; npm run dev:backend & cd harmony-forge-redesign && npm run dev

# Backend only
dev-backend:
	@if [ -f package.json ]; then npm run dev:backend; else echo "No package.json."; fi

# Frontend only (Next.js in harmony-forge-redesign)
dev-frontend:
	@cd harmony-forge-redesign && npm run dev

# Run tests + lint (pre-flight before manual flow test)
verify: test lint build

# Run tests
test:
	@if [ -f package.json ] && grep -q '"test"' package.json; then npm test; \
	elif [ -d engine ] && command -v pytest >/dev/null 2>&1; then python -m pytest engine/ -v -x; \
	else echo "No test target. Add npm test script or engine/ with pytest."; fi

# Run linters
lint:
	@if [ -f package.json ] && grep -q '"lint"' package.json; then npm run lint; \
	else echo "No lint target. Add npm run lint script."; fi

# Frontend lint (currently optional because the redesign app has unrelated legacy lint debt)
lint-frontend:
	@cd harmony-forge-redesign && npm run lint

# Build backend + frontend
build:
	@if [ -f package.json ]; then npm run build:engine && cd harmony-forge-redesign && npm run build; \
	else echo "No build script. Add npm run build:engine and frontend build scripts."; fi

# Test algorithmic engine: input MusicXML → output with melody + harmonies (flute, cello, major)
test-engine:
	@mkdir -p input output
	@cp -f 月亮代表我的心.xml input/ 2>/dev/null || true
	@npx tsx scripts/run-engine-cli.ts
