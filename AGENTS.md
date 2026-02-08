# Table Clay - E-commerce Platform

**Medusa.js v2.12.3** e-commerce platform for handmade pottery.

## Quick Start

```bash
# Backend (localhost:9000)
cd table-clay-store && yarn dev

# Frontend (localhost:8000)
cd table-clay-storefront && yarn dev
```

**Admin**: http://localhost:9000/app | `tableclayy@gmail.com` / `table.clay!`

---

## Environment URLs

| Environment | Frontend | Backend | Git Trigger |
|-------------|----------|---------|-------------|
| **Production** | `tableclay.com` | `tableclay-production.up.railway.app` | Push to `develop` |
| **Staging** | `*.vercel.app` (auto per branch) | `tableclay-staging.up.railway.app` | Push to `staging` (Railway) / any branch (Vercel) |
| **Local** | `localhost:8000` | `localhost:9000` | N/A |

**Staging admin**: `https://tableclay-staging.up.railway.app/app` | `tableclayy@gmail.com`

Stripe is in **test mode** on staging. All analytics, tracking, and email services are disabled.
See `STAGING.md` for full env var details and setup history.

---

## Development Workflow (REQUIRED)

Every code change follows this sequence. Do not skip steps.

### Step 1: Pick a task

```bash
br ready --json                    # List ready beads (highest priority, no blockers)
bv --robot-priority                # Ranked tasks with impact scores
```

Read the bead specification. Understand acceptance criteria before writing code.

### Step 2: Create a branch

```bash
git checkout develop
git pull origin develop
git checkout -b br-<ID>-<short-description>
```

Branch naming: `br-###-description` (e.g., `br-42-fix-cart-total`).

### Step 3: Implement

Write the code. Stage only files relevant to the current bead.
If unrelated files are modified by other developers, do not stop -- continue with your task.

### Step 4: Validate locally

```bash
./scripts/validate.sh all          # TypeScript + tests + build (both backend and frontend)
./scripts/validate.sh quick        # TypeScript only (fastest, use during iteration)
```

Do NOT push until `validate.sh all` passes.

### Step 5: Push and deploy to staging

The deploy path depends on what changed:

**Frontend-only changes:**
```bash
git push origin br-<ID>-<short-description>
# Vercel auto-creates a preview URL pointing to the staging backend
```

**Backend changes (with or without frontend):**
```bash
# First: deploy backend to staging
git checkout staging
git pull origin staging
git merge br-<ID>-<short-description>
git push origin staging
# Railway auto-deploys to staging

# Then: push feature branch for Vercel preview
git checkout br-<ID>-<short-description>
git push origin br-<ID>-<short-description>
```

### Step 6: Wait for deploys

```bash
./scripts/monitor-deploy.sh        # Polls Railway + Vercel until both succeed
```

Or check manually:
```bash
railway status                     # Railway deployment state
vercel list --cwd table-clay-storefront  # Latest Vercel deployment URL + state
```

### Step 7: Verify on staging

**Backend verification** -- curl the staging API:
```bash
curl -s https://tableclay-staging.up.railway.app/health | jq .
curl -s https://tableclay-staging.up.railway.app/store/products | jq '.products | length'
```

**Frontend verification** -- use agent-browser on the Vercel preview URL:
```bash
agent-browser open <VERCEL_PREVIEW_URL>
agent-browser snapshot -i
# Interact and verify acceptance criteria
agent-browser screenshot screenshots/br-<ID>-<description>.png
agent-browser close
```

If verification fails, fix the issue and repeat from Step 3.

### Step 8: Promote to production

```bash
git checkout develop
git pull origin develop
git merge br-<ID>-<short-description>
git push origin develop
# Railway + Vercel auto-deploy to production
```

Wait for production deploys:
```bash
./scripts/monitor-deploy.sh
```

### Step 9: Production sanity check

```bash
curl -s https://tableclay-production.up.railway.app/health | jq .
agent-browser open https://tableclay.com
agent-browser snapshot -i
agent-browser screenshot screenshots/br-<ID>-production.png
agent-browser close
```

### Step 10: Close the bead

```bash
br close br-<ID> --reason "Verified: <what was confirmed>"
```

**NEVER close a bead until the change is VERIFIED working on production.**
If code is written but unverified, update the bead with "Pending verification" instead.

---

## Staging Environment

### Catalog Refresh

Staging catalog can be refreshed from production at any time:

```bash
python scripts/clone-prod-to-staging.py              # Full clone (all tables)
python scripts/clone-prod-to-staging.py --dry-run     # Preview without changes
python scripts/clone-prod-to-staging.py --tables custom  # Reviews, FAQs, bundles only
python scripts/clone-prod-to-staging.py --tables core    # Products, prices, categories only
```

The script copies products, categories, collections, reviews, FAQs, bundles, community creations, store settings, and sales tracking. Orders, customers, and auth data are NOT cloned. IDs are automatically remapped for staging.

### Stripe Test Cards

Use these on staging/preview checkout:

| Card | Number |
|------|--------|
| Success | `4242 4242 4242 4242` |
| Decline | `4000 0000 0000 0002` |
| 3D Secure | `4000 0025 0000 3155` |

Expiry: any future date. CVC: any 3 digits. ZIP: any 5 digits.

### More Details

See `STAGING.md` for complete env var listings, Railway CLI context warnings, and setup history.

---

## Pre-existing Bugs

When you encounter bugs **unrelated to the current task**:

1. Create a bead: `br create "BUG: <description>" -p 2 --type bug`
2. Do NOT attempt to fix -- it would distract from the current task
3. Document what you observed in the bead description
4. Continue with the original task

---

## Pre-Push Validation (REQUIRED)

```bash
./scripts/validate.sh all          # Full: TypeScript + tests + build (both projects)
./scripts/validate.sh quick        # Quick: TypeScript only
./scripts/validate.sh backend      # Backend only
./scripts/validate.sh frontend     # Frontend only
```

---

## Build Environment (Node vs Bun)

If Bun is installed, its `node` shim can break `npm run build`. This repo includes
`.envrc` to prefer system Node. Run `direnv allow` once, or prefix commands:

```bash
PATH=/usr/bin:$PATH npm run build
```

`./scripts/validate.sh` already enforces system Node internally.

---

## Key Gotchas

### 1. Admin Widget Crashes
**Problem**: Widget crashes with `Cannot read properties of undefined`
**Fix**: Always use optional chaining for widget data:
```typescript
// Bad
const productId = data.product.id

// Good
const productId = data?.product?.id
if (!productId) return null
```

### 2. CORS Errors
**Problem**: `www.tableclay.com` and `tableclay.com` are different origins
**Fix**: Include BOTH in Railway env vars:
```
STORE_CORS=https://tableclay.com,https://www.tableclay.com
AUTH_CORS=https://tableclay.com,https://www.tableclay.com
```

### 3. React Hydration Errors (#419)
**Problem**: Async Server Components in Suspense cause permanent loading states
**Fix**: Use Client Components with `useEffect` instead:
```typescript
"use client"
function Component() {
  const [data, setData] = useState([])
  useEffect(() => { fetch(...).then(setData) }, [])
  return <List data={data} />
}
```

### 4. Stale Data / Caching
**Problem**: Data not updating after backend changes
**Fix**: Use `revalidate` instead of `force-cache`:
```typescript
return sdk.client.fetch("/store/collections", {
  next: { revalidate: 60 }
})
```

### 5. Random Selection Returns Same Results
**Fix**: Disable caching for random selections:
```typescript
fetch(url, { cache: "no-store" })
```

---

## API Reference

| API | Auth | Example |
|-----|------|---------|
| Store (`/store/*`) | Publishable Key header | `/store/products` |
| Admin (`/admin/*`) | JWT Bearer Token | `/admin/products` |

**Admin API with Python** (preferred over curl):
```python
import urllib.request, json

# 1. Get token
auth_data = json.dumps({'email': 'tableclayy@gmail.com', 'password': 'Table.clay!'}).encode()
req = urllib.request.Request('https://tableclay-production.up.railway.app/auth/user/emailpass',
                              data=auth_data, headers={'Content-Type': 'application/json'})
token = json.loads(urllib.request.urlopen(req).read())['token']

# 2. Use token
req = urllib.request.Request('https://tableclay-production.up.railway.app/admin/products',
                              headers={'Authorization': f'Bearer {token}'})
print(json.loads(urllib.request.urlopen(req).read()))
```

---

## Project Structure

```
TableClay/
├── table-clay-store/           # Backend (Medusa v2)
│   ├── src/api/                # Custom API routes
│   ├── src/admin/widgets/      # Admin dashboard widgets
│   └── src/modules/            # Custom modules
├── table-clay-storefront/      # Frontend (Next.js 15)
│   ├── src/app/                # App router pages
│   ├── src/modules/            # UI components
│   └── src/lib/data/           # Data fetching
├── scripts/                    # Automation scripts
│   ├── validate.sh             # Pre-push validation
│   ├── monitor-deploy.sh       # Deploy polling
│   └── clone-prod-to-staging.py # Catalog sync
├── Docs/                       # Documentation
│   ├── backend.md              # API, modules, admin widgets
│   ├── frontend.md             # Pages, components, data fetching
│   └── incident-playbook.md    # Operational recovery runbooks
├── STAGING.md                  # Staging env setup and details
└── AGENTS.md                   # This file (symlinked to CLAUDE.md)
```

---

## Testing

```bash
# Backend unit tests
cd table-clay-store && TEST_TYPE=unit yarn test:unit

# Frontend tests
cd table-clay-storefront && yarn test
```

---

## Resources

- [Medusa Docs](https://docs.medusajs.com)
- [Next.js Docs](https://nextjs.org/docs)
- `Docs/backend.md` -- Backend API endpoints, modules, admin widgets, env vars
- `Docs/frontend.md` -- Frontend pages, components, styling, data fetching
- `Docs/incident-playbook.md` -- Operational incident recovery steps
- `STAGING.md` -- Full staging environment details and env var reference

*Last updated: February 2026*
