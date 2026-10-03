#!/usr/bin/env bash
#
# Rebuilds the datariot.xyz web export (src/ -> datariot-xyz/) and points
# xyz.html at the new bundle.
#
#   EXPO_PUBLIC_SUPABASE_URL=... EXPO_PUBLIC_SUPABASE_ANON_KEY=... scripts/export-web.sh
#
# Two things here are easy to get wrong, and both fail silently:
#
#  * Supabase is configured through EXPO_PUBLIC_* variables that Metro inlines
#    at build time. A build without them (or one served from Metro's cache,
#    hence --clear) constructs no client and the feed renders empty.
#
#  * `expo export` mirrors the source path of every bundled font and icon, so
#    they all land under assets/node_modules/. Static hosts such as Vercel do
#    not serve a directory called node_modules, so every font and icon request
#    404s: text falls back to a serif face and icons draw as hex-code boxes.
#    The directory is renamed to assets/vendor, and the bundle's references
#    with it.
set -euo pipefail
cd "$(dirname "$0")/.."

: "${EXPO_PUBLIC_SUPABASE_URL:?set EXPO_PUBLIC_SUPABASE_URL}"
: "${EXPO_PUBLIC_SUPABASE_ANON_KEY:?set EXPO_PUBLIC_SUPABASE_ANON_KEY}"

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

npx expo export --platform web --clear --output-dir "$OUT"

BUNDLE="$(ls "$OUT"/_expo/static/js/web/metro-entry-*.js)"
NAME="$(basename "$BUNDLE")"

grep -q "$EXPO_PUBLIC_SUPABASE_URL" "$BUNDLE" \
    || { echo "export-web: the Supabase URL is not in the bundle, refusing to install it" >&2; exit 1; }

mv "$OUT/assets/node_modules" "$OUT/assets/vendor"
sed -i 's#/assets/node_modules/#/assets/vendor/#g' "$BUNDLE"

if grep -q '/assets/node_modules/' "$BUNDLE" "$OUT/index.html"; then
    echo "export-web: references to assets/node_modules are still there" >&2
    exit 1
fi

# Every asset URL the bundle mentions must exist in the export.
MISSING=0
while IFS= read -r url; do
    [ -f "$OUT$url" ] || { echo "export-web: missing $url" >&2; MISSING=1; }
done < <(grep -o '"/assets/vendor/[^"]*"' "$BUNDLE" | tr -d '"' | sort -u)
[ "$MISSING" = 0 ] || exit 1

rm -rf datariot-xyz/_expo datariot-xyz/assets
cp -r "$OUT/_expo" "$OUT/assets" datariot-xyz/
cp "$OUT/index.html" "$OUT/metadata.json" datariot-xyz/
sed -i -E "s#metro-entry-[0-9a-f]+\.js#$NAME#" xyz.html

echo "export-web: installed $NAME ($(du -sh datariot-xyz | cut -f1))"
