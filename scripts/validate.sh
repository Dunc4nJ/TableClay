#!/bin/bash
# Quick validation script for TableClay changes
# Usage: ./scripts/validate.sh [backend|frontend|all]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_step() { echo -e "${YELLOW}▶ $1${NC}"; }
log_pass() { echo -e "${GREEN}✓ $1${NC}"; }
log_fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

COMPONENT=${1:-all}

# Backend validation
validate_backend() {
    log_step "Validating Backend (table-clay-store)..."
    cd /Users/duncanjurman/Desktop/TableClay/table-clay-store

    # TypeScript check
    log_step "TypeScript compilation..."
    npx tsc --noEmit && log_pass "TypeScript OK" || log_fail "TypeScript errors"

    # Unit tests
    log_step "Running unit tests..."
    TEST_TYPE=unit yarn test:unit --passWithNoTests && log_pass "Unit tests OK" || log_fail "Unit tests failed"

    # Build check
    log_step "Build check..."
    yarn build && log_pass "Build OK" || log_fail "Build failed"

    log_pass "Backend validation complete!"
}

# Frontend validation
validate_frontend() {
    log_step "Validating Frontend (table-clay-storefront)..."
    cd /Users/duncanjurman/Desktop/TableClay/table-clay-storefront

    # TypeScript check
    log_step "TypeScript compilation..."
    npx tsc --noEmit && log_pass "TypeScript OK" || log_fail "TypeScript errors"

    # Clean Next.js build cache to avoid stale artifacts
    log_step "Cleaning Next.js build cache..."
    rm -rf .next

    # Build check (also runs linting)
    log_step "Build check..."
    yarn build && log_pass "Build OK" || log_fail "Build failed"

    log_pass "Frontend validation complete!"
}

# Quick validation (TypeScript only - fastest)
validate_quick() {
    log_step "Quick validation (TypeScript only)..."

    cd /Users/duncanjurman/Desktop/TableClay/table-clay-store
    npx tsc --noEmit && log_pass "Backend TS OK" || log_fail "Backend TS errors"

    cd /Users/duncanjurman/Desktop/TableClay/table-clay-storefront
    npx tsc --noEmit && log_pass "Frontend TS OK" || log_fail "Frontend TS errors"

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
