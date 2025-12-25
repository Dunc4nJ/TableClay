import { listCategories } from "@lib/data/categories"
import { Text } from "@medusajs/ui"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Collections for the footer
const COLLECTIONS = [
  { label: "Cloud Line", href: "/collections/cloud-line" },
  { label: "Modern Line", href: "/collections/modern-line" },
  { label: "Japanese Line", href: "/collections/japanese-line" },
  { label: "Love Line", href: "/collections/love-line" },
  { label: "Nature Line", href: "/collections/nature-line" },
  { label: "Odd & Ends", href: "/collections/no-line" },
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
                width={64}
                height={64}
                className="rounded-full object-cover"
              />
            </LocalizedClientLink>
            <p className="text-stone-500 text-sm max-w-xs">
              Made by hand, made with care. Each piece of pottery is crafted with love in our studio.
            </p>
          </div>

          {/* Navigation links */}
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-4">
            {/* Collections */}
            <div className="flex flex-col gap-y-3">
              <span className="text-sm font-medium text-stone-800 uppercase tracking-wider">
                Collections
              </span>
              <ul className="grid grid-cols-1 gap-2">
                {COLLECTIONS.map((collection) => (
                  <li key={collection.href}>
                    <LocalizedClientLink
                      className="text-stone-500 hover:text-brand-600 text-sm transition-colors"
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
                <span className="text-sm font-medium text-stone-800 uppercase tracking-wider">
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
                          className="text-stone-500 hover:text-brand-600 text-sm transition-colors"
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
                      className="text-stone-500 hover:text-brand-600 text-sm transition-colors"
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
              <span className="text-sm font-medium text-stone-800 uppercase tracking-wider">
                About
              </span>
              <ul className="grid grid-cols-1 gap-y-2">
                <li>
                  <LocalizedClientLink
                    className="text-stone-500 hover:text-brand-600 text-sm transition-colors"
                    href="/about"
                  >
                    Our Story
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="text-stone-500 hover:text-brand-600 text-sm transition-colors"
                    href="/care"
                  >
                    Care Guide
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="text-stone-500 hover:text-brand-600 text-sm transition-colors"
                    href="/shipping"
                  >
                    Shipping & Returns
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>

            {/* Connect section */}
            <div className="flex flex-col gap-y-3">
              <span className="text-sm font-medium text-stone-800 uppercase tracking-wider">
                Connect
              </span>
              <ul className="grid grid-cols-1 gap-y-2">
                <li>
                  <a
                    href="https://instagram.com/tableclay"
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-500 hover:text-brand-600 text-sm transition-colors"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@tableclay.com"
                    className="text-stone-500 hover:text-brand-600 text-sm transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex w-full py-6 justify-between items-center border-t border-cream-300">
          <Text className="text-stone-400 text-xs">
            © {new Date().getFullYear()} Table Clay. Made by hand, made with care.
          </Text>
        </div>
      </div>
    </footer>
  )
}
