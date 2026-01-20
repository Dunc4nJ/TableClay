#!/usr/bin/env bash
set -euo pipefail

is_bun_node() {
  local candidate="$1"
  local is_bun
  is_bun="$("$candidate" -p "typeof process.versions.bun !== 'undefined'" 2>/dev/null || true)"
  [[ "$is_bun" == "true" ]]
}

find_real_node() {
  local candidate
  while IFS= read -r candidate; do
    [[ -x "$candidate" ]] || continue
    if ! is_bun_node "$candidate"; then
      echo "$candidate"
      return 0
    fi
  done < <(which -a node 2>/dev/null | awk '!seen[$0]++')
  return 1
}

if is_bun_node node; then
  if real_node="$(find_real_node)"; then
    exec "$real_node" "$@"
  fi
  echo "Bun's node shim detected, but no real Node.js binary found in PATH." >&2
  exit 1
fi

exec node "$@"
