import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Category configuration with images
const CATEGORY_CONFIG: Record<string, { image: string; order: number }> = {
  mugs: {
    image: "/images/categories/mugs.png",
    order: 1,
  },
  vases: {
    image: "/images/categories/vases.png",
    order: 2,
  },
  bowls: {
    image: "/images/categories/bowls.png",
    order: 3,
  },
  "odd-and-ends": {
    image: "/images/categories/odd-and-ends.png",
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
    <section className="w-full bg-cream-100 py-12 small:py-16">
      <div className="content-container">
        {/* Category Grid - 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 small:grid-cols-4 gap-4 small:gap-6">
          {displayCategories.map((category) => {
            const config = CATEGORY_CONFIG[category.handle || ""]
            return (
              <LocalizedClientLink
                key={category.id}
                href={`/categories/${category.handle}`}
                className="group"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  {/* Category Image */}
                  <Image
                    src={config?.image || "/images/placeholder.png"}
                    alt={category.name || "Category"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                  />

                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                  {/* Category Name - Centered at Bottom */}
                  <div className="absolute inset-0 flex items-end justify-center pb-6 small:pb-8">
                    <h3
                      className="font-display text-xl small:text-2xl text-white text-center px-4"
                      style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
                    >
                      {category.name}
                    </h3>
                  </div>
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
