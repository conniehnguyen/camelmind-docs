#!/usr/bin/env bash
# Build the master PDF for one version of the Help Center.
#
# Usage:
#   ./scripts/build-pdf.sh v2.0
#
# Requires: the Next.js dev server running on port 3000 (npm run dev)
# Output: offline-builds/Game-Warden-Help-Center-<version>.pdf

set -euo pipefail

VERSION=${1:-latest}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAGES_DIR="$ROOT/.pdf-pages"
PORT=3000

cleanup() {
  rm -rf "$PAGES_DIR"
}
trap cleanup EXIT

echo "▶ Building master PDF for version: $VERSION"

# Verify dev server is running
if ! curl -s -o /dev/null "http://localhost:$PORT/home"; then
  echo "✗ Dev server not running on port $PORT"
  echo "  Start it with: npm run dev"
  exit 1
fi

# Generate per-page PDFs against the live dev server
echo "  → Rendering pages via Playwright (port $PORT)..."
cd "$ROOT"
npx tsx scripts/generate-pdfs.ts --port="$PORT" --out="$PAGES_DIR"

# Assemble master PDF
echo "  → Assembling master PDF..."
npx tsx scripts/generate-master-pdf.ts --version="$VERSION" --pages="$PAGES_DIR" --out="$ROOT/offline-builds"

SIZE=$(du -sh "$ROOT/offline-builds/camelmind-${VERSION}.pdf" | cut -f1)
echo "✓ Done: offline-builds/camelmind-${VERSION}.pdf ($SIZE)"
