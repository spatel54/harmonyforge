#!/usr/bin/env bash
# Convert all PDFs in scripts/audiveris/input/ to MusicXML in output/.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=paths.sh
source "$SCRIPT_DIR/paths.sh"

mkdir -p "$INPUT_DIR" "$OUTPUT_DIR" "$WORK_DIR"

shopt -s nullglob nocaseglob
pdfs=("$INPUT_DIR"/*.pdf)
shopt -u nocaseglob

if [[ ${#pdfs[@]} -eq 0 ]]; then
  echo "No PDF files found in input/"
  echo "Drop one or more .pdf files into:"
  echo "  $INPUT_DIR"
  exit 0
fi

require_audiveris_bin

write_musicxml() {
  local src="$1" dest="$2"
  sed '/^<!DOCTYPE /d' "$src" > "$dest"
}

collect_score_files() {
  local dir="$1" ext="$2"
  find "$dir" -maxdepth 1 -type f -iname "*.${ext}" ! -name '*.omr.xml' 2>/dev/null | sort
}

copy_score_outputs() {
  local base="$1" book_work="$2"
  local wrote=0 index dest

  xml_files=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && xml_files+=("$line")
  done < <(collect_score_files "$book_work" xml)

  mxl_files=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && mxl_files+=("$line")
  done < <(collect_score_files "$book_work" mxl)

  if [[ ${#xml_files[@]} -eq 0 && ${#mxl_files[@]} -eq 0 ]]; then
    return 1
  fi

  if [[ ${#xml_files[@]} -eq 1 ]]; then
    local dest="$OUTPUT_DIR/${base}.xml"
    write_musicxml "${xml_files[0]}" "$dest"
    output_files+=("$dest")
    echo "Wrote: $dest"
    wrote=1
  elif [[ ${#xml_files[@]} -gt 1 ]]; then
    local index=1
    for xml in "${xml_files[@]}"; do
      local dest="$OUTPUT_DIR/${base}-${index}.xml"
      write_musicxml "$xml" "$dest"
      output_files+=("$dest")
      echo "Wrote: $dest"
      index=$((index + 1))
      wrote=1
    done
  fi

  if [[ ${#mxl_files[@]} -eq 1 ]]; then
    local dest="$OUTPUT_DIR/${base}.mxl"
    cp -f "${mxl_files[0]}" "$dest"
    output_files+=("$dest")
    echo "Wrote: $dest"
    wrote=1
  elif [[ ${#mxl_files[@]} -gt 1 ]]; then
    local index=1
    for mxl in "${mxl_files[@]}"; do
      local dest="$OUTPUT_DIR/${base}-${index}.mxl"
      cp -f "$mxl" "$dest"
      output_files+=("$dest")
      echo "Wrote: $dest"
      index=$((index + 1))
      wrote=1
    done
  fi

  [[ "$wrote" -eq 1 ]]
}

converted=0
failed=0
declare -a output_files=()

for pdf in "${pdfs[@]}"; do
  base="$(basename "$pdf" .pdf)"
  base="$(basename "$base" .PDF)"
  book_work="$WORK_DIR/$base"
  omr_file="$book_work/${base}.omr"

  echo ""
  echo "Converting: $(basename "$pdf")"

  mkdir -p "$book_work"
  rm -f "$book_work"/*.xml "$book_work"/*.mxl 2>/dev/null || true

  set +e
  "$AUDIVERIS_BIN" \
    -batch \
    -export \
    -save \
    -output "$book_work" \
    -constant org.audiveris.omr.sheet.BookManager.useCompression=false \
    "$pdf"
  status=$?
  set -e

  if [[ $status -ne 0 ]]; then
    echo "FAILED: $(basename "$pdf") (exit $status)"
    failed=$((failed + 1))
    continue
  fi

  if [[ ! -f "$omr_file" ]]; then
    echo "FAILED: $(basename "$pdf") — no .omr produced"
    failed=$((failed + 1))
    continue
  fi

  set +e
  "$AUDIVERIS_BIN" \
    -batch \
    -export \
    -output "$book_work" \
    -constant org.audiveris.omr.sheet.BookManager.useCompression=true \
    "$omr_file"
  status=$?
  set -e

  if [[ $status -ne 0 ]]; then
    echo "FAILED: $(basename "$pdf") — could not export .mxl (exit $status)"
    failed=$((failed + 1))
    continue
  fi

  if ! copy_score_outputs "$base" "$book_work"; then
    echo "FAILED: $(basename "$pdf") — no MusicXML produced"
    failed=$((failed + 1))
    continue
  fi

  converted=$((converted + 1))
done

echo ""
echo "Done. Converted: $converted, failed: $failed"
if [[ ${#output_files[@]} -gt 0 ]]; then
  echo "Output files:"
  for f in "${output_files[@]}"; do
    echo "  $f"
  done
fi

if [[ $failed -gt 0 ]]; then
  exit 1
fi
