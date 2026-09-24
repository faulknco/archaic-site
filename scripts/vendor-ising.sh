#!/usr/bin/env bash
# Copies the wasm-bindgen build of ising-rs into public/forge/spin.
# Usage: scripts/vendor-ising.sh [path-to-ising-rs]   (default ../ising-rs)
set -euo pipefail
SRC="${1:-$(dirname "$0")/../../ising-rs}"
DST="$(dirname "$0")/../public/forge/spin"
test -f "$SRC/docs/pkg/ising_bg.wasm" || { echo "no wasm build at $SRC/docs/pkg" >&2; exit 1; }
mkdir -p "$DST"
cp "$SRC/docs/pkg/ising.js" "$SRC/docs/pkg/ising_bg.wasm" "$DST/"
printf 'ising-rs %s\ncopied %s\n' "$(git -C "$SRC" rev-parse HEAD)" "$(date -u +%F)" > "$DST/VERSION"
echo "vendored $(head -1 "$DST/VERSION")"
