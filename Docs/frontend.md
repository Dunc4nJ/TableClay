# Table Clay Storefront - Frontend Documentation

## Current State (December 2024)

The Table Clay storefront is a Next.js 15 application with custom components for showcasing handmade pottery. The design uses a warm, earthy color palette with cream backgrounds and terracotta accents.

---

## Live URLs

| Environment | URL |
|-------------|-----|
| Production | https://table-clay-storefront.vercel.app |
| Preview (develop) | https://table-clay-storefront-git-develop-duncan-jurmans-projects.vercel.app |

---

## Design System

### Color Palette

Defined in `tailwind.config.js`:

```javascript
colors: {
  cream: {
    50: '#FFFDF7',
    100: '#FDF8E8',   // Light cream - section backgrounds
    200: '#F5EED6',   // Warm cream - card backgrounds
  },
  brand: {
    500: '#C4A484',   // Terracotta - primary buttons
    600: '#B08968',   // Darker terracotta - hover states
  },
}
```

### Typography

- **Display Font:** `font-display` - Serif font for headings (Playfair Display or similar)
- **Body Font:** Default sans-serif for body text

### Component Styling Patterns

- Rounded corners: `rounded-2xl` for cards, `rounded-lg` for buttons
- Shadows: `shadow-md` default, `shadow-xl` on hover
- Transitions: `transition-all duration-300`
- Hover effects: `hover:scale-105` for cards

---

## Homepage Structure

Location: `src/app/[countryCode]/(main)/page.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│                        Navigation                            │
│  Logo | Shop (dropdown) | Collections | About | Cart        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                     Hero Banner                              │
│              (Full-width pottery image)                      │
│                   "Shop Now" button                          │
│                                                              │
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
└─────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Hero Banner
- Location: `src/modules/home/components/hero/index.tsx`
- Full-width image with overlay text
- "Shop Now" CTA button

### 2. Collection Showcases
- Location: `src/modules/home/components/collection-showcases/index.tsx`
- Alternating left/right layout
- 50/50 split on desktop, stacked on mobile
- Displays 3 featured collections: Cloud Line, Modern Line, Japanese Line

**Data Source:** Fetches from Medusa Store API `/store/collections`

```typescript
// Featured collections (by handle)
const FEATURED_COLLECTIONS = ["cloud-line", "modern-line", "japanese-line"]
```

### 3. Category Navigation
- Location: `src/modules/home/components/category-navigation/index.tsx`
- 4-column grid on desktop, 2 columns on mobile
- Product images as backgrounds with text overlay
- Hover effect: scale + shadow increase

**Configuration:**
```typescript
const CATEGORY_CONFIG = {
  mugs: { image: "/images/categories/mugs.png", order: 1 },
  vases: { image: "/images/categories/vases.png", order: 2 },
  bowls: { image: "/images/categories/bowls.png", order: 3 },
  "odd-and-ends": { image: "/images/categories/odd-and-ends.png", order: 4 },
}
```

**Images Location:** `public/images/categories/`

### 4. Navigation Dropdown
- Location: `src/modules/layout/components/nav-dropdown/index.tsx`
- Mega-menu style dropdown for "Shop"
- Shows categories and collections in columns

### 5. Side Menu (Mobile)
- Location: `src/modules/layout/components/side-menu/index.tsx`
- Accordion-style navigation
- Categories and Collections expandable sections

---

## Data Flow

### Collections
```
Medusa Backend (Railway)
    ↓
/store/collections API
    ↓
src/lib/data/collections.ts (listCollections, getCollectionByHandle)
    ↓
Homepage (CollectionShowcases component)
```

### Categories
```
Medusa Backend (Railway)
    ↓
/store/product-categories API
    ↓
src/lib/data/categories.ts (listCategories, getCategoryByHandle)
    ↓
Homepage (CategoryNavigation component)
Navigation (NavDropdown, SideMenu)
```

---

## Current Collections

| Handle | Name | Description |
|--------|------|-------------|
| cloud-line | Cloud Line | Soft, organic forms inspired by clouds |
| modern-line | Modern Line | Clean, contemporary designs |
| japanese-line | Japanese Line | Minimalist Japanese-inspired pieces |
| love-line | Love Line | Heart-themed romantic pieces |
| nature-line | Nature Line | Nature-inspired organic forms |
| no-line | No Line | One-of-a-kind unique pieces |

## Current Categories

| Handle | Name | Image |
|--------|------|-------|
| mugs | Mugs | Pink Cloud mug |
| vases | Vases | Triple Vase |
| bowls | Bowls | Japanese 7.5" Bowl |
| odd-and-ends | Odd & Ends | Small Round Pots |

---

## Responsive Breakpoints

Following Tailwind defaults:
- `small:` (sm) - 640px+
- `medium:` (md) - 768px+
- `large:` (lg) - 1024px+

**Key responsive behaviors:**
- Collection showcases: Side-by-side on lg+, stacked on mobile
- Category grid: 4 columns on small+, 2 columns on mobile
- Navigation: Full nav on desktop, hamburger menu on mobile

---

## Static Assets

### Images Directory Structure
```
public/
├── images/
│   ├── categories/
│   │   ├── mugs.png
│   │   ├── vases.png
│   │   ├── bowls.png
│   │   └── odd-and-ends.png
│   ├── collections/
│   │   ├── cloud-line.png
│   │   ├── modern-line.png
│   │   └── japanese-line.png
│   └── hero/
│       └── banner.png
```

### Image Sources
Category and collection images sourced from `Assets/Product_Assets/`:
- Mugs: Cloud Line/Pink Cloud
- Vases: Modern Line/Triple Vase
- Bowls: Japanese Line/Japanese 7.5 Inch Bowl
- Odd & Ends: No Line/6 Small Round Pots

---

## Known Issues & TODOs

### Completed
- [x] Collection showcases displaying correctly
- [x] Category navigation with product images
- [x] Caching fix for collections/categories data
- [x] Vercel auto-deploy configuration

### Pending
- [ ] Add collection images to showcase components
- [ ] Hero banner image optimization
- [ ] Footer links and content
- [ ] About page content
- [ ] Product detail page styling
- [ ] Cart and checkout styling
- [ ] Mobile navigation polish

---

## Development Notes

### Adding a New Category
1. Create category in Medusa Admin Dashboard
2. Add image to `public/images/categories/`
3. Update `CATEGORY_CONFIG` in `category-navigation/index.tsx`

### Adding a New Collection
1. Create collection in Medusa Admin Dashboard
2. Add image to `public/images/collections/`
3. Update `COLLECTION_CONFIG` in `collection-showcases/index.tsx`
4. If featured, add handle to `FEATURED_COLLECTIONS` array

### Changing Category/Collection Images
1. Replace image file in `public/images/`
2. Push to develop branch
3. Vercel auto-deploy will update the site

---

*Last updated: December 2024*
