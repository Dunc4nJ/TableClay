 Table Clay Frontend Redesign Plan

 Overview

 Transform the Medusa template into a branded Table Clay pottery storefront with:
 - 3 featured collections on homepage (Cloud, Modern, Japanese)
 - 4 product categories (Vases, Mugs, Bowls, Odd & Ends)
 - Split-screen collection showcases with alternating layouts
 - Easy image updates via Medusa Admin Dashboard

 ---
 Phase 1: Medusa Admin Setup (Manual)

 1.1 Create Collections

 In Admin Dashboard (localhost:9000/app > Settings > Collections):

 | Collection    | Handle        | Description                                                     |
 |---------------|---------------|-----------------------------------------------------------------|
 | Cloud Line    | cloud-line    | Whimsical cloud-shaped ceramics in sky blue and sunset pink     |
 | Modern Line   | modern-line   | Sleek, contemporary vases and functional art pieces             |
 | Japanese Line | japanese-line | Traditional Japanese-inspired tableware and accessories         |
 | Love Line     | love-line     | Romantic designs featuring bows, hearts, and love motifs        |
 | Nature Line   | nature-line   | Organic forms inspired by flowers, leaves, and natural elements |
 | No Line       | no-line       | Eclectic pieces that transcend collection boundaries            |

 1.2 Create Categories

 In Admin Dashboard (Settings > Product Categories):

 | Category   | Handle       | Description                              |
 |------------|--------------|------------------------------------------|
 | Vases      | vases        | Decorative vases for flowers and display |
 | Mugs       | mugs         | Handcrafted ceramic mugs and cups        |
 | Bowls      | bowls        | Artisan bowls for serving and dining     |
 | Odd & Ends | odd-and-ends | Unique accessories and specialty items   |

 ---
 Phase 2: Static Assets Setup

 2.1 Create Directory Structure

 table-clay-storefront/public/images/
 ├── hero/
 │   └── banner.png           # Copy from Assets/Website Assets/Home Page/Banner.png
 ├── collections/
 │   ├── cloud-line.png       # Copy from Collection_Images/Cloud_Line_Collection.png
 │   ├── modern-line.png      # Copy from Collection_Images/Modern_Line_Collection (1).png
 │   └── japanese-line.png    # Copy from Collection_Images/Japanese_Collection_1.png
 └── logo/
     └── logo-badge.jpg       # Already exists or copy Table_Clay_Logo.jpeg

 ---
 Phase 3: Homepage Components (NEW FILES)

 3.1 CollectionShowcase Component

 File: src/modules/home/components/collection-showcase/index.tsx

 Reusable split-screen collection display:
 - Props: collection, imageUrl, imagePosition ('left' | 'right'), ctaText
 - Desktop: 50/50 split layout
 - Mobile: Stacked (image on top)
 - Styling: bg-cream-200, font-display for titles, bg-brand-500 CTA button

 3.2 CollectionShowcases Container

 File: src/modules/home/components/collection-showcases/index.tsx

 Fetches 3 featured collections, renders with alternating layout:
 1. Cloud Line: Image LEFT, text RIGHT
 2. Modern Line: Text LEFT, image RIGHT
 3. Japanese Line: Image LEFT, text RIGHT

 3.3 CategoryNavigation Component

 File: src/modules/home/components/category-navigation/index.tsx

 Grid of 4 category cards below collections:
 - "Shop by Category" header
 - 4-column grid (desktop), 2-column (mobile)
 - Links to /categories/[handle]

 ---
 Phase 4: Homepage Update

 File: src/app/[countryCode]/(main)/page.tsx

 Update structure:
 <Hero />                      // Updated banner image
 <CollectionShowcases />       // NEW: 3 featured collections
 <CategoryNavigation />        // NEW: 4 category cards

 File: src/modules/home/components/hero/index.tsx
 - Update image path to /images/hero/banner.png

 ---
 Phase 5: Navigation Updates

 5.1 Desktop Nav Dropdown

 NEW File: src/modules/layout/components/nav-dropdown/index.tsx

 Dropdown menu component for collections hover menu.

 5.2 Update Nav

 File: src/modules/layout/templates/nav/index.tsx

 New structure:
 - Collections (dropdown with all 6 collections)
 - Mugs, Bowls, Vases (direct category links)
 - About

 5.3 Update Mobile Side Menu

 File: src/modules/layout/components/side-menu/index.tsx

 Add collections and categories sections with proper hierarchy.

 5.4 Update Footer

 File: src/modules/layout/templates/footer/index.tsx

 Add "Collections" column alongside existing "Shop" column.

 ---
 Phase 6: Product Entry (Manual via Admin)

 Enter products in order of asset completeness:

 1. Cloud Line (59 images ready)
   - Blue Cloud, Pink Cloud, Duo Set
 2. Love Line (17 images ready)
   - Big Bow, Mini Bows, Heart Mug
 3. Modern Line (7 images - placeholders)
   - Triple Vase, Round Vase, Jug Vase, Pitcher, Interlinked Vases, Ash Tray, Simple Mugs
 4. Japanese Line (6 images - placeholders)
   - Toothpick Holders, Spice Jar, 7.5" Bowl
 5. Nature Line (4 images - placeholders)
   - Flower Bowl, Flower Mugs, Leaf Jewelry Holder, Yellow Flower Mug
 6. No Line (3 images - placeholders)
   - Polka Dot Bowl, 6 Small Pots, VTG Painted Bowls

 For each product:
 - Set Collection (required)
 - Set Category/Categories (required)
 - Upload images from /Assets/Product_Assets/[Line]/[Product]/
 - Images stored in S3, easily replaceable via Admin

 ---
 Implementation Order

 | Step | Task                                 | Files                                                      |
 |------|--------------------------------------|------------------------------------------------------------|
 | 1    | Create collections in Admin          | Manual                                                     |
 | 2    | Create categories in Admin           | Manual                                                     |
 | 3    | Copy static assets to /public        | Bash commands                                              |
 | 4    | Create CollectionShowcase component  | src/modules/home/components/collection-showcase/index.tsx  |
 | 5    | Create CollectionShowcases container | src/modules/home/components/collection-showcases/index.tsx |
 | 6    | Create CategoryNavigation            | src/modules/home/components/category-navigation/index.tsx  |
 | 7    | Update Hero component                | src/modules/home/components/hero/index.tsx                 |
 | 8    | Update Homepage                      | src/app/[countryCode]/(main)/page.tsx                      |
 | 9    | Create NavDropdown                   | src/modules/layout/components/nav-dropdown/index.tsx       |
 | 10   | Update Nav                           | src/modules/layout/templates/nav/index.tsx                 |
 | 11   | Update SideMenu                      | src/modules/layout/components/side-menu/index.tsx          |
 | 12   | Update Footer                        | src/modules/layout/templates/footer/index.tsx              |
 | 13   | Enter products via Admin             | Manual                                                     |

 ---
 Files Summary

 New Files (4)

 - src/modules/home/components/collection-showcase/index.tsx
 - src/modules/home/components/collection-showcases/index.tsx
 - src/modules/home/components/category-navigation/index.tsx
 - src/modules/layout/components/nav-dropdown/index.tsx

 Modified Files (6)

 - src/app/[countryCode]/(main)/page.tsx
 - src/modules/home/components/hero/index.tsx
 - src/modules/layout/templates/nav/index.tsx
 - src/modules/layout/components/side-menu/index.tsx
 - src/modules/layout/templates/footer/index.tsx
 - public/images/ (new assets)

 ---
 Key Technical Notes

 1. Image Updates: All product images managed via Medusa Admin Dashboard, stored in S3. Easy to replace later
  without code changes.
 2. Collections vs Categories: Products belong to ONE collection (their "line") and can have MULTIPLE
 categories (product type like Vases, Mugs).
 3. Existing Data Layer: Use existing listCollections() and listCategories() from /src/lib/data/
 4. Styling: Use existing Tailwind theme - brand-500/600 for CTAs, cream-200 for backgrounds, font-display
 for headings.
 5. Responsive: small: breakpoint (1024px) is the main desktop breakpoint in this codebase.