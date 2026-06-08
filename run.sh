#!/usr/bin/env bash
# Backer — local dev server
set -e
cd "$(dirname "$0")"
PORT="${1:-8000}"
echo ""
echo "  Backer is running →  http://localhost:${PORT}"
echo "  (Ctrl+C to stop)"
echo ""
exec python3 -m http.server "$PORT"
