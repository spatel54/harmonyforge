#!/usr/bin/env bash
# Downloads Salamander piano samples in the filenames expected by riffscore's Tone.Sampler.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/audio/piano"
BASE="https://tonejs.github.io/audio/salamander"
mkdir -p "$OUT"
FILES=(
  A0.mp3 C1.mp3 Ds1.mp3 Fs1.mp3 A1.mp3 C2.mp3 Ds2.mp3 Fs2.mp3 A2.mp3
  C3.mp3 Ds3.mp3 Fs3.mp3 A3.mp3 C4.mp3 Ds4.mp3 Fs4.mp3 A4.mp3 C5.mp3
  Ds5.mp3 Fs5.mp3 A5.mp3 C6.mp3 Ds6.mp3 Fs6.mp3 A6.mp3 C7.mp3 Ds7.mp3
  Fs7.mp3 A7.mp3 C8.mp3
)
for f in "${FILES[@]}"; do
  echo "Fetching $f"
  curl -fsSL "$BASE/$f" -o "$OUT/$f"
done
echo "Done. Files in $OUT"
