#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERCEL_DIR="${VERCEL_DIR:-$ROOT_DIR/table-clay-storefront}"
RAILWAY_DIR="${RAILWAY_DIR:-$ROOT_DIR/table-clay-store}"

POLL_INTERVAL="${POLL_INTERVAL:-15}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-1200}"

START_TS="$(date +%s)"
GIT_COMMIT="$(git -C "$ROOT_DIR" rev-parse HEAD)"

log() {
  printf "[deploy-monitor] %s\n" "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf "[deploy-monitor] Missing command: %s\n" "$1" >&2
    exit 1
  fi
}

require_cmd vercel
require_cmd railway
require_cmd jq
require_cmd rg

get_latest_vercel_url() {
  vercel list --yes --cwd "$VERCEL_DIR" 2>/dev/null | rg -o "https://[^ ]+" | head -n 1
}

wait_for_vercel() {
  local url state created_at now age_sec
  url="$(get_latest_vercel_url)"

  if [[ -z "$url" ]]; then
    printf "[deploy-monitor] Unable to determine latest Vercel deployment URL.\n" >&2
    exit 1
  fi

  log "Vercel latest deployment: $url"

  local info
  info="$(vercel inspect "$url" --json --cwd "$VERCEL_DIR")"
  state="$(echo "$info" | jq -r ".readyState")"
  created_at="$(echo "$info" | jq -r ".createdAt")"

  now="$(date +%s)"
  age_sec="$((now - (created_at / 1000)))"
  log "Vercel state: $state (created ${age_sec}s ago)"

  if [[ "$state" == "READY" ]]; then
    return 0
  fi

  if [[ "$state" == "ERROR" ]]; then
    printf "[deploy-monitor] Vercel deployment failed.\n" >&2
    exit 1
  fi

  log "Waiting for Vercel deployment to finish..."
  info="$(vercel inspect "$url" --wait --timeout "${TIMEOUT_SECONDS}s" --json --cwd "$VERCEL_DIR")"
  state="$(echo "$info" | jq -r ".readyState")"

  if [[ "$state" != "READY" ]]; then
    printf "[deploy-monitor] Vercel deployment ended with state: %s\n" "$state" >&2
    exit 1
  fi
}

wait_for_railway() {
  local deadline=$((START_TS + TIMEOUT_SECONDS))
  local status commit

  if ! (cd "$RAILWAY_DIR" && railway status --json >/dev/null 2>&1); then
    printf "[deploy-monitor] Railway project not linked. Run:\n" >&2
    printf "  (cd %s && railway link)\n" "$RAILWAY_DIR" >&2
    exit 1
  fi

  while true; do
    local payload
    payload="$(cd "$RAILWAY_DIR" && railway deployment list --json --limit 1)"
    status="$(echo "$payload" | jq -r ".[0].status // empty")"
    commit="$(echo "$payload" | jq -r ".[0].meta.commitHash // empty")"

    if [[ -n "$commit" && "$commit" != "$GIT_COMMIT" ]]; then
      log "Railway latest deployment commit $commit (waiting for $GIT_COMMIT)..."
    else
      log "Railway status: $status (commit ${commit:-unknown})"
      case "$status" in
        SUCCESS)
          return 0
          ;;
        FAILED|CRASHED|ERROR)
          printf "[deploy-monitor] Railway deployment failed.\n" >&2
          exit 1
          ;;
      esac
    fi

    if [[ "$(date +%s)" -ge "$deadline" ]]; then
      printf "[deploy-monitor] Timeout waiting for Railway deployment.\n" >&2
      exit 1
    fi

    sleep "$POLL_INTERVAL"
  done
}

log "Waiting for deployments for commit $GIT_COMMIT"
wait_for_railway
wait_for_vercel
log "Deployments complete."
