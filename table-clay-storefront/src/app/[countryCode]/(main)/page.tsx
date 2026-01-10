import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import CollectionShowcases from "@modules/home/components/collection-showcases"
import CategoryNavigation from "@modules/home/components/category-navigation"
import { listCollections } from "@lib/data/collections"
import { listCategories } from "@lib/data/categories"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Table Clay | Handcrafted Pottery & Ceramics",
  description:
    "Discover our collection of handcrafted ceramic mugs, bowls, vases, and more. Each piece is made by hand with care. Shop Cloud Collection, Modern Collection, Japanese Collection, and more.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params

  const region = await getRegion(countryCode)

  const [{ collections }, categories] = await Promise.all([
    listCollections({
      fields: "id, handle, title",
    }),
    listCategories(),
  ])

  if (!region) {
    return null
  }

  return (
    <>
      {/* Hero Banner */}
      <Hero />

      {/* Section Intro - Visual break between hero and collections */}
      <section className="bg-cream-100 py-16 sm:py-20">
        <div className="content-container text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-stone-800 mb-4">
            Explore Our Collections
          </h2>
          <p className="text-stone-600 max-w-2xl mx-auto text-lg">
            Each collection tells its own story, crafted with intention and care.
            Find the perfect pieces for your home.
          </p>
        </div>
      </section>

      {/* Featured Collections - Split Screen Showcases */}
      {collections && collections.length > 0 && (
        <CollectionShowcases collections={collections} />
      )}

      {/* Shop by Category */}
      {categories && categories.length > 0 && (
        <CategoryNavigation categories={categories} />
      )}
    </>
  )
}
