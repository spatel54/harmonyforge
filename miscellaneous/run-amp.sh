#!/usr/bin/env bash
# Run Amp with PROMPT.md — retries every 5s until success.
# Requires .env with AMP_API_KEY (from https://ampcode.com/install)
set -e
cd "$(dirname "$0")"
source .env 2>/dev/null || true
if [ -z "$AMP_API_KEY" ]; then
  echo "Error: AMP_API_KEY not set. Add it to .env or run: export AMP_API_KEY=\"your-token\""
  exit 1
fi
while ! cat PROMPT.md | npx --yes @sourcegraph/amp; do
  echo "Retrying in 5s..."
  sleep 5
done
