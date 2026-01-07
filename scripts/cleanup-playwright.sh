#!/usr/bin/env bash
set -euo pipefail

WAIT_SECONDS="${1:-60}"
PATTERN="${PLAYWRIGHT_PATTERN:-ms-playwright/mcp-chrome}"

echo "[playwright-clean] Waiting ${WAIT_SECONDS}s before checking for stuck Playwright..."
sleep "${WAIT_SECONDS}"

if command -v pgrep >/dev/null 2>&1; then
  PIDS="$(pgrep -f "${PATTERN}" || true)"
else
  PIDS="$(ps aux | rg "${PATTERN}" | awk '{print $2}')"
fi

if [ -z "${PIDS}" ]; then
  echo "[playwright-clean] No matching Playwright processes found."
  exit 0
fi

echo "[playwright-clean] Found processes: ${PIDS}"
echo "${PIDS}" | xargs -n1 kill -TERM || true
sleep 5

if command -v pgrep >/dev/null 2>&1; then
  REMAINING="$(pgrep -f "${PATTERN}" || true)"
else
  REMAINING="$(ps aux | rg "${PATTERN}" | awk '{print $2}')"
fi

if [ -n "${REMAINING}" ]; then
  echo "[playwright-clean] Forcing kill for: ${REMAINING}"
  echo "${REMAINING}" | xargs -n1 kill -KILL || true
fi

echo "[playwright-clean] Done."
