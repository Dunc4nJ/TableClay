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

---

## Resources

- [Medusa Documentation](https://docs.medusajs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Stripe Integration](https://docs.medusajs.com/resources/commerce-modules/payment/payment-provider/stripe)

---

## Notes for Development

- The `packages/` directory contains Medusa core source - reference only, don't modify
- All customizations go in `table-clay-store/src/` and `table-clay-storefront/src/`
- Use the Admin Dashboard for product/order management
- The storefront uses App Router (Next.js 15) with server components
- i18n is pre-configured for French and Spanish (add more in admin customizations)

---

*Last updated: December 2024*
*Medusa Version: 2.12.3*
