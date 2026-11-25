#!/bin/bash
# Runs the BotCraft end-to-end checks against the real Worker code with a local database (no keys, no deploy).
#   bash backend/sitecraft-ai/tests/run.sh
# Needs Node 20+ and wrangler (npx downloads it). Set WRANGLER=/path/to/wrangler to use an installed one.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
WRANGLER="${WRANGLER:-npx --yes wrangler}"
WORK="$(mktemp -d)"
stop_dev() { [ -n "$DEV" ] && kill -- "-$DEV" 2>/dev/null; DEV=""; sleep 3; }
cleanup() { kill "$WEB" 2>/dev/null || true; stop_dev; rm -rf "$WORK"; }
trap cleanup EXIT

# The page code the hosted pages are served from (HOSTING_SOURCE_BASE) and the origin the tests call from.
(cd "$ROOT" && python3 -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1) & WEB=$!
# setsid gives the Worker its own process group, so stopping it also stops workerd.
setsid bash -c "cd '$HERE' && exec $WRANGLER dev --config wrangler.test.toml --local --persist-to '$WORK/state' --port 8787 --ip 127.0.0.1" >"$WORK/dev.log" 2>&1 & DEV=$!
for i in $(seq 1 60); do grep -q "Ready on" "$WORK/dev.log" 2>/dev/null && break; sleep 2; done
grep -q "Ready on" "$WORK/dev.log" || { echo "The local Worker did not start:"; tail -20 "$WORK/dev.log"; exit 1; }

# Creating the tables happens on first use, so make one call before seeding.
curl -s "http://127.0.0.1:8787/api/botcraft/shop?id=11111111-2222-4333-8444-555555555555" -H "Origin: http://127.0.0.1:8765" >/dev/null
node "$HERE/seed.mjs" "$WORK/seed.sql"
(cd "$HERE" && $WRANGLER d1 execute BOTCRAFT_DB --config wrangler.test.toml --local --persist-to "$WORK/state" --file "$WORK/seed.sql" >/dev/null)
node "$HERE/pricing.test.mjs"
node "$HERE/groq.test.mjs"
node "$HERE/trim.test.mjs"
node --no-warnings "$HERE/cache.test.mjs"
node "$HERE/e2e.mjs"

# Phase 2: the same database, now with the R2 photo bucket connected.
stop_dev
setsid bash -c "cd '$HERE' && exec $WRANGLER dev --config wrangler.test-r2.toml --local --persist-to '$WORK/state' --port 8787 --ip 127.0.0.1" >"$WORK/dev2.log" 2>&1 & DEV=$!
for i in $(seq 1 60); do grep -q "Ready on" "$WORK/dev2.log" 2>/dev/null && break; sleep 2; done
grep -q "Ready on" "$WORK/dev2.log" || { echo "The local Worker (with R2) did not start:"; tail -20 "$WORK/dev2.log"; exit 1; }
echo; echo "--- with the R2 photo bucket ---"
node "$HERE/e2e-r2.mjs"
