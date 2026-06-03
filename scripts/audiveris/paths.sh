#!/usr/bin/env bash
# Shared paths for Audiveris OMR setup and manual QA conversion.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

INPUT_DIR="$SCRIPT_DIR/input"
OUTPUT_DIR="$SCRIPT_DIR/output"
WORK_DIR="$SCRIPT_DIR/.work"
AUDIVERIS_DIR="$SCRIPT_DIR/vendor/audiveris"
AUDIVERIS_BIN="$AUDIVERIS_DIR/app/build/install/app/bin/Audiveris"
TESSDATA_DIR="$SCRIPT_DIR/tessdata"
TESSDATA_TAG="4.1.0"
AUDIVERIS_REPO="https://github.com/Audiveris/audiveris.git"
AUDIVERIS_BRANCH="development"
MIN_JAVA_VERSION=25

# Homebrew openjdk@25 is keg-only; shell sessions from the IDE often lack it on PATH.
if [[ -z "${JAVA_HOME:-}" ]]; then
  if [[ -x "/opt/homebrew/opt/openjdk@25/bin/java" ]]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk@25/libexec/openjdk.jdk/Contents/Home"
  elif [[ -x "/usr/local/opt/openjdk@25/bin/java" ]]; then
    export JAVA_HOME="/usr/local/opt/openjdk@25/libexec/openjdk.jdk/Contents/Home"
  elif [[ "$(uname -s)" == "Darwin" ]] && /usr/libexec/java_home -v 25 >/dev/null 2>&1; then
    export JAVA_HOME="$(/usr/libexec/java_home -v 25)"
  fi
fi

if [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/java" ]]; then
  export PATH="$JAVA_HOME/bin:$PATH"
fi

export TESSDATA_PREFIX="$TESSDATA_DIR"

require_audiveris_bin() {
  if [[ ! -x "$AUDIVERIS_BIN" ]]; then
    echo "Audiveris binary not found at:"
    echo "  $AUDIVERIS_BIN"
    echo "Run setup first: make audiveris-setup"
    exit 1
  fi
}
