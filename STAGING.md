# Staging & Preview Deployment Guide

## Architecture Overview

```
                    ┌─────────────────────────────────────────────┐
                    │                  GitHub                      │
                    │            Dunc4nJ/TableClay                 │
                    │                                              │
                    │   develop ──────────┬──────────────────────  │
                    │   staging ──────────┼──────────────────────  │
                    │   feature/* ────────┼──────────────────────  │
                    └─────────────────────┼──────────────────────  │
                                          │                        │
                    ┌─────────────────────┼────────────────────────┘
                    │                     │
          ┌─────────────────┐   ┌─────────────────┐
          │     Vercel       │   │    Railway       │
          │  (Frontend)      │   │   (Backend)      │
          │                  │   │                   │
          │  Production:     │   │  Production:      │
          │  tableclay.com   │   │  tableclay-       │
          │  ← develop       │   │  production.up.   │
          │                  │   │  railway.app      │
          │  Preview:        │   │                   │
          │  *.vercel.app    │   │  Staging:         │
          │  ← any branch    │   │  tableclay-       │
          │                  │   │  staging.up.      │
          └──────────────────┘   │  railway.app      │
                                 │  ← staging branch │
                                 └───────────────────┘
```

**Production** deploys automatically when code is pushed to `develop`.
**Staging/Preview** deploys automatically when code is pushed to any other branch.

- Vercel preview deployments connect to the **Railway staging backend**
- Vercel production deployment connects to the **Railway production backend**
- Each is a fully isolated environment with separate databases, Redis, Stripe keys, and secrets

---

## What Was Set Up

### 1. Railway Staging Environment

Created by duplicating the production environment:
```bash
railway environment new staging --duplicate production
```

This created a complete copy of all production services (TableClay backend, PostgreSQL, Redis) with their own isolated instances.

**Project**: `diplomatic-flexibility`
**Staging URL**: `https://tableclay-staging.up.railway.app`
**Production URL**: `https://tableclay-production.up.railway.app`

#### Staging-Specific Variables

The following variables were changed from production defaults on the Railway staging environment:

| Variable | Value | Reason |
|----------|-------|--------|
| `STORE_CORS` | `/https:\/\/.*\.vercel\.app$/` | Regex to allow all Vercel preview URLs |
| `ADMIN_CORS` | `/https:\/\/.*\.vercel\.app$/` | Regex to allow admin access from previews |
| `AUTH_CORS` | `/https:\/\/.*\.vercel\.app$/` | Regex to allow auth from previews |
| `COOKIE_SECRET` | Separate random value | Isolate sessions from production |
| `JWT_SECRET` | Separate random value | Isolate tokens from production |
| `STRIPE_API_KEY` | `sk_test_...` | Stripe **test mode** key |
| `STRIPE_WEBHOOK_SECRET` | `disabled` | No webhooks in staging yet |
| `META_PIXEL_ID` | `disabled` | No tracking in staging |
| `TIKTOK_PIXEL_CODE` | `disabled` | No tracking in staging |
| `OMNISEND_API_KEY` | `disabled` | No email sends in staging |
| `SENDGRID_API_KEY` | `disabled` | No email sends in staging |

All other variables (DATABASE_URL, REDIS_URL, S3 config, etc.) were inherited from the duplicated production environment. The staging PostgreSQL and Redis are separate Railway service instances.

### 2. Vercel Preview Environment Variables

Vercel uses **environment scopes**: Production, Preview, and Development. We configured the Preview scope to connect to the Railway staging backend.

| Variable | Preview Value | Purpose |
|----------|--------------|---------|
| `MEDUSA_BACKEND_URL` | `https://tableclay-staging.up.railway.app` | Server-side Medusa SDK |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://tableclay-staging.up.railway.app` | Client-side Medusa SDK |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | `pk_19bae63f...` | Staging-specific Medusa API key (generated from seed) |
| `NEXT_PUBLIC_STRIPE_KEY` | `pk_test_51SgIY7J...` | Stripe test publishable key |
| `NEXT_PUBLIC_DEFAULT_REGION` | `us` | Default store region |
| `NEXT_PUBLIC_GTM_ID` | `disabled` | No analytics tracking |
| `NEXT_PUBLIC_OMNISEND_BRAND_ID` | `disabled` | No marketing popups |
| `NEXT_PUBLIC_TIKTOK_PIXEL_CODE` | `disabled` | No tracking pixels |

Note: `NEXT_PUBLIC_BASE_URL` was removed from preview scope — it only affects `metadataBase` for SEO tags. A code-level fix to use `VERCEL_URL` as fallback would be better (see Remaining Steps).

### 3. Railway Healthcheck (Zero-Downtime Deploys)

Added to `table-clay-store/railway.toml`:

```toml
[deploy]
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
healthcheckPath = "/health"
healthcheckTimeout = 120
```

This ensures Railway waits for the new container to pass the `/health` endpoint before routing traffic to it, preventing downtime during deployments.

### 4. Git Branch Setup

- **`develop`** (default branch) - Production deployments on both Vercel and Railway
- **`staging`** branch created and pushed to `origin` - Railway staging auto-deploy trigger
- **Feature branches** (e.g., `br-###-description`) - Get automatic Vercel preview URLs pointing to Railway staging

### 5. MCP Server Integration

Added Railway and Vercel MCP servers so AI agents can manage infrastructure:

**Claude Code** (`~/.claude.json` under project mcpServers):
- `railway-mcp-server`: Uses Railway CLI with `HOME=/home/ubuntu` env
- `vercel`: HTTP MCP at `https://mcp.vercel.com/duncan-jurmans-projects/table-clay-storefront`

**Codex** (`codex.mcp.json`):
- Same servers configured in Codex format

**VS Code** (`.vscode/mcp.json`):
- Same servers for VS Code Copilot

Note: Railway MCP requires the Railway CLI to be logged in (`railway login`). Vercel MCP requires one-time OAuth authentication.

---

## Deployment Workflow

### For Frontend-Only Changes

1. Create a feature branch from `develop`:
   ```bash
   git checkout -b br-42-new-feature develop
   ```

2. Make changes in `table-clay-storefront/`

3. Push the branch:
   ```bash
   git push origin br-42-new-feature
   ```

4. Vercel automatically creates a **preview URL** (e.g., `table-clay-storefront-git-br-42-new-fe-xxxxx.vercel.app`)

5. The preview connects to the **Railway staging backend** - safe to test without affecting production

6. Once verified, merge into `develop`:
   ```bash
   git checkout develop
   git merge br-42-new-feature
   git push origin develop
   ```

7. Vercel auto-deploys to **production** (`tableclay.com`)

### For Backend-Only Changes

1. Create a feature branch from `develop`:
   ```bash
   git checkout -b br-43-api-change develop
   ```

2. Make changes in `table-clay-store/`

3. Push to `develop` (backend changes need to go through staging first):
   ```bash
   git checkout staging
   git merge br-43-api-change
   git push origin staging
   ```

4. Railway auto-deploys to the **staging environment**

5. Any existing Vercel preview URL (or the staging frontend) can be used to verify

6. Once verified, merge into `develop`:
   ```bash
   git checkout develop
   git merge br-43-api-change
   git push origin develop
   ```

7. Railway auto-deploys to **production**

### For Combined Frontend + Backend Changes

1. Create a feature branch, make both frontend and backend changes

2. First deploy backend to staging:
   ```bash
   git checkout staging
   git merge br-44-full-feature
   git push origin staging
   ```

3. Then push the feature branch for a Vercel preview:
   ```bash
   git push origin br-44-full-feature
   ```

4. The Vercel preview URL now talks to the staging backend with the new API changes

5. Verify everything works, then merge to `develop` for production deployment

### Testing Stripe in Preview/Staging

Use Stripe test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Expiry: any future date. CVC: any 3 digits. ZIP: any 5 digits.

---

## Environment Quick Reference

| | Production | Staging/Preview |
|--|-----------|----------------|
| **Frontend URL** | `tableclay.com` | `*.vercel.app` (auto-generated per branch) |
| **Backend URL** | `tableclay-production.up.railway.app` | `tableclay-staging.up.railway.app` |
| **Git trigger** | Push to `develop` | Push to `staging` (Railway) / any branch (Vercel) |
| **Stripe mode** | Live (`sk_live_*`) | Test (`sk_test_*`) |
| **Analytics** | GTM, TikTok, Meta, OmniSend active | All disabled |
| **Email** | SendGrid + OmniSend active | All disabled |
| **Database** | Separate PostgreSQL instance | Separate PostgreSQL instance |
| **Redis** | Separate Redis instance | Separate Redis instance |

---

## CLI Reference

### Verify Railway Context (CRITICAL)

The Railway CLI context is tied to the working directory. **Always verify before setting variables:**

```bash
railway status                    # Check which environment you're on
railway environment link staging  # Switch to staging
railway service link TableClay    # Ensure correct service
```

### Useful Commands

```bash
# Railway
railway status                              # Current environment
railway variables list                      # Show env vars
railway variables set KEY=VALUE             # Set a variable
railway logs                                # View logs
curl https://tableclay-staging.up.railway.app/health  # Health check

# Vercel
vercel env ls --cwd table-clay-storefront                    # List all env vars
vercel env pull .env.preview --environment preview --cwd table-clay-storefront  # Pull preview vars
printf 'value' | vercel env add VAR_NAME preview --cwd table-clay-storefront    # Set a var (use printf, NOT echo)
```

### Important: Setting Vercel Env Vars

Always use `printf` (not `echo`) to pipe values to `vercel env add`. Using `echo` appends a trailing newline character that gets stored as part of the value and causes build failures:

```bash
# CORRECT
printf 'https://example.com' | vercel env add MY_VAR preview --cwd table-clay-storefront

# WRONG - adds \n to the value
echo 'https://example.com' | vercel env add MY_VAR preview --cwd table-clay-storefront
```

---

## Current Status

### Completed

- [x] Railway staging environment created (duplicated from production)
- [x] All staging variables configured (Stripe test keys, disabled tracking, separate secrets)
- [x] Vercel preview environment variables configured (pointing to staging backend)
- [x] `staging` git branch created and pushed
- [x] `railway.toml` healthcheck added for zero-downtime deploys
- [x] MCP servers configured (Railway + Vercel) for Claude Code, Codex, and VS Code
- [x] Railway staging backend deployed and healthy (`/health` returns 200)
- [x] Fixed env var trailing newline issue (all preview vars re-set with `printf`)
- [x] **Fixed CORS configuration** - Changed `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS` from glob pattern (`https://*.vercel.app`) to regex (`/https:\/\/.*\.vercel\.app$/`) which Medusa v2 actually supports
- [x] **Created staging admin user** - `tableclayy@gmail.com` created via `railway ssh -- npx medusa user`
- [x] **Seeded staging database** - Ran `railway ssh -- npx medusa exec src/scripts/seed.ts` which created: publishable API key, regions, products, sales channel links, fulfillment data
- [x] **Generated staging publishable key** - `pk_19bae63fdc5f247193c7751b40fed5b3b5ea3590b8e5ba86e85b875ff2739721` (set on Vercel preview env)
- [x] **Fixed tax provider** - Linked tax region to `tp_system` provider and created default 0% tax rate for staging
- [x] **Verified preview deployment** - Homepage, product pages, cart add-to-cart, and checkout page all working
- [x] **Removed incorrect `NEXT_PUBLIC_BASE_URL`** from preview scope (was pointing to backend URL)
- [x] **Cleaned up test branch** - Deleted `test/preview-workflow` from local and origin
- [x] **Linked Stripe payment provider to staging region** - Inserted `pp_stripe` into `region_payment_provider` for the US region. Checkout now shows Credit Card (Visa/MC/Amex) alongside Manual Payment
- [x] **Set Railway staging deploy branch** - Set to `staging` in Railway dashboard
- [x] **Configured Stripe staging webhook** - Created webhook endpoint via Stripe API (`we_1SyJMrJAVWQla1FpVyS03cJq`) pointing to `https://tableclay-staging.up.railway.app/hooks/payment/stripe_stripe`. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.refunded`. Set `STRIPE_WEBHOOK_SECRET` on Railway staging
- [x] **Added `VERCEL_URL` fallback to `getBaseURL()`** - Updated `table-clay-storefront/src/lib/util/env.ts` to use `VERCEL_URL` as fallback before `http://localhost:8000`, ensuring correct `metadataBase` on preview deploys
- [x] **Cloned production catalog to staging** - Used `scripts/clone-prod-to-staging.py` to copy 953 rows: 31 products, 5 categories, 6 collections, 46 variants, 184 images, 70 prices, 100 reviews, 55 review images, 28 review stats, 4 FAQs, 4 community creations, 10 bundles, 17 bundle items, 4 store settings, 26 sales tracking records. IDs remapped for staging sales channel, shipping profile, and region

### Verified Working

- Homepage loads with full navigation, all categories (Mugs, Vases, Bowls, Odd & Ends, Pottery Wheel), and collections
- 28 products visible with prices, images, and variant options
- Product detail page has image gallery, color/variant options, and add-to-cart
- Add to cart works (cart count updates correctly)
- Checkout page loads with address form, shipping methods, and payment
- Shipping methods show (Standard $5, Premium $8)
- **Stripe Credit Card payment** shows as an option at checkout (test mode)
- **Stripe webhook** configured and receiving events
- Reviews, bundles, FAQs, community creations, and store settings all cloned

### Analytics & Tracking (Intentionally Disabled)

All analytics and tracking are disabled on staging to prevent polluting production data:

| Service | Backend Var | Frontend Var | Status |
|---------|-------------|-------------|--------|
| Google Tag Manager | N/A | `NEXT_PUBLIC_GTM_ID=disabled` | Disabled |
| TikTok Pixel | `TIKTOK_PIXEL_CODE=disabled` | `NEXT_PUBLIC_TIKTOK_PIXEL_CODE=disabled` | Disabled |
| Meta Pixel | `META_PIXEL_ID=disabled` | N/A (not implemented client-side) | Disabled |
| OmniSend | `OMNISEND_API_KEY=disabled` | `NEXT_PUBLIC_OMNISEND_BRAND_ID=disabled` | Disabled |
| SendGrid | `SENDGRID_API_KEY=disabled` | N/A | Disabled |

The frontend code returns `null` when these env vars are empty/missing, so no tracking scripts are loaded on preview deploys. This is a deliberate design decision — staging is for testing functionality, not analytics.

### Known Limitations

- **Stripe webhook events will fire** but OmniSend/SendGrid subscribers will no-op (API keys disabled). Sales tracking (bestseller counts) will increment normally
- **Production orders/customers are NOT cloned** — staging has a clean order history. Only catalog data (products, reviews, content) is synced
- **Images work** — S3 credentials are inherited from production, so all product images display correctly

### Staging Admin Access

- **URL**: `https://tableclay-staging.up.railway.app/app`
- **Email**: `tableclayy@gmail.com`
- **Password**: Same as set during creation

---

## Refreshing Staging Data

The staging database can be refreshed from production at any time using the clone script. Content (products, reviews, collections, etc.) is managed in the **production admin** and periodically synced down to staging.

### Usage

```bash
# Full clone (all tables)
python scripts/clone-prod-to-staging.py

# Preview what would be cloned without making changes
python scripts/clone-prod-to-staging.py --dry-run

# Clone only custom module tables (reviews, FAQs, bundles, etc.)
python scripts/clone-prod-to-staging.py --tables custom

# Clone only Medusa core tables (products, categories, prices, etc.)
python scripts/clone-prod-to-staging.py --tables core
```

### What Gets Cloned

| Category | Tables | Notes |
|----------|--------|-------|
| Products | `product`, `product_variant`, `product_option`, `product_option_value`, `product_variant_option` | Full product catalog with all variants |
| Categories | `product_category`, `product_category_product` | Category hierarchy and product assignments |
| Collections | `product_collection` | Collection groupings |
| Images | `image` | All product images (stored in S3) |
| Prices | `price_set`, `price`, `price_rule`, `product_variant_price_set` | All pricing data, region remapped |
| Reviews | `content_review`, `content_review_image`, `content_product_review_stats` | Admin-curated reviews and stats |
| FAQs | `content_faq` | Product and global FAQs |
| Community | `content_community_creation` | Customer showcase gallery |
| Bundles | `bundle`, `bundle_item` | Product bundles with pricing |
| Settings | `store_setting` | Store configuration (promo headlines, product ordering) |
| Sales | `product_sales` | Bestseller tracking data |
| Inventory | `inventory_item`, `product_variant_inventory_item` | Inventory links (levels auto-created) |

### What Is NOT Cloned

- Orders, customers, carts (staging has clean order history)
- Authentication data (users, sessions, API keys)
- Region/tax/shipping configuration (staging has its own)
- Environment variables (managed separately)

### ID Remapping

The script automatically remaps these production IDs to staging equivalents:

| Field | Production ID | Staging ID |
|-------|--------------|------------|
| `sales_channel_id` | `sc_01KCXBH6XWZGFE8ANEH8KM0HSX` | `sc_01KGSSD5HD8YEXR6EMGTFW4AZP` |
| `shipping_profile_id` | `sp_01KCXAWSY01KFWNRZF0M77XW6G` | `sp_01KGSSD1XWZ76VWB0T3RYFBMA8` |
| `region_id` (in price rules) | `reg_01KD1ZBZQWK3XB80DJT6N9J2PX` | `reg_01KGWM7NN865104EZBJXNCQKTA` |
