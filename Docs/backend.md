# Table Clay Backend Documentation

## Overview

The Table Clay backend is a **Medusa.js v2.12.3** e-commerce engine deployed to **Railway** with PostgreSQL and Redis databases. It includes several custom modules for product bundles, reviews, FAQs, newsletter subscriptions, and store settings.

---

## Production URLs

| Service | URL | Status |
|---------|-----|--------|
| Backend API | https://tableclay-production.up.railway.app | LIVE |
| Admin Dashboard | https://tableclay-production.up.railway.app/app | LIVE |
| Health Check | https://tableclay-production.up.railway.app/health | LIVE |
| Stripe Webhook | https://tableclay-production.up.railway.app/hooks/payment/stripe | ACTIVE |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Railway                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────┐        │
│  │              Medusa Backend (Port 8080)            │        │
│  │                                                    │        │
│  │  ┌─────────────────────────────────────────────┐  │        │
│  │  │           Core Medusa Modules               │  │        │
│  │  │  • Payment (Stripe)                         │  │        │
│  │  │  • Event Bus (Redis)                        │  │        │
│  │  │  • File Storage (S3)                        │  │        │
│  │  │  • Notifications (SendGrid)                 │  │        │
│  │  └─────────────────────────────────────────────┘  │        │
│  │                                                    │        │
│  │  ┌─────────────────────────────────────────────┐  │        │
│  │  │         Custom Table Clay Modules           │  │        │
│  │  │  • Bundle Module (product bundles)          │  │        │
│  │  │  • Content Module (reviews, FAQs)           │  │        │
│  │  │  • Newsletter Module (subscribers)          │  │        │
│  │  │  • Store Settings Module (configuration)    │  │        │
│  │  └─────────────────────────────────────────────┘  │        │
│  └────────────────────────────────────────────────────┘        │
│                          │                                      │
│           ┌──────────────┴──────────────┐                      │
│           ▼                             ▼                       │
│     ┌──────────┐                 ┌──────────┐                  │
│     │ Postgres │                 │  Redis   │                  │
│     │ Database │                 │  Cache   │                  │
│     └──────────┘                 └──────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Custom Modules

### 1. Bundle Module (`bundleModuleService`)

**Purpose:** Multi-product bundles with fixed pricing and bundle discounts

**Models:**
- `Bundle` - name, description, pricing_type, fixed_original_price, fixed_sale_price, badge, is_active
- `BundleItem` - bundle_id, product_id, variant_id, quantity, product_title, variant_title

**Key Features:**
- Bundles can contain items from ANY product (not limited to single product)
- Fixed pricing model with original/sale prices
- Badge support (bestseller, popular, new, limited, sale)
- Bundles appear on all product pages where their items exist

---

### 2. Content Module (`contentModuleService`)

**Purpose:** Admin-curated product reviews and FAQs

**Models:**
- `Review` - product_id, customer_name, rating, title, content, is_verified_buyer, is_active, display_date
- `ReviewImage` - review_id, url, alt_text, sort_order
- `ProductReviewStats` - product_id, average_rating, total_count, rating distribution
- `FAQ` - product_id (nullable for global), question, answer, sort_order, is_active

**Key Features:**
- Admin manually creates/edits reviews (curated, not customer-submitted)
- Reviews support up to 5 images with alt text and drag-drop reordering
- FAQs can be global (product_id = null) or product-specific
- Review stats are set by admin (not calculated from reviews)

---

### 3. Newsletter Module (`newsletterModuleService`)

**Purpose:** Email newsletter subscriptions with discount code rewards

**Models:**
- `Subscriber` - email, first_name, source, discount_code, discount_code_sent, status

**Key Features:**
- Generates unique free shipping discount code per subscriber
- Creates Medusa Promotion for each discount code
- Emits `newsletter.subscribed` event for welcome email
- Tracks subscription source (popup, footer, checkout)

---

### 4. Store Settings Module (`storeSettingsModuleService`)

**Purpose:** Global configuration for storefront features

**Models:**
- `StoreSetting` - key, value (JSON), updated_at

**Key Features:**
- Bundle promo settings (headline, subtext, badge text)
- Flexible key-value storage for any setting type

---

## API Endpoints

### Store API (Publishable Key Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/store/bundles?product_id=xxx` | List bundles containing a product |
| POST | `/store/cart/add-bundle` | Add bundle to cart |
| DELETE | `/store/cart/add-bundle` | Remove bundle from cart |
| GET | `/store/reviews?product_id=xxx` | Get reviews for a product |
| GET | `/store/faqs?product_id=xxx` | Get FAQs for a product |
| POST | `/store/newsletter/subscribe` | Subscribe to newsletter |
| GET | `/store/newsletter/unsubscribe` | Unsubscribe from newsletter |
| GET | `/store/settings` | Get bundle promo settings |
| GET | `/store/address-autocomplete?input=xxx` | Get address suggestions (Google Places) |
| GET | `/store/address-autocomplete/details?place_id=xxx` | Get structured address from place_id |
| GET | `/store/cart/:id/tip` | Get tip amount |
| POST | `/store/cart/:id/tip` | Add tip to cart |
| DELETE | `/store/cart/:id/tip` | Remove tip from cart |

### Admin API (JWT Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/bundles` | List all bundles |
| POST | `/admin/bundles` | Create bundle |
| GET | `/admin/bundles/:id` | Get bundle details |
| PUT | `/admin/bundles/:id` | Update bundle |
| DELETE | `/admin/bundles/:id` | Delete bundle |
| POST | `/admin/bundles/:id/items` | Add item to bundle |
| PUT | `/admin/bundles/:id/items/:itemId` | Update bundle item |
| DELETE | `/admin/bundles/:id/items/:itemId` | Remove item from bundle |
| GET | `/admin/reviews` | List all reviews |
| POST | `/admin/reviews` | Create review |
| GET | `/admin/reviews/:id` | Get review details |
| PUT | `/admin/reviews/:id` | Update review (supports `product_id` changes) |
| DELETE | `/admin/reviews/:id` | Delete review |
| GET | `/admin/reviews/stats` | Get review statistics |
| GET | `/admin/reviews/product-stats` | Get per-product stats |
| GET | `/admin/faqs` | List all FAQs |
| POST | `/admin/faqs` | Create FAQ |
| GET | `/admin/faqs/:id` | Get FAQ details |
| PUT | `/admin/faqs/:id` | Update FAQ |
| DELETE | `/admin/faqs/:id` | Delete FAQ |
| GET | `/admin/newsletter` | List subscribers |
| GET | `/admin/newsletter/stats` | Get newsletter stats |
| GET | `/admin/newsletter/export` | Export subscribers CSV |
| GET | `/admin/settings` | Get all settings |
| PUT | `/admin/settings/:key` | Update setting |

---

## Admin Dashboard Extensions

Custom admin UI pages under `/app`:

| Route | Description |
|-------|-------------|
| `/app/bundles` | Bundle management list |
| `/app/bundles/new` | Create new bundle |
| `/app/bundles/:id` | Edit bundle |
| `/app/reviews` | Review management list |
| `/app/reviews/new` | Create new review (with image upload) |
| `/app/reviews/:id` | Edit review (with image management) |
| `/app/faqs` | FAQ management list |
| `/app/faqs/new` | Create new FAQ |
| `/app/faqs/:id` | Edit FAQ |
| `/app/newsletter` | Newsletter subscriber list |
| `/app/settings` | Store settings (bundle promo) |

### Reusable Admin Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ImageUploader` | `src/admin/components/image-uploader/` | Drag-drop image upload with reordering, alt text, S3 integration |

**ImageUploader Features:**
- Drag-drop file upload to `/admin/uploads` (S3)
- Image preview thumbnails
- Editable alt text per image
- Drag-drop reordering
- Configurable max images limit (default: 5)

---

## Configuration (medusa-config.ts)

```typescript
modules: [
  // Redis Event Bus (production)
  { resolve: "@medusajs/medusa/event-bus-redis" },

  // Stripe Payment Provider
  { resolve: "@medusajs/medusa/payment" },

  // S3 File Storage (conditional)
  { resolve: "@medusajs/medusa/file" },

  // SendGrid Email Notifications
  { resolve: "@medusajs/medusa/notification" },

  // Custom Modules
  { resolve: "./src/modules/newsletter" },
  { resolve: "./src/modules/bundle" },
  { resolve: "./src/modules/content" },
  { resolve: "./src/modules/store-settings" },
]
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `STORE_CORS` | Allowed storefront origins |
| `ADMIN_CORS` | Allowed admin dashboard origins |
| `AUTH_CORS` | Allowed authentication origins |
| `JWT_SECRET` | JWT signing secret |
| `COOKIE_SECRET` | Cookie encryption secret |
| `STRIPE_API_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `S3_ACCESS_KEY_ID` | AWS S3 access key |
| `S3_SECRET_ACCESS_KEY` | AWS S3 secret key |
| `S3_BUCKET` | S3 bucket name |
| `S3_REGION` | AWS region |
| `S3_FILE_URL` | S3 file URL base |
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_FROM` | SendGrid sender email |
| `GOOGLE_PLACES_API_KEY` | Google Places API key (for address autocomplete) |

---

## Key API Usage Examples

### Adding a Bundle to Cart

```typescript
// POST /store/cart/add-bundle
{
  "cart_id": "cart_xxx",
  "bundle_id": "bundle_yyy"
}

// Response
{
  "success": true,
  "bundle_name": "Starter Set",
  "bundle_instance_id": "bundle_yyy_1704067200000",
  "items_added": 3,
  "bundle_pricing": {
    "original_price": 12000,  // cents
    "sale_price": 9999,
    "savings": 2001,
    "savings_percent": 16
  }
}
```

### Subscribing to Newsletter

```typescript
// POST /store/newsletter/subscribe
{
  "email": "customer@example.com",
  "first_name": "John",
  "source": "popup"
}

// Response
{
  "success": true,
  "message": "Welcome! Check your email for your free shipping code.",
  "subscriber": {
    "id": "sub_xxx",
    "email": "customer@example.com",
    "discount_code": "FREESHIP-ABC123",
    "is_new": true
  }
}
```

### Address Autocomplete

```typescript
// GET /store/address-autocomplete?input=123%20main
{
  "success": true,
  "suggestions": [
    {
      "place_id": "ChIJN5s4fz8ttokRRTs6z_7qzRg",
      "description": "123 Main Street, Gaithersburg, MD, USA",
      "structured": {
        "main_text": "123 Main Street",
        "secondary_text": "Gaithersburg, MD, USA"
      }
    }
  ]
}

// GET /store/address-autocomplete/details?place_id=ChIJN5s4fz8ttokRRTs6z_7qzRg
{
  "success": true,
  "address": {
    "street_number": "123",
    "route": "Main Street",
    "address_1": "123 Main Street",
    "address_2": "",
    "city": "Gaithersburg",
    "state": "MD",
    "postal_code": "20878",
    "country": "United States",
    "country_code": "us",
    "formatted_address": "123 Main St, Gaithersburg, MD 20878, USA"
  }
}
```

### Getting Product Reviews

```typescript
// GET /store/reviews?product_id=prod_xxx

// Response
{
  "reviews": [
    {
      "id": "rev_xxx",
      "customer_name": "Sarah M.",
      "is_verified_buyer": true,
      "rating": 5,
      "title": "Beautiful craftsmanship",
      "content": "Absolutely love this piece...",
      "helpful_count": 12,
      "display_date": "2024-12-15",
      "images": []
    }
  ],
  "stats": {
    "average_rating": 4.8,
    "total_count": 47,
    "rating_5_count": 35,
    "rating_4_count": 10,
    "rating_3_count": 2,
    "rating_2_count": 0,
    "rating_1_count": 0
  }
}
```

---

## Deployment

### Standard Deployment (via GitHub)

1. Make changes to `table-clay-store/`
2. Run `./scripts/validate.sh all` (required before push)
3. Commit and push to `develop` branch
4. Railway auto-deploys from GitHub

### Manual Commands

```bash
# Check deployment status
mcp__Railway__list-deployments

# View deploy logs
mcp__Railway__get-logs --logType deploy

# View build logs
mcp__Railway__get-logs --logType build

# SSH into Railway container
railway ssh -- <command>

# Create admin user
railway ssh -- yarn medusa user -e email@example.com -p password

# Run database migrations
railway ssh -- yarn medusa db:migrate
```

---

## Admin Dashboard Currency Fix

The admin dashboard uses `patch-package` to fix price display issues (Medusa stores amounts in cents but the dashboard was displaying them as dollars).

**Patch file:** `patches/@medusajs+dashboard+2.12.3.patch`

**Files patched:**
- `dist/chunk-X6BAAGCL.mjs` - `getLocaleAmount()`, `getStylizedAmount()`
- `dist/chunk-WATKBUHQ.mjs` - `formatCurrency()`

The patch divides amounts by `10^decimalDigits` before formatting, correctly converting 3499 cents to $34.99.

---

## Database Tables (Custom)

### Bundle Tables
- `bundle` - Main bundle records
- `bundle_item` - Items within bundles

### Content Tables
- `review` - Product reviews
- `review_image` - Review images
- `product_review_stats` - Per-product review statistics
- `faq` - FAQs (global and product-specific)

### Newsletter Tables
- `subscriber` - Newsletter subscribers

### Settings Tables
- `store_setting` - Key-value configuration

---

## Seeded Data

| Data | Value |
|------|-------|
| Store Name | Table Clay |
| Currency | USD |
| Region | United States |
| Tax Region | US |
| Stock Location | Table Clay Studio (Portland) |
| Shipping | Standard Shipping - $8.00 flat (5-7 days) |

---

*Last updated: January 5, 2026*
*Medusa Version: 2.12.3*
*Status: PRODUCTION READY*

---

## Recent Changes

| Date | Change |
|------|--------|
| Jan 5, 2026 | Admin review updates now allow switching the associated product |
| Jan 4, 2026 | Added Google Places API integration (address autocomplete endpoints) |
| Jan 2, 2026 | Added configurable bundle headline setting to Store Settings |
| Jan 2, 2026 | Added FAQ admin pages (new/edit routes) |
| Jan 2, 2026 | Added review image upload with alt text support |
| Jan 2, 2026 | Created reusable ImageUploader admin component |
