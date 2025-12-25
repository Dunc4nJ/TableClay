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

// Collections for the dropdown menu
const COLLECTIONS = [
  { label: "Cloud Line", href: "/collections/cloud-line" },
  { label: "Modern Line", href: "/collections/modern-line" },
  { label: "Japanese Line", href: "/collections/japanese-line" },
  { label: "Love Line", href: "/collections/love-line" },
  { label: "Nature Line", href: "/collections/nature-line" },
  { label: "Odd & Ends", href: "/collections/no-line" },
]

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-28 mx-auto border-b duration-200 bg-cream-100 border-cream-300">
        <nav className="content-container flex items-center justify-between w-full h-full">
          {/* Mobile menu (left side on mobile) */}
          <div className="flex-1 basis-0 h-full flex items-center small:hidden">
            <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
          </div>

          {/* Desktop navigation links (left side) */}
          <div className="hidden small:flex items-center gap-x-8 h-full flex-1 basis-0">
            <LocalizedClientLink
              href="/store"
              className="text-stone-600 hover:text-brand-600 uppercase text-sm tracking-wider font-medium transition-colors"
              data-testid="nav-shop-link"
            >
              Shop All
            </LocalizedClientLink>
            <NavDropdown label="Collections" items={COLLECTIONS} />
            <LocalizedClientLink
              href="/categories/mugs"
              className="text-stone-600 hover:text-brand-600 uppercase text-sm tracking-wider font-medium transition-colors"
            >
              Mugs
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/categories/vases"
              className="text-stone-600 hover:text-brand-600 uppercase text-sm tracking-wider font-medium transition-colors"
            >
              Vases
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/categories/bowls"
              className="text-stone-600 hover:text-brand-600 uppercase text-sm tracking-wider font-medium transition-colors"
            >
              Bowls
            </LocalizedClientLink>
          </div>

          {/* Logo (center) */}
          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="flex items-center hover:opacity-90 transition-opacity"
              data-testid="nav-store-link"
            >
              <Image
                src="/images/logo/table-clay-logo.jpeg"
                alt="Table Clay - Handmade Pottery"
                width={100}
                height={100}
                className="rounded-full object-cover"
                priority
              />
            </LocalizedClientLink>
          </div>

          {/* Right side: Account & Cart */}
          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="text-stone-600 hover:text-brand-600 uppercase text-sm tracking-wider font-medium transition-colors"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="text-stone-600 hover:text-brand-600 flex gap-2 uppercase text-sm tracking-wider font-medium transition-colors"
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
