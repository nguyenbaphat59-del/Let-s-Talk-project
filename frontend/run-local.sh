#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
echo "Starting LET'S TALK Backend and Frontend..."
npm run dev:backend &
BACKEND_PID=$!
cleanup() {
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
sleep 2
npm run dev:frontend
