# Table Clay Backend Deployment

## Executive Sign-Off

| Item | Status |
|------|--------|
| **Backend Deployment** | APPROVED |
| **Sign-off Date** | December 22, 2025 |
| **Verified By** | Claude Code |

### Verification Checklist

- [x] Health endpoint responding (`/health` → OK)
- [x] Redis Event Bus connected (no in-memory warnings)
- [x] Database migrations complete
- [x] Admin dashboard accessible (`/app` → 200 OK)
- [x] Admin user created and login working
- [x] Store API responding with publishable key
- [x] Regions seeded (United States)
- [x] Products seeded (CloudLine Mug demo)
- [x] Shipping configured ($8 flat rate)
- [x] Stripe payment provider enabled
- [x] Stripe webhook configured
- [x] CORS configured for production domains

---

## Production URLs

| Service | URL | Status |
|---------|-----|--------|
| Backend API | https://tableclay-production.up.railway.app | LIVE |
| Admin Dashboard | https://tableclay-production.up.railway.app/app | LIVE |
| Health Check | https://tableclay-production.up.railway.app/health | LIVE |
| Stripe Webhook | https://tableclay-production.up.railway.app/hooks/payment/stripe | ACTIVE |

---

## Overview

The Table Clay backend is a **Medusa.js v2.12.3** e-commerce engine deployed to **Railway** with PostgreSQL and Redis databases.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Railway                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐                                   │
│  │  Medusa Backend  │◄──── Dockerfile-based deployment  │
│  │  Port 8080       │                                   │
│  └────────┬─────────┘                                   │
│           │                                             │
│     ┌─────┴─────┐                                       │
│     ▼           ▼                                       │
│  ┌──────┐   ┌───────┐                                   │
│  │Postgres│ │ Redis │                                   │
│  └──────┘   └───────┘                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Modules Enabled

| Module | Status | Notes |
|--------|--------|-------|
| Event Bus (Redis) | ACTIVE | `@medusajs/medusa/event-bus-redis` |
| Payment (Stripe) | ACTIVE | `@medusajs/medusa/payment-stripe` |
| Locking | In-Memory | Default, not critical |

### Current medusa-config.ts

```typescript
import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    // Redis Event Bus for production
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    // Stripe Payment Provider
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
  ],
})
```

---

## Seeded Data

The production database has been seeded with:

| Data | Value |
|------|-------|
| Store Name | Table Clay |
| Currency | USD |
| Region | United States |
| Tax Region | US |
| Stock Location | Table Clay Studio (Portland) |
| Shipping | Standard Shipping - $8.00 flat (5-7 days) |
| Category | Mugs |
| Demo Product | CloudLine Mug & Saucer Set - $34.99 |
| Inventory | 100 units per variant |

---

## Environment Variables (Railway)

| Variable | Status |
|----------|--------|
| `DATABASE_URL` | Set (auto-injected) |
| `REDIS_URL` | Set (auto-injected) |
| `STORE_CORS` | Set |
| `ADMIN_CORS` | Set |
| `AUTH_CORS` | Set |
| `JWT_SECRET` | Set |
| `COOKIE_SECRET` | Set |
| `STRIPE_API_KEY` | Set (test mode) |
| `STRIPE_WEBHOOK_SECRET` | Set |

---

## Issues Fixed During Deployment

| Issue | Cause | Fix |
|-------|-------|-----|
| Yarn checksum errors | Railway's `yarn install --check-cache` failed | Used Dockerfile with `yarn install --immutable` |
| `updateFulfillmentProviders` error | Invalid API call in seed.ts | Removed the call - not needed in Medusa v2 |
| Missing `@medusajs/framework/utils` | Multi-stage Dockerfile stripped dev dependencies | Switched to single-stage Dockerfile |
| `relation "notification_provider" does not exist` | Migrations not running | Added `yarn medusa db:migrate` to CMD |
| Admin dashboard 404 | Build outputs to `.medusa/server/public/admin/` but server expects `./public/admin/` | Added `cp -r` step in Dockerfile |
| Redis not connecting | `redisUrl` not in config | Added `redisUrl: process.env.REDIS_URL` |
| Local Event Bus warning | Event bus module not configured | Added `@medusajs/medusa/event-bus-redis` module |
| Stripe not working | Payment module commented out | Enabled Stripe payment provider module |
| Admin login failing | User not created in production DB | Created via `railway ssh -- yarn medusa user` |
| Store API empty | Database not seeded | Ran `railway ssh -- yarn seed` |
| **Admin dashboard prices 100x too high** | Dashboard formatting functions didn't convert cents→dollars | Patched `.mjs` files via patch-package (see below) |

---

## Admin Dashboard Currency Fix (December 2024)

### Problem
The admin dashboard displayed prices 100x too high:
- Order #12 showed **$4,642.92** instead of **$46.43**
- Product prices showed **$3,499.00** instead of **$34.99**

### Root Cause
Medusa stores all monetary amounts in **smallest currency unit** (cents for USD, yen for JPY). The admin dashboard's formatting functions (`getLocaleAmount`, `getStylizedAmount`, `formatCurrency`) were displaying these cent values as if they were dollars.

### Key Discovery: .mjs vs .ts Files
**Critical Learning:** The `@medusajs/dashboard` npm package ships **pre-compiled ESM modules** in `dist/`. During build, Vite uses these `.mjs` files, **NOT** the TypeScript sources in `src/`.

```
node_modules/@medusajs/dashboard/
├── src/                    ← TypeScript sources (NOT USED during build)
│   └── lib/
│       ├── format-currency.ts
│       └── money-amount-helpers.ts
└── dist/                   ← Pre-compiled ESM modules (USED by Vite)
    ├── chunk-X6BAAGCL.mjs  ← Contains getLocaleAmount, getStylizedAmount
    ├── chunk-WATKBUHQ.mjs  ← Contains formatCurrency
    └── app.js              ← Bundled version (backup)
```

### Solution: patch-package on Correct Files
We use `patch-package` to modify the correct `.mjs` files:

**Patch file:** `patches/@medusajs+dashboard+2.12.3.patch`

**Files patched:**
- `dist/chunk-X6BAAGCL.mjs` - `getLocaleAmount()`, `getStylizedAmount()`
- `dist/chunk-WATKBUHQ.mjs` - `formatCurrency()`

**Fix logic:** Divide amount by `10^decimalDigits` before formatting:
```javascript
// Before (broken)
return formatter.format(amount);  // 3499 → "$3,499.00"

// After (fixed)
const decimalDigits = currencies[currency.toUpperCase()]?.decimal_digits ?? 2;
const divisor = Math.pow(10, decimalDigits);
const amountInMainUnit = amount / divisor;
return formatter.format(amountInMainUnit);  // 3499 → "$34.99"
```

This correctly handles:
- **USD (2 decimals):** 3499 cents ÷ 100 = $34.99
- **JPY (0 decimals):** 3499 yen ÷ 1 = ¥3,499

### Approaches That Did NOT Work

| Approach | Why It Failed |
|----------|---------------|
| Patching `src/*.ts` files | Vite uses pre-compiled `.mjs` files, not TypeScript sources |
| Patching `dist/app.js` | Vite uses chunk files, not the bundled app.js |
| Vite transform plugin | Plugin added correctly but transforms weren't called on these files |
| Dockerfile sed commands | Fragile, depends on minified variable names |

### How to Fix Similar Dashboard Issues

1. **Identify the function** in `src/lib/*.ts` that needs fixing
2. **Find the compiled chunk** in `dist/chunk-*.mjs` that contains the function
3. **Edit the chunk file** directly with the fix
4. **Run `npx patch-package @medusajs/dashboard`** to create/update the patch
5. **Commit the patch** to `patches/` directory
6. **Deploy** - patch-package runs automatically during `yarn install`

### Verifying the Fix

Check these locations in the admin dashboard:
- **Orders list** → Order Total column
- **Order detail** → Item Subtotal, Shipping, Tax, Total
- **Product variant** → Prices panel (right sidebar)

---

## Deployment Workflow

### Standard Deployment (Code Changes)
1. Make changes to `table-clay-store/`
2. Commit and push to `develop` branch
3. Railway auto-deploys from GitHub
4. Monitor via Railway MCP: `mcp__Railway__list-deployments`
5. Check logs: `mcp__Railway__get-logs`

### Running Commands on Production
```bash
# SSH into Railway container
railway ssh -- <command>

# Examples:
railway ssh -- yarn medusa user -e email@example.com -p password
railway ssh -- yarn seed
railway ssh -- yarn medusa db:migrate
```

---

## API Endpoints

| Endpoint | Description | Auth Required |
|----------|-------------|---------------|
| `/health` | Health check | No |
| `/store/*` | Storefront API | Publishable Key |
| `/admin/*` | Admin API | JWT Token |
| `/app` | Admin dashboard UI | Login |
| `/hooks/payment/stripe` | Stripe webhooks | Webhook Secret |

---

## Monitoring with Railway MCP

```bash
# Check deployment status
mcp__Railway__list-deployments

# View logs
mcp__Railway__get-logs --logType deploy

# List environment variables
mcp__Railway__list-variables
```

---

## Ready for Frontend

The backend is fully configured and ready for the storefront deployment:

- **Publishable API Key:** `pk_a96d80b2210dda0c4d9eee3651311348ecf8c6329713ec7f021972390bdbb4b5`
- **Backend URL:** `https://tableclay-production.up.railway.app`
- **CORS:** Configured for `tableclay.com` and `table-clay-storefront.vercel.app`

---

*Last updated: December 30, 2024*
*Medusa Version: 2.12.3*
*Status: PRODUCTION READY*
