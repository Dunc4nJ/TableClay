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
    "Discover our collection of handcrafted ceramic mugs, bowls, vases, and more. Each piece is made by hand with care. Shop Cloud Line, Modern Line, Japanese Line, and more.",
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
