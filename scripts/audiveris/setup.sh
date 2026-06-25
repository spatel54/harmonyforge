#!/usr/bin/env bash
# First-run setup: Java check, Audiveris clone/build, Tesseract language data.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=paths.sh
source "$SCRIPT_DIR/paths.sh"

check_java() {
  if ! command -v java >/dev/null 2>&1; then
    echo "Java is not installed or not on PATH."
    echo "Install JDK $MIN_JAVA_VERSION+ (e.g. brew install openjdk@25) and try again."
    exit 1
  fi

  local version_line major
  version_line="$(java -version 2>&1 | head -n 1)"
  major="$(echo "$version_line" | sed -E 's/.*version "([0-9]+).*/\1/')"

  if [[ -z "$major" || "$major" -lt "$MIN_JAVA_VERSION" ]]; then
    echo "Java $MIN_JAVA_VERSION+ is required. Found:"
    echo "  $version_line"
    exit 1
  fi

  echo "Java OK: $version_line"
}

migrate_legacy_build() {
  local legacy="$REPO_ROOT/approach_source_audiveris/scripts/audiveris"
  if [[ -x "$AUDIVERIS_BIN" || ! -d "$legacy" ]]; then
    return 0
  fi
  echo "Migrating Audiveris build from legacy approach_source_audiveris/..."
  mkdir -p "$(dirname "$AUDIVERIS_DIR")"
  mv "$legacy" "$AUDIVERIS_DIR"

  local legacy_tess="$REPO_ROOT/approach_source_audiveris/scripts/tessdata"
  if [[ -d "$legacy_tess" && ! -f "$TESSDATA_DIR/eng.traineddata" ]]; then
    mkdir -p "$TESSDATA_DIR"
    cp -f "$legacy_tess/"*.traineddata "$TESSDATA_DIR/" 2>/dev/null || true
  fi
}

clone_audiveris() {
  if [[ -d "$AUDIVERIS_DIR/.git" ]]; then
    return 0
  fi

  if [[ ! -d "$AUDIVERIS_DIR" ]]; then
    echo "Cloning Audiveris source..."
    git clone --depth 1 --branch "$AUDIVERIS_BRANCH" "$AUDIVERIS_REPO" "$AUDIVERIS_DIR"
    return 0
  fi

  echo "Audiveris folder exists but is not a git clone:"
  echo "  $AUDIVERIS_DIR"
  echo "Remove it and run setup again."
  exit 1
}

build_audiveris() {
  migrate_legacy_build
  clone_audiveris

  if [[ -x "$AUDIVERIS_BIN" ]]; then
    echo "Audiveris already built."
    return 0
  fi

  echo "Building Audiveris (first run may take several minutes)..."
  (
    cd "$AUDIVERIS_DIR"
    ./gradlew installDist
  )

  if [[ ! -x "$AUDIVERIS_BIN" ]]; then
    echo "Build finished but binary not found at:"
    echo "  $AUDIVERIS_BIN"
    exit 1
  fi

  echo "Audiveris built successfully."
}

install_tessdata() {
  mkdir -p "$TESSDATA_DIR"

  local lang_file="$TESSDATA_DIR/eng.traineddata"
  if [[ -f "$lang_file" ]]; then
    echo "Tesseract English data already present."
    return 0
  fi

  echo "Downloading Tesseract eng.traineddata..."
  local url="https://github.com/tesseract-ocr/tessdata/raw/${TESSDATA_TAG}/eng.traineddata"

  if command -v curl >/dev/null 2>&1; then
    curl -fsSL -o "$lang_file" "$url"
  elif command -v wget >/dev/null 2>&1; then
    wget -q -O "$lang_file" "$url"
  else
    echo "Need curl or wget to download tessdata."
    exit 1
  fi

  echo "Tesseract data installed at $TESSDATA_DIR"
}

mkdir -p "$INPUT_DIR" "$OUTPUT_DIR" "$WORK_DIR"

check_java
build_audiveris
install_tessdata

echo "Setup complete."
echo "  Binary:  $AUDIVERIS_BIN"
echo "  Tessdata: $TESSDATA_DIR"
echo "  QA input: $INPUT_DIR"
