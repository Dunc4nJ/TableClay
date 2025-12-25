import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Category configuration with icons (using simple SVG paths)
const CATEGORY_CONFIG: Record<
  string,
  { icon: string; description: string; order: number }
> = {
  vases: {
    icon: "M12 2C10.5 2 9 3.5 9 5v3c0 1.5-1 3-2 4v7c0 1.5 1.5 3 5 3s5-1.5 5-3v-7c-1-1-2-2.5-2-4V5c0-1.5-1.5-3-3-3z",
    description: "Decorative vases for flowers and display",
    order: 1,
  },
  mugs: {
    icon: "M4 6h12v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm14 2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2V8zM6 2h8v4H6V2z",
    description: "Handcrafted ceramic mugs and cups",
    order: 2,
  },
  bowls: {
    icon: "M2 12a10 10 0 0120 0c0 3-4 6-10 6s-10-3-10-6zm2 0c0 1.5 3.5 4 8 4s8-2.5 8-4",
    description: "Artisan bowls for serving and dining",
    order: 3,
  },
  "odd-and-ends": {
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    description: "Unique accessories and specialty items",
    order: 4,
  },
}

interface CategoryNavigationProps {
  categories: HttpTypes.StoreProductCategory[]
}

const CategoryNavigation = ({ categories }: CategoryNavigationProps) => {
  // Filter to only top-level categories and sort by configured order
  const displayCategories = categories
    .filter(
      (cat) =>
        !cat.parent_category && cat.handle && CATEGORY_CONFIG[cat.handle]
    )
    .sort((a, b) => {
      const orderA = CATEGORY_CONFIG[a.handle || ""]?.order || 999
      const orderB = CATEGORY_CONFIG[b.handle || ""]?.order || 999
      return orderA - orderB
    })

  if (displayCategories.length === 0) {
    return null
  }

  return (
    <section className="w-full bg-cream-100 py-16 small:py-20">
      <div className="content-container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl small:text-4xl text-stone-800 mb-3">
            Shop by Category
          </h2>
          <p className="text-stone-500 text-lg">
            Find exactly what you&apos;re looking for
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 small:grid-cols-4 gap-4 small:gap-6">
          {displayCategories.map((category) => {
            const config = CATEGORY_CONFIG[category.handle || ""]
            return (
              <LocalizedClientLink
                key={category.id}
                href={`/categories/${category.handle}`}
                className="group"
              >
                <div className="bg-white border border-cream-300 rounded-lg p-6 small:p-8 text-center transition-all duration-300 hover:border-brand-500 hover:shadow-lg hover:-translate-y-1">
                  {/* Icon */}
                  <div className="w-12 h-12 small:w-16 small:h-16 mx-auto mb-4 text-brand-500 group-hover:text-brand-600 transition-colors">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-full h-full"
                    >
                      <path d={config?.icon} />
                    </svg>
                  </div>

                  {/* Category Name */}
                  <h3 className="font-display text-lg small:text-xl text-stone-800 mb-2 group-hover:text-brand-600 transition-colors">
                    {category.name}
                  </h3>

                  {/* Description */}
                  <p className="text-stone-500 text-sm hidden small:block">
                    {config?.description}
                  </p>
                </div>
              </LocalizedClientLink>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default CategoryNavigation
