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

## Production URLs

| Service | URL |
|---------|-----|
| Backend API | https://tableclay-production.up.railway.app |
| Admin Dashboard | https://tableclay-production.up.railway.app/app |
| Storefront | https://tableclay.com |

**Deployment**: Push to `develop` → Railway auto-deploys backend, Vercel auto-deploys frontend.

---

## Pre-Push Validation (REQUIRED)

```bash
./scripts/validate.sh all    # Full validation before any push
./scripts/validate.sh quick  # Quick TypeScript check only
```

---

## Key Gotchas & Fixes

### 1. Admin Widget Crashes
**Problem**: Widget crashes with `Cannot read properties of undefined`
**Fix**: Always use optional chaining for widget data:
```typescript
// ❌ Bad
const productId = data.product.id

// ✅ Good
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
├── table-clay-store/        # Backend (Medusa)
│   ├── src/api/             # Custom API routes
│   ├── src/admin/widgets/   # Admin dashboard widgets
│   └── src/modules/         # Custom modules
├── table-clay-storefront/   # Frontend (Next.js 15)
│   ├── src/app/             # App router pages
│   ├── src/modules/         # UI components
│   └── src/lib/data/        # Data fetching
└── Docs/                    # Additional documentation
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

## After Deploying Changes

Update documentation to reflect current state:
- `Docs/backend.md` - API endpoints, modules, admin widgets, env vars
- `Docs/frontend.md` - Pages, components, styling, data fetching

---

## Resources

- [Medusa Docs](https://docs.medusajs.com)
- [Next.js Docs](https://nextjs.org/docs)
- See `Docs/backend.md` and `Docs/frontend.md` for detailed documentation

*Last updated: January 2026*
