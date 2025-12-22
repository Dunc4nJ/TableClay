# Table Clay Backend Deployment

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
│  │  Port 9000       │                                   │
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

## Deployment Method

We use a **custom Dockerfile** instead of Nixpacks (deprecated). This gives us full control over the build process.

### Dockerfile (`table-clay-store/Dockerfile`)

```dockerfile
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies
RUN corepack enable && corepack prepare yarn@3.2.1 --activate
RUN yarn install --immutable

# Copy source code and config
COPY . .

# Build the application
RUN yarn build

# Copy admin build to expected location
RUN mkdir -p ./public && cp -r ./.medusa/server/public/admin ./public/admin

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9000/health || exit 1

# Run migrations then start server
CMD ["sh", "-c", "yarn medusa db:migrate && yarn medusa start"]
```

---

## Issues Fixed During Deployment

| Issue | Cause | Fix |
|-------|-------|-----|
| Yarn checksum errors | Railway's `yarn install --check-cache` failed | Used Dockerfile with `yarn install --immutable` |
| `updateFulfillmentProviders` error | Invalid API call in seed.ts | Removed the call - not needed in Medusa v2 |
| Missing `@medusajs/framework/utils` | Multi-stage Dockerfile stripped dev dependencies | Switched to single-stage Dockerfile |
| `relation "notification_provider" does not exist` | Migrations not running | Added `yarn medusa db:migrate` to CMD |
| Admin dashboard 404 | Build outputs to `.medusa/server/public/admin/` but server expects `./public/admin/` | Added `cp -r` step in Dockerfile |
| Redis not connecting | `REDIS_URL` env var not passed to Medusa config | Added `redisUrl: process.env.REDIS_URL` to medusa-config.ts |

---

## Environment Variables (Railway)

These are configured in Railway's dashboard:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (auto-injected by Railway) |
| `REDIS_URL` | Redis connection string (auto-injected by Railway) |
| `STORE_CORS` | Allowed origins for storefront API calls |
| `ADMIN_CORS` | Allowed origins for admin dashboard |
| `AUTH_CORS` | Allowed origins for authentication |
| `JWT_SECRET` | Secret for JWT token signing |
| `COOKIE_SECRET` | Secret for cookie encryption |
| `STRIPE_API_KEY` | Stripe secret key (sk_live_... or sk_test_...) |

---

## Key Configuration Files

### `medusa-config.ts`

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
})
```

---

## API Endpoints

Once deployed, the backend exposes:

| Endpoint | Description |
|----------|-------------|
| `/health` | Health check endpoint |
| `/store/*` | Storefront API (products, cart, checkout) |
| `/admin/*` | Admin API (requires authentication) |
| `/app` | Admin dashboard UI |

---

## Deployment Workflow

1. Push changes to `develop` branch on GitHub
2. Railway auto-deploys from GitHub
3. Docker build runs (~3-5 minutes)
4. Migrations run automatically on container start
5. Medusa server starts on port 9000

---

## Monitoring

- **Railway Dashboard**: View logs, metrics, and deployment status
- **Health Check**: `GET /health` returns 200 when server is ready
- **Logs**: Available in Railway dashboard or via `railway logs`

---

## Next Steps

- [ ] Verify Railway deployment is healthy
- [ ] Get production URL from Railway
- [ ] Configure CORS to allow Vercel frontend domain
- [ ] Set up Stripe webhooks pointing to Railway URL
- [ ] Deploy frontend to Vercel

---

*Last updated: December 2024*
