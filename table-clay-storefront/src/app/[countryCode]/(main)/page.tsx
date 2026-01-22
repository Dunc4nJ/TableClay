import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import PotteryWheelHero from "@modules/home/components/pottery-wheel-hero"
import CollectionShowcases from "@modules/home/components/collection-showcases"
import CategoryNavigation from "@modules/home/components/category-navigation"
import ReviewsShowcase from "@modules/home/components/reviews-showcase"
import { listCollections } from "@lib/data/collections"
import { listCategories } from "@lib/data/categories"
import { getFeaturedReviews } from "@lib/data/reviews"
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

  const [{ collections }, categories, featuredReviews] = await Promise.all([
    listCollections({
      fields: "id, handle, title",
    }),
    listCategories(),
    getFeaturedReviews(),
  ])

  if (!region) {
    return null
  }

  return (
    <>
      {/* Hero Banner */}
      <Hero />

      {/* Section Intro - Visual break between hero and collections */}
      <section className="bg-cream-100 py-8 sm:py-10">
        <div className="content-container text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-ui-fg-base mb-4">
            Explore Our Collections
          </h2>
          <p className="text-ui-fg-subtle max-w-2xl mx-auto text-lg">
            Each collection tells its own story, crafted with intention and care.
            Find the perfect pieces for your home.
          </p>
        </div>
      </section>

      <PotteryWheelHero />

      {/* Featured Collections - Split Screen Showcases */}
      {collections && collections.length > 0 && (
        <CollectionShowcases collections={collections} />
      )}

      {featuredReviews.reviews.length > 0 && (
        <ReviewsShowcase reviews={featuredReviews.reviews} />
      )}

      {/* Shop by Category */}
      {categories && categories.length > 0 && (
        <CategoryNavigation categories={categories} />
      )}
    </>
  )
}
