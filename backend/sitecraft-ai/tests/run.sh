#!/bin/bash
# Runs the BotCraft end-to-end checks against the real Worker code with a local database (no keys, no deploy).
#   bash backend/sitecraft-ai/tests/run.sh
# Needs Node 20+ and wrangler (npx downloads it). Set WRANGLER=/path/to/wrangler to use an installed one.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
WRANGLER="${WRANGLER:-npx --yes wrangler}"
WORK="$(mktemp -d)"
cleanup() { kill "$WEB" "$DEV" 2>/dev/null || true; rm -rf "$WORK"; }
trap cleanup EXIT

# The page code the hosted pages are served from (HOSTING_SOURCE_BASE) and the origin the tests call from.
(cd "$ROOT" && python3 -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1) & WEB=$!
(cd "$HERE" && $WRANGLER dev --config wrangler.test.toml --local --persist-to "$WORK/state" --port 8787 --ip 127.0.0.1 >"$WORK/dev.log" 2>&1) & DEV=$!
for i in $(seq 1 60); do grep -q "Ready on" "$WORK/dev.log" 2>/dev/null && break; sleep 2; done
grep -q "Ready on" "$WORK/dev.log" || { echo "The local Worker did not start:"; tail -20 "$WORK/dev.log"; exit 1; }

# Creating the tables happens on first use, so make one call before seeding.
curl -s "http://127.0.0.1:8787/api/botcraft/shop?id=11111111-2222-4333-8444-555555555555" -H "Origin: http://127.0.0.1:8765" >/dev/null
node "$HERE/seed.mjs" "$WORK/seed.sql"
(cd "$HERE" && $WRANGLER d1 execute BOTCRAFT_DB --config wrangler.test.toml --local --persist-to "$WORK/state" --file "$WORK/seed.sql" >/dev/null)
node "$HERE/e2e.mjs"
