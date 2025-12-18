# TableClay E-commerce Platform Overview

## What We've Built

This project is a fully functional e-commerce platform built on **Medusa.js**, a modular, open-source commerce engine. The setup includes:

- **Medusa Backend** - Headless commerce API
- **Admin Dashboard** - React-based store management interface
- **Next.js Storefront** - Customer-facing shopping experience
- **PostgreSQL Database** - Persistent data storage

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         TableClay                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  Admin Dashboard │    │  Next.js Store   │                   │
│  │  localhost:9000  │    │  localhost:8000  │                   │
│  │    /app          │    │                  │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           └───────────┬───────────┘                              │
│                       ▼                                          │
│           ┌──────────────────────┐                               │
│           │   Medusa Backend     │                               │
│           │   localhost:9000     │                               │
│           │   /store, /admin API │                               │
│           └──────────┬───────────┘                               │
│                      │                                           │
│                      ▼                                           │
│           ┌──────────────────────┐                               │
│           │  PostgreSQL Database │                               │
│           │   my-medusa-store    │                               │
│           └──────────────────────┘                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
TableClay/
├── my-medusa-store/           # Medusa Backend
│   ├── medusa-config.ts       # Main configuration
│   ├── src/
│   │   ├── api/               # Custom API routes
│   │   ├── modules/           # Custom modules
│   │   ├── workflows/         # Custom workflows
│   │   └── subscribers/       # Event subscribers
│   └── package.json
│
├── my-medusa-store-storefront/ # Next.js Storefront
│   ├── src/
│   │   ├── app/               # Next.js app router
│   │   ├── modules/           # UI components
│   │   └── lib/               # Utilities & config
│   ├── .env.local             # Environment variables
│   └── package.json
│
└── packages/                   # Medusa Core (reference)
    ├── admin/                  # Admin dashboard source
    ├── core/                   # Core packages
    ├── modules/                # Commerce modules
    └── medusa/                 # Main medusa package
```

---

## Running the Services

### Prerequisites
- Node.js 18+
- PostgreSQL 15
- npm or yarn

### Start the Medusa Backend

```bash
cd my-medusa-store
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
yarn dev
```

The backend runs at: **http://localhost:9000**

### Start the Storefront

```bash
cd my-medusa-store-storefront
npm run dev
```

The storefront runs at: **http://localhost:8000**

---

## Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Admin Dashboard** | http://localhost:9000/app | Store management |
| **Store API** | http://localhost:9000/store | Customer-facing API |
| **Admin API** | http://localhost:9000/admin | Admin API endpoints |
| **Storefront** | http://localhost:8000 | Customer shopping |

---

## Admin Credentials

```
Email:    tableclayy@gmail.com
Password: table.clay!
```

---

## Database

- **Type:** PostgreSQL 15
- **Database Name:** my-medusa-store
- **Connection:** localhost:5432

### Accessing the Database

```bash
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
psql my-medusa-store
```

---

## Current Demo Products

The store is seeded with 4 demo products:

| Product | Variants | Price |
|---------|----------|-------|
| Medusa Sweatshirt | 4 | €10.00 |
| Medusa T-Shirt | 8 | €10.00 |
| Medusa Sweatpants | 4 | €10.00 |
| Medusa Shorts | 4 | €10.00 |

---

## Environment Variables

### Medusa Backend (`my-medusa-store/.env`)

```env
DATABASE_URL=postgres://localhost/my-medusa-store
```

### Storefront (`my-medusa-store-storefront/.env.local`)

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_80d3d293b61a3c8d1d8ce8cb38f8d2e3a0457b191c3ae1c8486c813cf4f40c64
NEXT_PUBLIC_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_REGION=dk
```

---

## Next Steps

### 1. Add Your Own Products
Navigate to the Admin Dashboard and:
- Go to **Products** → **Create**
- Add product name, description, images
- Configure variants (sizes, colors)
- Set pricing per region
- Publish the product

### 2. Configure Stripe Payments
To accept real payments:

1. Get Stripe API keys from https://dashboard.stripe.com
2. Add to `my-medusa-store/medusa-config.ts`:

```typescript
{
  resolve: "@medusajs/medusa/payment-stripe",
  options: {
    apiKey: process.env.STRIPE_API_KEY,
  },
}
```

3. Add to `.env`:
```env
STRIPE_API_KEY=sk_test_...
```

4. Enable Stripe in Admin Dashboard under **Settings** → **Regions** → **Payment Providers**

### 3. Configure Regions & Shipping
- Set up regions for your target markets
- Configure shipping options and rates
- Add tax configurations

### 4. Customize the Storefront
The Next.js storefront can be customized:
- Update branding in `src/modules/layout`
- Modify product pages in `src/app/[countryCode]/(main)/products`
- Change colors in `tailwind.config.js`

### 5. Deploy to Production
For production deployment:

**Backend:**
- Deploy to Railway, Render, or DigitalOcean
- Use managed PostgreSQL (Supabase, Neon, or Railway)
- Set `NODE_ENV=production`

**Storefront:**
- Deploy to Vercel (recommended for Next.js)
- Update `NEXT_PUBLIC_MEDUSA_BACKEND_URL` to production URL

---

## Useful Commands

```bash
# Medusa Backend
cd my-medusa-store
yarn dev                    # Start development server
yarn build                  # Build for production
yarn medusa db:migrate      # Run database migrations
yarn medusa user -e admin@example.com -p password  # Create admin user

# Storefront
cd my-medusa-store-storefront
npm run dev                 # Start development server
npm run build               # Build for production
npm start                   # Start production server
```

---

## Resources

- [Medusa Documentation](https://docs.medusajs.com)
- [Medusa Admin Guide](https://docs.medusajs.com/user-guide)
- [Next.js Storefront Template](https://docs.medusajs.com/resources/nextjs-starter)
- [Stripe Integration Guide](https://docs.medusajs.com/resources/commerce-modules/payment/payment-provider/stripe)


