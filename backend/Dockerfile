# ── Stage 1: Build TypeScript engine ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Copy engine source and root tsconfig (build:engine references engine/tsconfig.json)
COPY engine/   ./engine/
COPY tsconfig.json ./

# Compiles engine/ → engine/dist/ (NodeNext ESM, per engine/tsconfig.json)
RUN npm run build:engine

# ── Stage 2: Production runtime ─────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies in the runner stage
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled engine output from builder
COPY --from=builder /app/engine/dist ./engine/dist

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# engine/dist/server.js is ESM; package.json "type":"module" ensures Node treats it as such
CMD ["node", "engine/dist/server.js"]
