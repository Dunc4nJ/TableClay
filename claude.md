# Table Clay - Handmade Pottery E-commerce Platform

## Project Summary

**Table Clay** is a handmade pottery business e-commerce platform built on **Medusa.js v2.12.3**, a modern, modular commerce engine. This repository contains a fully functional three-tier architecture ready for customization into a unique pottery storefront.

### Current State
- Functional e-commerce platform with demo products
- Ready for customization and branding
- All core commerce features working (cart, checkout, orders)
- Admin dashboard operational at localhost:9000/app

### Goal
Transform this Medusa.js template into a beautiful, branded e-commerce experience for **Table Clay** - showcasing handmade pottery pieces with a focus on craftsmanship, artisan quality, and the unique story behind each piece.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Table Clay                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  Admin Dashboard │         │  Next.js Store   │             │
│  │  localhost:9000  │         │  localhost:8000  │             │
│  │  /app            │         │  Customer-facing │             │
│  └────────┬─────────┘         └────────┬─────────┘             │
│           │                            │                        │
│           └────────────┬───────────────┘                        │
│                        ▼                                        │
│            ┌──────────────────────┐                             │
│            │   Medusa Backend     │                             │
│            │   localhost:9000     │                             │
│            │   /store, /admin API │                             │
│            └──────────┬───────────┘                             │
│                       │                                         │
│                       ▼                                         │
│            ┌──────────────────────┐                             │
│            │  PostgreSQL Database │                             │
│            │   table-clay-store    │                             │
│            └──────────────────────┘                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Backend** | Medusa.js | 2.12.3 |
| **Frontend** | Next.js | 15.3.8 |
| **UI** | React | 19.0.3 |
| **Styling** | Tailwind CSS | 3.0.23 |
| **Database** | PostgreSQL | 15 |
| **Language** | TypeScript | 5.6.2 |
| **Package Manager** | Yarn | 3.2.1 |

---

## Project Structure

```
TableClay/
├── table-clay-store/              # Backend (Medusa Commerce Engine)
│   ├── src/
│   │   ├── api/                  # Custom API routes (2 stub endpoints)
│   │   ├── modules/              # Custom business modules (empty - ready)
│   │   ├── workflows/            # Custom workflows (empty - ready)
│   │   ├── jobs/                 # Scheduled background jobs (empty - ready)
│   │   ├── subscribers/          # Event handlers (empty - ready)
│   │   ├── admin/                # Admin dashboard customizations
│   │   │   └── i18n/             # i18n for French/Spanish
│   │   ├── scripts/
│   │   │   └── seed.ts           # Database seeding (4 demo products)
│   │   └── links/                # Module relationships (empty - ready)
│   ├── medusa-config.ts          # Main configuration
│   ├── .env                      # Environment variables
│   └── package.json
│
├── table-clay-storefront/   # Frontend (Next.js Customer Store)
│   ├── src/
│   │   ├── app/                  # Next.js app router
│   │   │   └── [countryCode]/    # Localized routes
│   │   │       ├── (main)/       # Main store pages
│   │   │       │   ├── account/  # Customer accounts
│   │   │       │   ├── cart/     # Shopping cart
│   │   │       │   ├── products/ # Product pages
│   │   │       │   └── store/    # Product listing
│   │   │       └── (checkout)/   # Checkout flow
│   │   ├── modules/              # UI Components (13 modules)
│   │   │   ├── home/             # Homepage components
│   │   │   ├── products/         # Product display
│   │   │   ├── cart/             # Cart components
│   │   │   ├── checkout/         # Checkout flow
│   │   │   ├── layout/           # Headers, footers, nav
│   │   │   └── common/           # Shared components
│   │   └── lib/                  # Utilities & data fetching
│   │       ├── data/             # Server actions (14 files)
│   │       ├── hooks/            # React hooks
│   │       └── util/             # Helper functions
│   ├── tailwind.config.js        # Styling configuration
│   ├── .env.local                # Frontend environment
│   └── package.json
│
├── packages/                     # Medusa Core (reference only)
├── overview.md                   # Platform overview
└── claude.md                     # This file
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15
- Yarn

### Start Backend
```bash
cd table-clay-store
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
yarn dev
```
Backend runs at: **http://localhost:9000**

### Start Storefront
```bash
cd table-clay-storefront
npm run dev
```
Storefront runs at: **http://localhost:8000**

### Admin Access
- URL: http://localhost:9000/app
- Email: `tableclayy@gmail.com`
- Password: `table.clay!`

---

## Key Files for Customization

### Branding & Styling
| File | Purpose |
|------|---------|
| `storefront/tailwind.config.js` | Colors, fonts, design tokens |
| `storefront/src/app/globals.css` | Global styles |
| `storefront/src/modules/layout/` | Header, footer, navigation |
| `storefront/src/modules/home/` | Homepage components |

### Product Display
| File | Purpose |
|------|---------|
| `storefront/src/modules/products/` | Product pages & galleries |
| `storefront/src/modules/products/components/image-gallery/` | Product images |
| `storefront/src/modules/products/components/product-tabs/` | Product info tabs |

### Backend Configuration
| File | Purpose |
|------|---------|
| `table-clay-store/medusa-config.ts` | Core configuration |
| `table-clay-store/src/scripts/seed.ts` | Product seeding |
| `table-clay-store/.env` | Environment variables |

---

## Customization Roadmap for Table Clay

### Phase 1: Branding & Design
- [ ] Update Tailwind color palette for earthy pottery tones
- [ ] Replace placeholder logo with Table Clay branding
- [ ] Customize homepage hero with pottery imagery
- [ ] Update typography for artisan aesthetic
- [ ] Design product cards for handmade items

### Phase 2: Product Setup
- [ ] Remove demo products (Medusa T-Shirts)
- [ ] Create product categories (Bowls, Plates, Vases, Mugs, etc.)
- [ ] Add pottery products with high-quality images
- [ ] Configure product variants (sizes, glazes, colors)
- [ ] Set up proper pricing for handmade items

### Phase 3: Store Configuration
- [ ] Configure shipping for fragile pottery items
- [ ] Set up appropriate regions/countries
- [ ] Configure tax settings
- [ ] Integrate Stripe for payments
- [ ] Set up inventory management

### Phase 4: Content & Experience
- [ ] Add "About the Artist" page
- [ ] Create "Our Process" storytelling section
- [ ] Add product care instructions
- [ ] Implement customer reviews/testimonials
- [ ] Add artisan story to product pages

### Phase 5: Advanced Features (Optional)
- [ ] Custom order/commission request system
- [ ] Workshop booking integration
- [ ] Newsletter signup
- [ ] Social media integration
- [ ] Gift wrapping options

---

## Extension Points

### Custom API Routes
Location: `table-clay-store/src/api/`
```typescript
// Example: Add custom pottery care endpoint
// src/api/store/pottery-care/route.ts
export async function GET(req, res) {
  return res.json({ careInstructions: [...] })
}
```

### Custom Modules
Location: `table-clay-store/src/modules/`
- Create custom data models for pottery-specific needs
- Examples: ArtistProfile, CommissionRequest, CareInstructions

### Event Subscribers
Location: `table-clay-store/src/subscribers/`
- React to order events (send artisan notifications)
- Track product views, wishlist additions

### Scheduled Jobs
Location: `table-clay-store/src/jobs/`
- Low stock alerts
- Abandoned cart reminders
- Review request emails

---

## Environment Variables

### Backend (`table-clay-store/.env`)
```env
DATABASE_URL=postgresql://localhost/table-clay-store
STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:9000
AUTH_CORS=http://localhost:8000,http://localhost:9000
JWT_SECRET=your-secret-here
COOKIE_SECRET=your-cookie-secret
# Add for payments:
STRIPE_API_KEY=sk_test_...
```

### Frontend (`table-clay-storefront/.env.local`)
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_REGION=us
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
```

---

## Useful Commands

### Backend
```bash
cd table-clay-store
yarn dev                    # Start dev server
yarn build                  # Build for production
yarn seed                   # Seed database
yarn medusa db:migrate      # Run migrations
yarn medusa user -e email -p pass  # Create admin user
```

### Frontend
```bash
cd table-clay-storefront
npm run dev                 # Start dev (port 8000)
npm run build               # Production build
npm start                   # Start production
```

### Database
```bash
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
psql table-clay-store        # Access database
```

### Validation (Run Before Push)
```bash
./scripts/validate.sh all    # Full validation (REQUIRED before git push)
./scripts/validate.sh quick  # Quick TypeScript check only
./scripts/validate.sh backend  # Backend only
./scripts/validate.sh frontend # Frontend only
```

---

## Production Deployment

### Live URLs

| Service | URL |
|---------|-----|
| **Backend API** | https://tableclay-production.up.railway.app |
| **Admin Dashboard** | https://tableclay-production.up.railway.app/app |
| **Health Check** | https://tableclay-production.up.railway.app/health |
| **Storefront** | https://table-clay-storefront.vercel.app (pending) |

### Backend Deployment (Railway)

The backend auto-deploys from the `develop` branch via GitHub integration.

**Deployment Workflow:**
1. Make changes to `table-clay-store/`
2. Commit and push to `develop` branch
3. Railway automatically triggers a build
4. Monitor deployment status using Railway MCP

**Monitor with Railway MCP:**
```bash
# Check deployment status (Claude Code will use these automatically)
mcp__Railway__list-deployments    # List recent deployments
mcp__Railway__get-logs            # View deploy/build logs
mcp__Railway__list-services       # List all services
```

**Manual Railway CLI Commands:**
```bash
cd table-clay-store
railway link                      # Link to Railway project (first time)
railway logs                      # View live logs
railway status                    # Check deployment status
```

**Pre-deployment Checklist:**
- [ ] Run `./scripts/validate.sh all` (see below)
- [ ] Verify database migrations if schema changed
- [ ] Test critical user flows locally

---

## Pre-Push Validation (REQUIRED)

**IMPORTANT FOR AGENTS:** Before pushing any changes to git and triggering a deploy, you MUST run the validation script:

```bash
# Run from project root - validates both backend and frontend
./scripts/validate.sh all
```

### Validation Options

| Command | Time | What it checks |
|---------|------|----------------|
| `./scripts/validate.sh quick` | 5-10s | TypeScript compilation only |
| `./scripts/validate.sh backend` | 30-60s | Backend TS + unit tests + build |
| `./scripts/validate.sh frontend` | 1-2min | Frontend TS + build |
| `./scripts/validate.sh all` | 2-3min | Full validation (recommended) |

### Validation Workflow

```
1. Make code changes
2. Run: ./scripts/validate.sh all
3. If PASS → git add, commit, push
4. If FAIL → fix errors, repeat from step 2
```

### What the Script Checks

1. **TypeScript Compilation** (`npx tsc --noEmit`)
   - Catches type errors, missing imports, interface mismatches

2. **Unit Tests** (`TEST_TYPE=unit yarn test:unit`)
   - Validates business logic, service methods, utilities

3. **Production Build** (`yarn build`)
   - Catches SSR issues, missing dependencies, build-time errors

### Quick Validation During Development

For rapid iteration while coding (before full validation):

```bash
# Backend only - TypeScript check
cd table-clay-store && npx tsc --noEmit

# Frontend only - TypeScript check
cd table-clay-storefront && npx tsc --noEmit

# Test specific API endpoint locally
curl http://localhost:9000/store/products | jq
```

### Visual Validation (Optional)

For UI changes, agents can use Chrome automation to verify visually:

```bash
# Start local servers first
cd table-clay-store && yarn dev &
cd table-clay-storefront && yarn dev &

# Then use Chrome MCP tools to screenshot/verify UI
```

### Frontend Deployment (Vercel)

The storefront deploys to Vercel.

**Environment Variables (Vercel Dashboard):**
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://tableclay-production.up.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_BASE_URL=https://tableclay.com
NEXT_PUBLIC_DEFAULT_REGION=us
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
```

**Deploy Commands:**
```bash
cd table-clay-storefront
vercel                           # Preview deployment
vercel --prod                    # Production deployment
vercel logs                      # View deployment logs
```

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Production Environment                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  Vercel          │         │  Railway         │             │
│  │  (Storefront)    │────────▶│  (Backend)       │             │
│  │  Next.js SSR     │         │  Medusa.js       │             │
│  └──────────────────┘         └────────┬─────────┘             │
│                                        │                        │
│                               ┌────────┴────────┐               │
│                               ▼                 ▼               │
│                        ┌──────────┐      ┌──────────┐          │
│                        │ Postgres │      │  Redis   │          │
│                        │ (Railway)│      │(Railway) │          │
│                        └──────────┘      └──────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Learnings & Best Practices

### HTTP Requests: Use Python urllib (NOT curl)

**IMPORTANT:** Always use Python with `urllib` for HTTP requests, never `curl`. This ensures consistent, predictable behavior across environments.

```python
import urllib.request
import json

# 1. Authenticate and get JWT token
auth_url = 'https://tableclay-production.up.railway.app/auth/user/emailpass'
auth_data = json.dumps({'email': 'tableclayy@gmail.com', 'password': 'Table.clay!'}).encode('utf-8')
auth_req = urllib.request.Request(auth_url, data=auth_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(auth_req) as response:
    token = json.loads(response.read().decode('utf-8'))['token']

# 2. Use token for Admin API requests
url = 'https://tableclay-production.up.railway.app/admin/products'
req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req) as response:
    result = json.loads(response.read().decode('utf-8'))
    print(json.dumps(result, indent=2))

# 3. POST request example
url = 'https://tableclay-production.up.railway.app/admin/regions/reg_xxx'
data = json.dumps({'payment_providers': ['pp_stripe']}).encode('utf-8')
req = urllib.request.Request(url, data=data, method='POST', headers={
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {token}'
})
with urllib.request.urlopen(req) as response:
    result = json.loads(response.read().decode('utf-8'))
```

**Important endpoints:**
- Auth: `POST /auth/user/emailpass` - Get JWT token
- Products: `GET/POST /admin/products`
- Collections: `GET/POST /admin/collections`
- Categories: `GET/POST /admin/product-categories`
- API Keys: `GET /admin/api-keys` - Get publishable keys
- Regions: `GET/POST /admin/regions` - Manage regions and payment providers

### Vercel Auto-Deploy Configuration (Monorepo)

When using Vercel with a monorepo where the Next.js app is in a subdirectory:

**Project Settings → Build and Deployment → Root Directory:**
- Set to `table-clay-storefront` (the subdirectory containing the Next.js app)

**Important:**
- GitHub auto-deploys work from repo root → needs Root Directory set
- CLI deploys (`vercel deploy`) from within the subdirectory → conflicts with Root Directory setting
- **Best Practice:** Use GitHub auto-deploys exclusively when Root Directory is configured

**Triggering Deploys:**
```bash
# Push to develop branch triggers auto-deploy
git add .
git commit -m "feat: Your changes"
git push origin develop

# DO NOT use `vercel deploy` from subdirectory when Root Directory is set
# It will look for table-clay-storefront/table-clay-storefront and fail
```

### Next.js Data Fetching & Caching

**Problem:** Static data not updating after backend changes

**Root Cause:** Using `cache: "force-cache"` causes Next.js to cache API responses indefinitely during build

**Solution:** Use `revalidate` for time-based cache invalidation:

```typescript
// ❌ Bad - caches forever
return sdk.client.fetch("/store/collections", {
  cache: "force-cache",
})

// ✅ Good - revalidates every 60 seconds
return sdk.client.fetch("/store/collections", {
  next: {
    ...cacheOptions,
    revalidate: 60,
  },
})
```

**Files updated:**
- `table-clay-storefront/src/lib/data/collections.ts`
- `table-clay-storefront/src/lib/data/categories.ts`

### Store API vs Admin API

| Feature | Store API | Admin API |
|---------|-----------|-----------|
| Base Path | `/store/*` | `/admin/*` |
| Auth | Publishable Key | JWT Bearer Token |
| Purpose | Customer-facing | Management |
| Example | `/store/products` | `/admin/products` |

**Store API (for storefront):**
```typescript
// Uses publishable key from env
const response = await sdk.client.fetch("/store/products")
```

**Admin API (for management scripts):**
```python
# Use Python urllib (see "HTTP Requests" section above)
import urllib.request, json
req = urllib.request.Request(
    'https://tableclay-production.up.railway.app/admin/collections',
    headers={'Authorization': f'Bearer {token}'}
)
with urllib.request.urlopen(req) as r:
    print(json.loads(r.read()))
```

---

## Resources

- [Medusa Documentation](https://docs.medusajs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Stripe Integration](https://docs.medusajs.com/resources/commerce-modules/payment/payment-provider/stripe)

---

## Testing Requirements

**IMPORTANT:** After successfully implementing and verifying any feature or bug fix, you MUST:

1. **Add a regression/unit test** to the test suite that covers the new functionality
2. **Run tests locally** to ensure they pass:
   ```bash
   # Backend
   cd table-clay-store && TEST_TYPE=unit yarn test:unit

   # Frontend
   cd table-clay-storefront && yarn test
   ```
3. **Commit the changes** including the new tests
4. **Push to develop** to trigger CI/CD
5. **Validate deploys pass** on both Railway and Vercel

### Test File Locations

| Component | Location | Pattern |
|-----------|----------|---------|
| Backend unit tests | `table-clay-store/src/__tests__/` | `*.unit.spec.ts` |
| Frontend tests | `table-clay-storefront/__tests__/` | `*.test.ts` |

### Example: Adding a Backend Unit Test

```typescript
// table-clay-store/src/__tests__/feature.unit.spec.ts
describe('Feature Name', () => {
  it('should handle the expected behavior', () => {
    const result = someFunction(input)
    expect(result).toBe(expectedOutput)
  })

  it('should handle edge cases', () => {
    expect(() => someFunction(null)).toThrow()
  })
})
```

### Example: Adding a Frontend Test

```typescript
// table-clay-storefront/__tests__/lib/feature.test.ts
describe('Feature Name', () => {
  it('should return correct value', () => {
    const result = featureFunction(input)
    expect(result).toEqual(expectedOutput)
  })
})
```

See `Docs/add-testing.md` for complete testing documentation.

---

## Notes for Development

- The `packages/` directory contains Medusa core source - reference only, don't modify
- All customizations go in `table-clay-store/src/` and `table-clay-storefront/src/`
- Use the Admin Dashboard for product/order management
- The storefront uses App Router (Next.js 15) with server components
- i18n is pre-configured for French and Spanish (add more in admin customizations)

---

*Last updated: January 2025*
*Medusa Version: 2.12.3*
