import { listCategories } from "@lib/data/categories"
import { Text } from "@medusajs/ui"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Collections for the footer (Odds & Ends links to the category page)
const COLLECTIONS = [
  { label: "Cloud Collection", href: "/collections/cloud-line" },
  { label: "Modern Collection", href: "/collections/modern-line" },
  { label: "Japanese Collection", href: "/collections/japanese-line" },
  { label: "Love Collection", href: "/collections/love-line" },
  { label: "Nature Collection", href: "/collections/nature-line" },
  { label: "Odd & Ends", href: "/categories/odd-and-ends" },
]

export default async function Footer() {
  const productCategories = await listCategories()

  return (
    <footer className="border-t border-cream-300 w-full bg-cream-100">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-8 xsmall:flex-row items-start justify-between py-16">
          {/* Logo and tagline */}
          <div className="flex flex-col gap-4">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-3"
            >
              <Image
                src="/images/logo/table-clay-logo.jpeg"
                alt="Table Clay"
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
            </LocalizedClientLink>
            <p className="text-ui-fg-muted text-sm max-w-xs">
              Made by hand, made with care. Each piece of pottery is crafted with love in our studio.
            </p>
          </div>

          {/* Navigation links */}
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-4">
            {/* Collections */}
            <div className="flex flex-col gap-y-3">
              <span className="text-sm font-medium text-ui-fg-base uppercase tracking-wider">
                Collections
              </span>
              <ul className="grid grid-cols-1 gap-2">
                {COLLECTIONS.map((collection) => (
                  <li key={collection.href}>
                    <LocalizedClientLink
                      className="text-ui-fg-muted hover:text-brand-600 text-sm transition-colors"
                      href={collection.href}
                    >
                      {collection.label}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shop categories */}
            {productCategories && productCategories?.length > 0 && (
              <div className="flex flex-col gap-y-3">
                <span className="text-sm font-medium text-ui-fg-base uppercase tracking-wider">
                  Categories
                </span>
                <ul className="grid grid-cols-1 gap-2" data-testid="footer-categories">
                  {productCategories?.slice(0, 6).map((c) => {
                    if (c.parent_category) {
                      return null
                    }
                    return (
                      <li key={c.id}>
                        <LocalizedClientLink
                          className="text-ui-fg-muted hover:text-brand-600 text-sm transition-colors"
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                      </li>
                    )
                  })}
                  <li>
                    <LocalizedClientLink
                      className="text-ui-fg-muted hover:text-brand-600 text-sm transition-colors"
                      href="/store"
                    >
                      All Products
                    </LocalizedClientLink>
                  </li>
                </ul>
              </div>
            )}

            {/* About section */}
            <div className="flex flex-col gap-y-3">
              <span className="text-sm font-medium text-ui-fg-base uppercase tracking-wider">
                About
              </span>
              <ul className="grid grid-cols-1 gap-y-2">
                <li>
                  <LocalizedClientLink
                    className="text-ui-fg-muted hover:text-brand-600 text-sm transition-colors"
                    href="/about"
                  >
                    Our Story
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="text-ui-fg-muted hover:text-brand-600 text-sm transition-colors"
                    href="/care"
                  >
                    Care Guide
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="text-ui-fg-muted hover:text-brand-600 text-sm transition-colors"
                    href="/shipping"
                  >
                    Shipping & Returns
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>

            {/* Connect section */}
            <div className="flex flex-col gap-y-3">
              <span className="text-sm font-medium text-ui-fg-base uppercase tracking-wider">
                Connect
              </span>
              <ul className="grid grid-cols-1 gap-y-2">
                <li>
                  <a
                    href="https://instagram.com/table.clay"
                    target="_blank"
                    rel="noreferrer"
                    className="text-ui-fg-muted hover:text-brand-600 text-sm transition-colors"
                  >
                    @table.clay
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:Emily@tableclay.com"
                    className="text-ui-fg-muted hover:text-brand-600 text-sm transition-colors"
                  >
                    Emily@tableclay.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex w-full py-6 justify-between items-center border-t border-cream-300">
          <Text className="text-ui-fg-muted text-xs">
            © {new Date().getFullYear()} Table Clay. Made by hand, made with care.
          </Text>
        </div>
      </div>
    </footer>
  )
}
