#!/bin/bash
# Render every shot in a shot table into <work-dir>/shots/<name>.mp4, one at a time, skipping shots already rendered.
# Needs the site served locally (npm run build && npx astro preview --port 8791; BASE overrides the address).
#   scripts/demo/render.sh scripts/demo/shots/halloween-2026.tsv <work-dir>
# DUR (default 6 s, a little more than assemble.sh uses), W and H (1920x1080) override the shot size.
set -euo pipefail
TABLE=${1:?usage: render.sh <shots.tsv> <work-dir>}; WORK=${2:?usage: render.sh <shots.tsv> <work-dir>}
HERE=$(cd "$(dirname "$0")" && pwd); BASE=${BASE:-http://localhost:8791}
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
mkdir -p "$WORK/mp3" "$WORK/shots"
grep -v -e '^#' -e '^[[:space:]]*$' "$TABLE" | while IFS=$'\t' read -r name cat track file start warm scene; do
  # the CDN answers 403 to some default user agents
  [ -s "$WORK/mp3/$file" ] || curl -fsS -A "$UA" -o "$WORK/mp3/$file" "https://cdn-prod-1.labelgrid.com/labels/section8recs/320/$file"
  [ -s "$WORK/shots/$name.mp4" ] && { echo "$name: already rendered"; continue; }
  node "$HERE/capture.mjs" --base "$BASE" --cat "$cat" --t "$track" --mp3 "$WORK/mp3/$file" --start "$start" --warm "$warm" \
    --scene "$scene" --dur "${DUR:-6}" --w "${W:-1920}" --h "${H:-1080}" --out "$WORK/shots/$name.part.mp4" < /dev/null
  mv "$WORK/shots/$name.part.mp4" "$WORK/shots/$name.mp4"; echo "$name: rendered $(date +%T)"
done
