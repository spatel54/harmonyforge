#!/usr/bin/env bash
#
# HarmonyForge OMR preflight
#
# Ensures oemer's ONNX checkpoints exist in OEMER_CHECKPOINT_DIR before the
# first user upload. Without this, cold-start PDF → MusicXML can spend minutes
# downloading ~60MB of ONNX weights, often timing out the request.
#
# Safe to run repeatedly — it is a no-op once checkpoints are cached.

set -euo pipefail

DIR="${OEMER_CHECKPOINT_DIR:-/var/oemer}"
OEMER_BIN="${OEMER_BIN:-oemer}"

if ! command -v "$OEMER_BIN" >/dev/null 2>&1; then
  echo "[preflight-omr] oemer binary not found (OEMER_BIN=$OEMER_BIN); skipping." >&2
  exit 0
fi

mkdir -p "$DIR"

# oemer downloads checkpoints lazily on first CLI invocation. A trivial
# `--help` call triggers `__init__` without doing OMR work.
if [ ! -f "$DIR/.hf-preflight.ok" ]; then
  echo "[preflight-omr] Caching oemer checkpoints into $DIR (first run can take a few minutes)..."
  export OEMER_CHECKPOINT_DIR="$DIR"
  if "$OEMER_BIN" --help >/dev/null 2>&1; then
    touch "$DIR/.hf-preflight.ok"
    echo "[preflight-omr] oemer is ready."
  else
    echo "[preflight-omr] oemer --help failed; checkpoints may download lazily on first upload." >&2
  fi
else
  echo "[preflight-omr] oemer checkpoints already present in $DIR."
fi
