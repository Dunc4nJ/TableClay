import { Suspense } from "react"
import Image from "next/image"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import NavDropdown from "@modules/layout/components/nav-dropdown"

// Collections for the dropdown menu (Odds & Ends excluded - shown as top nav link instead)
const COLLECTIONS = [
  { label: "Cloud Collection", href: "/collections/cloud-line" },
  { label: "Modern Collection", href: "/collections/modern-line" },
  { label: "Japanese Collection", href: "/collections/japanese-line" },
  { label: "Love Collection", href: "/collections/love-line" },
  { label: "Nature Collection", href: "/collections/nature-line" },
]

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-20 mx-auto border-b duration-200 bg-cream-100 border-cream-300">
        <nav className="content-container flex items-center justify-between w-full h-full">
          {/* Mobile menu (left side on mobile) */}
          <div className="flex-1 basis-0 h-full flex items-center small:hidden">
            <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
          </div>

          {/* Desktop navigation links (left side) */}
          <div className="hidden small:flex items-center gap-x-8 h-full flex-1 basis-0">
            <LocalizedClientLink
              href="/store"
              className="text-ui-fg-subtle hover:text-brand-600 uppercase text-sm tracking-wider font-medium transition-colors"
              data-testid="nav-shop-link"
            >
              Shop All
            </LocalizedClientLink>
            <NavDropdown label="Collections" items={COLLECTIONS} />
            <LocalizedClientLink
              href="/categories/mugs"
              className="text-ui-fg-subtle hover:text-brand-600 uppercase text-sm tracking-wider font-medium transition-colors"
            >
              Mugs
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/categories/vases"
              className="text-ui-fg-subtle hover:text-brand-600 uppercase text-sm tracking-wider font-medium transition-colors"
            >
              Vases
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/categories/bowls"
              className="text-ui-fg-subtle hover:text-brand-600 uppercase text-sm tracking-wider font-medium transition-colors"
            >
              Bowls
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/categories/odd-and-ends"
              className="text-ui-fg-subtle hover:text-brand-600 uppercase text-sm tracking-wider font-medium transition-colors"
            >
              Odds & Ends
            </LocalizedClientLink>
          </div>

          {/* Logo (center) - breaks out of header for prominence */}
          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="flex items-center hover:opacity-90 transition-opacity relative"
              data-testid="nav-store-link"
            >
              <Image
                src="/images/logo/table-clay-logo.jpeg"
                alt="Table Clay - Handmade Pottery"
                width={140}
                height={140}
                className="rounded-full object-cover absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-md"
                priority
              />
              {/* Spacer to maintain layout width */}
              <div className="w-[140px]" />
            </LocalizedClientLink>
          </div>

          {/* Right side: Account & Cart */}
          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="text-ui-fg-subtle hover:text-brand-600 uppercase text-sm tracking-wider font-medium transition-colors"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="text-ui-fg-subtle hover:text-brand-600 flex gap-2 uppercase text-sm tracking-wider font-medium transition-colors"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
