#!/bin/bash
# Quick validation script for TableClay changes
# Usage: ./scripts/validate.sh [backend|frontend|quick|all]

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_step() { echo -e "${YELLOW}▶ $1${NC}"; }
log_pass() { echo -e "${GREEN}✓ $1${NC}"; }
log_fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

COMPONENT=${1:-all}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

is_bun_node() {
    local candidate="$1"
    local is_bun="false"
    is_bun="$("$candidate" -p "typeof process.versions.bun !== 'undefined'" 2>/dev/null || true)"
    [ "$is_bun" = "true" ]
}

find_real_node() {
    local candidate
    while IFS= read -r candidate; do
        [ -x "$candidate" ] || continue
        if ! is_bun_node "$candidate"; then
            echo "$candidate"
            return 0
        fi
    done < <(which -a node 2>/dev/null | awk '!seen[$0]++')
    return 1
}

# Prefer system Node in PATH to avoid Bun's node shim
if [ -x /usr/bin/node ] || [ -x /usr/bin/nodejs ]; then
    export PATH="/usr/bin:$PATH"
elif [ -x /usr/local/bin/node ] || [ -x /usr/local/bin/nodejs ]; then
    export PATH="/usr/local/bin:$PATH"
fi

# Prefer real Node over Bun wrappers (Bun has incompatibilities with Jest/MikroORM)
NODE_BIN=""
if [ -x /usr/bin/nodejs ]; then
    NODE_BIN="/usr/bin/nodejs"
elif [ -x /usr/local/bin/nodejs ]; then
    NODE_BIN="/usr/local/bin/nodejs"
elif [ -x /usr/bin/node ]; then
    NODE_BIN="/usr/bin/node"
elif [ -x /usr/local/bin/node ]; then
    NODE_BIN="/usr/local/bin/node"
else
    NODE_BIN="$(command -v nodejs || command -v node || true)"
fi

if [ -n "$NODE_BIN" ] && is_bun_node "$NODE_BIN"; then
    if real_node="$(find_real_node)"; then
        NODE_BIN="$real_node"
    else
        log_fail "Bun's node shim detected and no real Node.js binary found"
    fi
fi

NPM_BIN="$(command -v npm || true)"
NPX_BIN="$(command -v npx || true)"

if [ -z "$NODE_BIN" ] || [ -z "$NPM_BIN" ] || [ -z "$NPX_BIN" ]; then
    log_fail "Missing nodejs/node or npm/npx in PATH"
fi

log_step "Using Node: $NODE_BIN ($(\"$NODE_BIN\" --version 2>/dev/null || echo 'unknown'))"

NODE_SHIM_DIR="${ROOT_DIR}/.node-bin"
mkdir -p "$NODE_SHIM_DIR"
ln -sf "$NODE_BIN" "${NODE_SHIM_DIR}/node"

run_npx() {
    PATH="$NODE_SHIM_DIR:$PATH" "$NODE_BIN" "$NPX_BIN" "$@"
}

run_npm() {
    PATH="$NODE_SHIM_DIR:$PATH" "$NODE_BIN" "$NPM_BIN" "$@"
}

# Backend validation
validate_backend() {
    log_step "Validating Backend (table-clay-store)..."
    cd "${ROOT_DIR}/table-clay-store"

    # TypeScript check
    log_step "TypeScript compilation..."
    run_npx tsc --noEmit && log_pass "TypeScript OK" || log_fail "TypeScript errors"

    # Unit tests (CI mode for stricter behavior)
    log_step "Running unit tests..."
    TEST_TYPE=unit run_npm run test:ci && log_pass "Unit tests OK" || log_fail "Unit tests failed"

    # Build check
    log_step "Build check..."
    run_npm run build && log_pass "Build OK" || log_fail "Build failed"

    log_pass "Backend validation complete!"
}

# Frontend validation
validate_frontend() {
    log_step "Validating Frontend (table-clay-storefront)..."
    cd "${ROOT_DIR}/table-clay-storefront"

    # TypeScript check
    log_step "TypeScript compilation..."
    run_npx tsc --noEmit && log_pass "TypeScript OK" || log_fail "TypeScript errors"

    # Clean Next.js build cache to avoid stale artifacts
    log_step "Cleaning Next.js build cache..."
    rm -rf .next

    # Lint
    log_step "Lint..."
    run_npm run lint && log_pass "Lint OK" || log_fail "Lint failed"

    # Unit tests (CI mode for stricter behavior)
    log_step "Running unit tests..."
    run_npm run test:ci && log_pass "Unit tests OK" || log_fail "Unit tests failed"

    # Build check
    log_step "Build check..."
    run_npm run build:skip-tests && log_pass "Build OK" || log_fail "Build failed"

    log_pass "Frontend validation complete!"
}

# Quick validation (TypeScript only - fastest)
validate_quick() {
    log_step "Quick validation (TypeScript only)..."

    cd "${ROOT_DIR}/table-clay-store"
    run_npx tsc --noEmit && log_pass "Backend TS OK" || log_fail "Backend TS errors"

    cd "${ROOT_DIR}/table-clay-storefront"
    run_npx tsc --noEmit && log_pass "Frontend TS OK" || log_fail "Frontend TS errors"

    log_pass "Quick validation complete!"
}

case $COMPONENT in
    backend)
        validate_backend
        ;;
    frontend)
        validate_frontend
        ;;
    quick)
        validate_quick
        ;;
    all)
        validate_backend
        validate_frontend
        ;;
    *)
        echo "Usage: $0 [backend|frontend|quick|all]"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  All validations passed! Ready to deploy${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
