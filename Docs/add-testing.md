# Testing Setup

## Overview

TableClay uses Jest for testing on both frontend and backend. Tests run automatically in CI/CD pipelines on every push.

---

## Test Suites

| Component | Location | Framework | Test Count |
|-----------|----------|-----------|------------|
| Backend | `table-clay-store/src/__tests__/` | Jest + SWC | 10 |
| Frontend | `table-clay-storefront/__tests__/` | Jest + ts-jest | 36 |

---

## When Tests Run

### Railway (Backend)

Tests run during Docker build, before the application builds:

```dockerfile
# From table-clay-store/Dockerfile
RUN yarn test:unit --passWithNoTests
RUN yarn build
```

**Trigger:** Every push to `develop` branch
**Behavior:** Build fails if tests fail, blocking deployment

### Vercel (Frontend)

Tests run as part of the build command:

```json
// From table-clay-storefront/package.json
"build": "yarn test:ci && next build"
```

**Trigger:** Every push to `develop` branch
**Behavior:** Build fails if tests fail, blocking deployment

### Pre-commit Hook (Local)

A Husky pre-commit hook runs on every commit:

```bash
# From .husky/pre-commit
echo "Pre-commit hook: Tests will run on Vercel/Railway build"
```

Currently simplified to just echo (lint-staged has ESLint version conflicts).

---

## Running Tests Locally

### Backend

```bash
cd table-clay-store

# Run unit tests
TEST_TYPE=unit yarn test:unit

# Run integration tests (requires running server)
TEST_TYPE=integration:http yarn test:integration
```

### Frontend

```bash
cd table-clay-storefront

# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage (CI mode)
yarn test:ci
```

---

## Test File Conventions

### Backend

| Type | Pattern | Setup Required |
|------|---------|----------------|
| Unit | `src/**/__tests__/**/*.unit.spec.ts` | No |
| Integration (HTTP) | `integration-tests/http/*.spec.ts` | Yes |
| Integration (Modules) | `src/modules/*/__tests__/**/*.ts` | Yes |

### Frontend

| Type | Pattern |
|------|---------|
| All | `__tests__/**/*.test.ts` |

---

## Current Test Coverage

### Backend Unit Tests (`currency.unit.spec.ts`)

Tests for currency handling (regression tests for the 100x price display bug):

- Price storage in cents (USD, EUR)
- Zero-decimal currencies (JPY, KRW)
- Display conversion logic
- Regression: Admin dashboard should not show 100x price

### Frontend Tests (`money.test.ts`)

Tests for money formatting utilities:

- `convertToLocale` - Currency formatting
- `getPercentageDiff` - Percentage calculations
- `getPricesForVariant` - Variant price extraction
- `getProductPrice` - Product price display
- `getCheapestVariantPriceDisplay` - Cheapest variant logic

---

## Adding New Tests

### When to Add Tests

Add tests when:
- Fixing a bug (regression test)
- Adding a new feature
- Modifying existing functionality
- Working with currency/price calculations

### Backend Unit Test Example

```typescript
// table-clay-store/src/__tests__/feature.unit.spec.ts
describe('Feature Name', () => {
  it('should do something specific', () => {
    const result = someFunction(input)
    expect(result).toBe(expectedOutput)
  })
})
```

### Frontend Test Example

```typescript
// table-clay-storefront/__tests__/lib/feature.test.ts
describe('Feature Name', () => {
  it('should handle expected case', () => {
    const result = featureFunction(input)
    expect(result).toEqual(expectedOutput)
  })
})
```

---

## CI/CD Flow

```
Developer commits code
        │
        ▼
┌───────────────────┐
│  Pre-commit Hook  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Push to GitHub  │
└─────────┬─────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌────────┐  ┌─────────┐
│ Vercel │  │ Railway │
│ Build  │  │  Build  │
└────┬───┘  └────┬────┘
     │           │
     ▼           ▼
  yarn test   yarn test:unit
  next build  yarn build
     │           │
     ▼           ▼
  Deploy if   Deploy if
  tests pass  tests pass
```

---

## Configuration Files

| File | Purpose |
|------|---------|
| `table-clay-store/jest.config.js` | Backend Jest config |
| `table-clay-storefront/jest.config.js` | Frontend Jest config |
| `table-clay-store/Dockerfile` | Runs tests before build |
| `table-clay-storefront/package.json` | Build script includes tests |
| `table-clay-store/railway.toml` | Enforces Dockerfile builder |
| `.husky/pre-commit` | Pre-commit hook |
