# Table Clay Storefront - Frontend Documentation

## Current State (January 2026)

The Table Clay storefront is a Next.js 15 application with custom components for showcasing handmade pottery. The design uses a warm clay palette inspired by the SendGrid email templates, with cream backgrounds, espresso text, and terracotta accents.

**Latest Update:** Added static pages for About, Care Guide, and Shipping & Returns, plus a full warm theme pass across storefront surfaces and typography.

---

## Live URLs

| Environment | URL |
|-------------|-----|
| Production | https://tableclay.com |
| Preview (develop) | https://table-clay-storefront-git-develop-duncan-jurmans-projects.vercel.app |
| Store Page | https://tableclay.com/us/store |

---

## Local Development Notes

- If `yarn dev` fails with `Cannot resolve '@floating-ui/react/utils'`, reinstall dependencies:

```bash
rm -rf table-clay-storefront/node_modules
yarn install
```

---

## Design System

### Color Palette

Defined in `table-clay-storefront/tailwind.config.js` and CSS tokens in `table-clay-storefront/src/styles/globals.css`:

```javascript
colors: {
  brand: {
    500: "#8b4513", // Primary clay brown
    600: "#7a3c11", // Hover
    700: "#5c2e0c",
    900: "#2c1810"
  },
  cream: {
    100: "#fbf7f2",
    200: "#f5f0e8",
    300: "#eadfd2",
    400: "#dccbb9"
  }
}
```

### Typography

- **Display Font:** `font-display` - Cormorant Garamond for headings
- **Body Font:** Outfit for body text
- **Navigation:** Uppercase, tracking-wider, font-medium

### Component Styling Patterns

- Rounded corners: `rounded-2xl` for cards, `rounded-lg` for buttons
- Shadows: `shadow-md` default, `shadow-xl` on hover
- Transitions: `transition-all duration-300`
- Hover effects: `hover:scale-105` for cards
- Logo: 140px circular, breaks out of header with shadow-md

---

## Homepage Structure

Location: `src/app/[countryCode]/(main)/page.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│                     Sticky Navigation                        │
│  [Side Menu] | [Shop All] [Collections▼] [Mugs] [Vases]     │
│                        [LOGO]                                │
│                 [Bowls] | [Account] [Cart]                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                     Hero Banner                              │
│              (Full-width pottery image)                      │
│                   "Shop Now" button                          │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                  Section Intro                               │
│          "Discover our handmade pottery..."                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                  Collection Showcase 1                       │
│         [Image 50%]  |  [Text + CTA 50%]                    │
│          Cloud Line Collection                               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                  Collection Showcase 2                       │
│         [Text + CTA 50%]  |  [Image 50%]                    │
│          Modern Line Collection (alternating)                │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                  Collection Showcase 3                       │
│         [Image 50%]  |  [Text + CTA 50%]                    │
│          Japanese Line Collection                            │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                 Category Navigation                          │
│    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐             │
│    │  Mugs  │ │ Vases  │ │ Bowls  │ │Odd&Ends│             │
│    │ (img)  │ │ (img)  │ │ (img)  │ │ (img)  │             │
│    └────────┘ └────────┘ └────────┘ └────────┘             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                        Footer                                │
│     Shop All | Collections | About | Contact                 │
│              All 6 collection links                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Navigation Bar
- Location: `src/modules/layout/templates/nav/index.tsx`
- Sticky header with breakout logo design (140px circular)
- Desktop: Full navigation with Collections dropdown
- Mobile: Hamburger side menu

**Navigation Links:**
- Shop All → `/store`
- Collections (dropdown) → All 6 collection pages
- Mugs → `/categories/mugs`
- Vases → `/categories/vases`
- Bowls → `/categories/bowls`
- Odds & Ends → `/categories/odd-and-ends`
- Account → `/account`
- Cart → `/cart`

### 2. Hero Banner
- Location: `src/modules/home/components/hero/index.tsx`
- Full-width image with overlay text
- "Shop Now" CTA button

### 3. Collection Showcases
- Location: `src/modules/home/components/collection-showcases/index.tsx`
- Alternating left/right layout
- 50/50 split on desktop, stacked on mobile
- Displays 3 featured collections: Cloud Line, Modern Line, Japanese Line

**Data Source:** Fetches from Medusa Store API `/store/collections`

```typescript
// Featured collections (by handle)
const FEATURED_COLLECTIONS = ["cloud-line", "modern-line", "japanese-line"]
```

### 4. Category Navigation
- Location: `src/modules/home/components/category-navigation/index.tsx`
- 4-column grid on desktop, 2 columns on mobile
- Product images as backgrounds with text overlay
- Hover effect: scale + shadow increase

### 5. Navigation Dropdown
- Location: `src/modules/layout/components/nav-dropdown/index.tsx`
- Dropdown for "Collections" showing all 6 collection links

### 6. Side Menu (Mobile)
- Location: `src/modules/layout/components/side-menu/index.tsx`
- Accordion-style navigation
- Categories and Collections expandable sections

### 7. Footer
- Location: `src/modules/layout/templates/footer/index.tsx`
- Shop, Collections, Company columns
- All 6 collection links displayed
- Connect links: Instagram `@table.clay`, email `Emily@tableclay.com`

### 8. Product Detail Page (PDP)
- Location: `src/modules/products/templates/index.tsx`
- Reviews section renders the first 3 reviews by default
- If more than 3 reviews exist, a centered "Load more reviews" button reveals 3 more per click
- Review counts and average rating are sourced from ProductReviewStats

### 9. Static Pages
- About: `src/app/[countryCode]/(main)/about/page.tsx`
- Care Guide: `src/app/[countryCode]/(main)/care/page.tsx`
- Shipping & Returns: `src/app/[countryCode]/(main)/shipping/page.tsx`

---

## Data Flow

### Products
```
Medusa Backend (Railway)
    ↓
/store/products API (with region_id)
    ↓
src/lib/data/products.ts (listProducts, listProductsWithSort)
    ↓
Store Page & Product Pages
```

**Featured ordering:** The default storefront sort is "Featured", using `/store/product-order` with new products prepended by `created_at`.

**Caching:** Products and product order revalidate every 60 seconds (ISR)

### Collections
```
Medusa Backend (Railway)
    ↓
/store/collections API
    ↓
src/lib/data/collections.ts (listCollections, getCollectionByHandle)
    ↓
Homepage (CollectionShowcases), Navigation, Footer
```

**Caching:** Collections revalidate every 60 seconds (ISR)

### Categories
```
Medusa Backend (Railway)
    ↓
/store/product-categories API
    ↓
src/lib/data/categories.ts (listCategories, getCategoryByHandle)
    ↓
Homepage (CategoryNavigation), Navigation
```

**Caching:** Categories revalidate every 60 seconds (ISR)

---

## Products (26 Total)

| Product | Collection | Category | Price |
|---------|------------|----------|-------|
| Blue Cloud Mug & Plate | Cloud Line | Mugs | $34.99 |
| Pink Cloud Mug & Plate | Cloud Line | Mugs | $34.99 |
| Big Bow Mug w/ Box | Love Line | Mugs | $39.99 |
| Little Bow Mug | Love Line | Mugs | $34.99 |
| Heart Mug & Plate | Love Line | Mugs | $34.99 |
| Yellow Tulip Mug & Plate | Nature Line | Mugs | $34.99 |
| Flower Mug | Nature Line | Mugs | $22.99 |
| Flower Mug Set (4 Pieces) | Nature Line | Mugs | $59.99 |
| Simple Mug | Modern Line | Mugs | $24.99 |
| Triple Vase Set | Modern Line | Vases | $65.00 |
| Round Circular Vase | Modern Line | Vases | $29.99 |
| Interlinked Vase | Modern Line | Vases | $54.99 |
| Jug Vase | Modern Line | Vases | $24.99 |
| Pitcher Vase | Modern Line | Vases | $55.00 |
| Bow Ramen Bowl with Glass Lid | Love Line | Bowls | $44.99 |
| Flower Bowl | Nature Line | Bowls | $24.99 |
| Japanese 7.5" Bowl | Japanese Line | Bowls | $29.99 |
| Polka Dot Bowl | No Line | Bowls | $24.99 |
| Vintage Painted Bowl | No Line | Bowls | $24.99 |
| Ceramic Toothpick Holder | Japanese Line | Odd & Ends | $14.99 |
| Toothpick Holder with Cover | Japanese Line | Odd & Ends | $19.99 |
| Japanese Spice Holder | Japanese Line | Odd & Ends | $24.99 |
| Leaf Jewelry Holder with Bird | Nature Line | Odd & Ends | $24.99 |
| Ceramic Ash Tray | Modern Line | Odd & Ends | $24.99 |
| Mini Ceramic Pots Set (6 Pieces) | No Line | Vases | $44.99 |
| CloudLine Mug & Saucer Set | Cloud Line | Mugs | $0.35* |

*Legacy product from initial setup

---

## Collections (6 Total)

| Handle | Name | Description | Products |
|--------|------|-------------|----------|
| cloud-line | Cloud Line | Soft, dreamy cloud-inspired ceramics | 3 |
| love-line | Love Line | Romantic bow and heart-themed pieces | 4 |
| nature-line | Nature Line | Floral and nature-inspired ceramics | 5 |
| japanese-line | Japanese Line | Minimalist Japanese-inspired pieces | 4 |
| modern-line | Modern Line | Clean, contemporary designs | 7 |
| no-line | Artisan Originals | Unique one-of-a-kind pieces | 3 |

**Collection Metadata:**
Collections have metadata stored in Medusa with:
- `imageUrl`: S3 URL for collection hero image
- `description`: Collection description text
- `order`: Display order (1-6)

---

## Categories (4 Total)

| Handle | Name | Image | Products |
|--------|------|-------|----------|
| mugs | Mugs | Pink Cloud mug | 9 |
| vases | Vases | Triple Vase | 6 |
| bowls | Bowls | Japanese 7.5" Bowl | 5 |
| odd-and-ends | Odd & Ends | Small Round Pots | 6 |

**Notes:**
- Odds & Ends is a category; legacy `/collections/no-line` links redirect to `/categories/odd-and-ends`.

---

## Image Storage

### S3 Bucket Structure (tableclay-images)

Product images are stored in AWS S3:

```
s3://tableclay-images/
├── products/
│   ├── cloud-line/
│   │   ├── blue-cloud-mug/
│   │   │   ├── hero.png
│   │   │   ├── angle-1.png through angle-6.png
│   │   └── pink-cloud-mug/
│   │       ├── hero.png
│   │       └── angle-1.png through angle-6.png
│   ├── love-line/
│   │   ├── big-bow-mug/ (6 images)
│   │   ├── little-bow-mug/ (3 images)
│   │   ├── bow-ramen-bowl/ (1 image)
│   │   └── heart-mug/ (1 image)
│   ├── nature-line/
│   │   ├── yellow-tulip-mug/
│   │   ├── flower-mug/
│   │   ├── flower-mug-set/
│   │   ├── flower-bowl/
│   │   └── leaf-jewelry-holder/
│   ├── japanese-line/
│   │   ├── toothpick-holder/ (2 images)
│   │   ├── toothpick-shell/ (2 images)
│   │   ├── spice-jar/
│   │   └── japanese-bowl/
│   ├── modern-line/
│   │   ├── triple-vase/
│   │   ├── round-vase/
│   │   ├── interlinked-vase/
│   │   ├── jug-vase/
│   │   ├── pitcher-vase/
│   │   ├── simple-mug/
│   │   └── ash-tray/
│   └── no-line/
│       ├── polka-dot-bowl/
│       ├── painted-bowl/
│       └── mini-pots-set/
└── collections/
    ├── cloud-line.png
    ├── modern-line.png
    ├── japanese-line.png
    ├── love-line.png
    ├── nature-line.png
    └── no-line.png
```

**S3 Base URL:** `https://tableclay-images.s3.us-east-1.amazonaws.com`

### Local Static Assets

```
public/
├── images/
│   ├── categories/
│   │   ├── mugs.png
│   │   ├── vases.png
│   │   ├── bowls.png
│   │   └── odd-and-ends.png
│   ├── hero/
│   │   └── banner.png
│   └── logo/
│       └── table-clay-logo.jpeg
```

---

## Responsive Breakpoints

Following Tailwind defaults:
- `small:` (sm) - 640px+
- `medium:` (md) - 768px+
- `large:` (lg) - 1024px+

**Key responsive behaviors:**
- Logo: 140px on all sizes, breaks out of header
- Collection showcases: Side-by-side on lg+, stacked on mobile
- Category grid: 4 columns on small+, 2 columns on mobile
- Navigation: Full nav on small+, hamburger menu on mobile

---

## Data Fetching & Caching

### ISR Configuration

All data fetching uses Incremental Static Regeneration with 60-second revalidation:

```typescript
// src/lib/data/products.ts
next: {
  ...next,
  revalidate: 60, // Revalidate every 60 seconds
}

// src/lib/data/collections.ts
next: {
  ...cacheOptions,
  revalidate: 60,
}

// src/lib/data/categories.ts
next: {
  ...cacheOptions,
  revalidate: 60,
}
```

This ensures:
- Fast page loads from cached data
- New products/collections appear within 60 seconds
- No manual cache purging needed

---

## API Endpoints Used

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `/store/products` | List products | Publishable Key |
| `/store/products/:id` | Get product detail | Publishable Key |
| `/store/product-order` | Featured product ordering | Publishable Key |
| `/store/collections` | List collections | Publishable Key |
| `/store/collections/:id` | Get collection | Publishable Key |
| `/store/product-categories` | List categories | Publishable Key |
| `/store/regions` | Get regions | Publishable Key |
| `/store/carts` | Cart operations | Publishable Key |

**Important:** Products require `region_id` parameter to get calculated prices.

---

## Known Issues & TODOs

### Completed
- [x] Collection showcases displaying correctly
- [x] Category navigation with product images
- [x] Caching fix for collections/categories/products data
- [x] Vercel auto-deploy configuration
- [x] All 26 products uploaded with S3 images
- [x] 6 collections configured with metadata
- [x] Navigation with all collection links
- [x] Footer with all collection links
- [x] Breakout logo design (140px circular)
- [x] DM Serif Display + DM Sans typography

### Pending
- [ ] Hero banner image optimization
- [ ] About page content
- [ ] Product detail page styling refinements
- [ ] Cart and checkout styling
- [ ] Mobile navigation polish
- [ ] Add more product images (most have 1 AI-generated image)
- [ ] Clean up legacy CloudLine Mug product

---

## Currency & Price Handling

### How Medusa Stores Prices

**Critical:** Medusa stores all monetary amounts in the **smallest currency unit**:
- **USD:** cents (3499 = $34.99)
- **EUR:** cents (2999 = €29.99)
- **JPY:** yen (3499 = ¥3,499) - no subdivision

### Storefront Price Display

The storefront correctly handles this conversion using `convertToLocale()` in `src/lib/util/money.ts`:

```typescript
// Medusa returns: { amount: 3499, currency_code: "usd" }
// convertToLocale divides by 100 for USD → displays "$34.99"
```

**Key files:**
- `src/lib/util/money.ts` - Currency conversion utilities
- `src/lib/util/prices.tsx` - Price formatting components

### Admin Dashboard vs Storefront

| Component | Price Storage | Display Logic |
|-----------|---------------|---------------|
| Medusa API | Cents (3499) | Raw integer |
| Admin Dashboard | Cents (3499) | **Patched** to divide by 10^decimals |
| Storefront | Cents (3499) | Built-in conversion via `convertToLocale()` |

### Why Admin Needed Patching (December 2024)

The admin dashboard's formatting functions had a bug where they didn't convert cents to dollars. This was fixed via `patch-package` on the backend. See `Docs/backend.md` for full details.

**Symptoms of broken admin:**
- Order total shows $4,642.92 instead of $46.43
- Product prices show $3,499.00 instead of $34.99

**If you see this again:** The patch may not have been applied. Check:
1. `patches/@medusajs+dashboard+2.12.3.patch` exists
2. `yarn install` ran successfully with patch-package postinstall

---

## Development Notes

### Adding a New Product
1. Upload images to S3: `s3://tableclay-images/products/{collection}/{product}/`
2. Create product in Medusa Admin Dashboard
3. Assign collection and category
4. Set pricing (in cents, e.g., 3499 = $34.99)
5. Product appears on storefront within 60 seconds

### Adding a New Collection
1. Create collection in Medusa Admin Dashboard
2. Upload collection image to S3: `s3://tableclay-images/collections/{handle}.png`
3. Set metadata via Admin API:
   ```json
   {
     "metadata": {
       "imageUrl": "https://tableclay-images.s3.us-east-1.amazonaws.com/collections/{handle}.png",
       "description": "Collection description",
       "order": 7
     }
   }
   ```
4. Add to nav dropdown in `src/modules/layout/templates/nav/index.tsx`
5. Add to footer in `src/modules/layout/templates/footer/index.tsx`

### Adding a New Category
1. Create category in Medusa Admin Dashboard
2. Add image to `public/images/categories/`
3. Update `CATEGORY_CONFIG` in `category-navigation/index.tsx`

### Triggering a Redeploy
```bash
git add .
git commit -m "feat: Your changes"
git push origin develop
# Vercel auto-deploys from develop branch
```

---

## Environment Variables

Required in Vercel:

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://tableclay-production.up.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_a96d80b2210dda0c4d9eee3651311348ecf8c6329713ec7f021972390bdbb4b5
NEXT_PUBLIC_BASE_URL=https://table-clay-storefront.vercel.app
NEXT_PUBLIC_DEFAULT_REGION=us
NEXT_PUBLIC_OMNISEND_BRAND_ID=your_omnisend_brand_id
```

**Vercel env vars (required):**
- `NEXT_PUBLIC_OMNISEND_BRAND_ID`

---

## Recent Changes

| Date | Change |
|------|--------|
| Jan 16, 2026 | Odds & Ends now routes to category with legacy `/collections/no-line` redirect |
| Jan 2, 2026 | Added configurable bundle headline via store settings API |
| Jan 2, 2026 | Fixed bundle items display to show product names instead of variant names |
| Dec 30, 2024 | Initial documentation created |

---

*Last updated: January 16, 2026*
