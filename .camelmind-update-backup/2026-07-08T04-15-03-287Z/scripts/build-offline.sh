#!/usr/bin/env bash
# Build a self-contained offline ZIP for one version of the help center.
#
# Usage:
#   ./scripts/build-offline.sh v2.0
#   ./scripts/build-offline.sh v1.9
#
# Output: offline-builds/gw-helpcenter-<version>-offline.zip
# Users unzip and run: npx serve out/   (or open index.html directly)

set -euo pipefail

VERSION=${1:-latest}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT/out"
BUILDS_DIR="$ROOT/offline-builds"
ZIP_NAME="camelmind-${VERSION}-offline.zip"

# API routes that require a live server — stash them outside app/ during static export
SERVER_ROUTES=(
  "app/api/raw/route.ts"
  "app/api/download/route.ts"
  "app/api/search/route.ts"
  "app/api/feedback/route.ts"
  "app/api/llms"
  "app/api/auth"
)

stash_routes() {
  mkdir -p "$ROOT/.offline-stash"
  for r in "${SERVER_ROUTES[@]}"; do
    if [ -e "$ROOT/$r" ]; then
      # Flatten path for stash filename
      stash_name="${r//\//__}"
      mv "$ROOT/$r" "$ROOT/.offline-stash/$stash_name"
    fi
  done
}

restore_routes() {
  for r in "${SERVER_ROUTES[@]}"; do
    stash_name="${r//\//__}"
    if [ -e "$ROOT/.offline-stash/$stash_name" ]; then
      # Recreate parent dir if needed (e.g. app/api/raw/)
      mkdir -p "$ROOT/$(dirname "$r")"
      mv "$ROOT/.offline-stash/$stash_name" "$ROOT/$r"
    fi
  done
  rmdir "$ROOT/.offline-stash" 2>/dev/null || true
}

# Always restore on exit (even on error)
PAGES_DIR="$ROOT/.pdf-pages"

cleanup() {
  restore_routes
  rm -rf "$PAGES_DIR"
  # Kill the static server if still running
  if [[ -n "${STATIC_PID:-}" ]]; then
    kill "$STATIC_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "▶ Building offline package for version: $VERSION"

# 1. Pre-build the search index (no API server in static export)
echo "  → Generating search index..."
cd "$ROOT"
npx tsx scripts/build-search-index.ts

# 2. Stash server-only routes so next build doesn't complain
echo "  → Stashing server-only API routes..."
stash_routes

# 3. Static export
echo "  → Running next build (OFFLINE_MODE=true, TARGET_VERSION=$VERSION)..."
OFFLINE_MODE=true TARGET_VERSION="$VERSION" npx next build

# 3. Write launcher scripts and README into the export

cat > "$OUT_DIR/launch.sh" <<'LAUNCHER'
#!/usr/bin/env bash
# CamelMind offline launcher (Mac / Linux)
cd "$(dirname "$0")"
PORT=8765
URL="http://localhost:$PORT/home/"

# Free the port if a previous server is still running
lsof -ti:$PORT 2>/dev/null | xargs kill 2>/dev/null || true

# Try Python 3 first (available on most systems without internet)
if command -v python3 &>/dev/null; then
  echo "Starting local server on $URL"
  python3 -m http.server $PORT &
  SERVER_PID=$!
  sleep 1
  # Open browser
  if command -v open &>/dev/null; then open "$URL"
  elif command -v xdg-open &>/dev/null; then xdg-open "$URL"
  fi
  echo "Press Ctrl+C to stop the server."
  wait $SERVER_PID
# Fall back to Python 2
elif command -v python &>/dev/null; then
  echo "Starting local server on $URL"
  python -m SimpleHTTPServer $PORT &
  SERVER_PID=$!
  sleep 1
  if command -v open &>/dev/null; then open "$URL"
  elif command -v xdg-open &>/dev/null; then xdg-open "$URL"
  fi
  echo "Press Ctrl+C to stop the server."
  wait $SERVER_PID
# Fall back to Node / npx
elif command -v npx &>/dev/null; then
  echo "Starting local server on $URL"
  if command -v open &>/dev/null; then sleep 2 && open "$URL" &
  elif command -v xdg-open &>/dev/null; then sleep 2 && xdg-open "$URL" &
  fi
  npx serve . -p $PORT
else
  echo "ERROR: Python 3, Python 2, or Node.js is required to run this package."
  echo "Install Python from https://www.python.org or Node.js from https://nodejs.org"
  exit 1
fi
LAUNCHER
chmod +x "$OUT_DIR/launch.sh"

cat > "$OUT_DIR/launch.bat" <<'LAUNCHER'
@echo off
REM CamelMind offline launcher (Windows)
cd /D "%~dp0"
set PORT=8765
set URL=http://localhost:%PORT%/home/

REM Try Python 3
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Starting local server on %URL%
    start "" "%URL%"
    python -m http.server %PORT%
    goto :end
)

REM Try Python via py launcher
py --version >nul 2>&1
if %errorlevel% == 0 (
    echo Starting local server on %URL%
    start "" "%URL%"
    py -m http.server %PORT%
    goto :end
)

REM Try npx (Node.js)
npx --version >nul 2>&1
if %errorlevel% == 0 (
    echo Starting local server on %URL%
    start "" "%URL%"
    npx serve . -p %PORT%
    goto :end
)

echo ERROR: Python or Node.js is required to run this package.
echo Install Python from https://www.python.org or Node.js from https://nodejs.org
pause
:end
LAUNCHER

cat > "$OUT_DIR/README.txt" <<EOF
Game Warden Help Center — Offline Package ($VERSION)
====================================================

QUICK START
-----------
Mac / Linux:  Double-click launch.sh  (or run: ./launch.sh in Terminal)
Windows:      Double-click launch.bat

This opens a local web server at http://localhost:8765 and launches your
browser automatically. Press Ctrl+C (or close Terminal) to stop.

REQUIREMENTS
------------
Python 3 is recommended (pre-installed on most Macs and Linux systems).
Windows users may need to install Python from https://www.python.org
Node.js (https://nodejs.org) works as a fallback on all platforms.

SEARCH
------
Full-text search works offline — no internet connection required.

NOTES
-----
- Do not open index.html directly in your browser; navigation will break.
  Always use the launcher or start a local server first.
- This package was generated for authenticated Game Warden users.
  Do not redistribute without authorization.
EOF

# 4. Generate PDF from the static export
echo "  → Generating PDF..."
STATIC_PORT=8766

# Serve the static output on a temporary port
python3 -m http.server "$STATIC_PORT" --directory "$OUT_DIR" >/dev/null 2>&1 &
STATIC_PID=$!

# Wait up to 10s for the server to be ready
for i in $(seq 1 20); do
  if curl -s -o /dev/null "http://localhost:$STATIC_PORT/home/"; then break; fi
  sleep 0.5
done

npx tsx scripts/generate-pdfs.ts --port="$STATIC_PORT" --out="$PAGES_DIR" --no-auth
npx tsx scripts/generate-master-pdf.ts --version="$VERSION" --pages="$PAGES_DIR" --out="$BUILDS_DIR"

kill "$STATIC_PID" 2>/dev/null || true
unset STATIC_PID
rm -rf "$PAGES_DIR"

# 5. Zip the output
echo "  → Packaging..."
mkdir -p "$BUILDS_DIR"
cd "$OUT_DIR"
zip -r "$BUILDS_DIR/$ZIP_NAME" . --quiet

echo "✓ Done: offline-builds/$ZIP_NAME ($(du -sh "$BUILDS_DIR/$ZIP_NAME" | cut -f1))"
