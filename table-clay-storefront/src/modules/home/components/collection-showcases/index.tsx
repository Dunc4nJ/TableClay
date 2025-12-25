import { HttpTypes } from "@medusajs/types"
import CollectionShowcase from "@modules/home/components/collection-showcase"

// Fallback configuration for collections (used when metadata is not set)
const FALLBACK_CONFIG: Record<
  string,
  { image: string; description: string; order: number }
> = {
  "cloud-line": {
    image: "/images/collections/cloud-line.png",
    description:
      "Whimsical cloud-shaped ceramics in sky blue and sunset pink. Each piece brings a touch of dreamy elegance to your table.",
    order: 1,
  },
  "modern-line": {
    image: "/images/collections/modern-line.png",
    description:
      "Sleek, contemporary vases and functional art pieces. Clean lines meet artisan craftsmanship.",
    order: 2,
  },
  "japanese-line": {
    image: "/images/collections/japanese-line.png",
    description:
      "Traditional Japanese-inspired tableware and accessories. Timeless designs rooted in centuries of craft.",
    order: 3,
  },
}

// Featured collection handles in display order
const FEATURED_HANDLES = ["cloud-line", "modern-line", "japanese-line"]

interface CollectionShowcasesProps {
  collections: HttpTypes.StoreCollection[]
}

const CollectionShowcases = ({ collections }: CollectionShowcasesProps) => {
  // Filter to only featured collections and maintain the order
  const featuredCollections = FEATURED_HANDLES.map((handle) => {
    const collection = collections.find((c) => c.handle === handle)
    if (!collection) return null

    const fallback = FALLBACK_CONFIG[handle]
    const metadata = collection.metadata as Record<string, unknown> | null

    return {
      ...collection,
      // Priority: metadata.imageUrl > fallback.image
      image: (metadata?.imageUrl as string) || fallback?.image || "/images/collections/default.png",
      // Priority: metadata.description > fallback.description
      description: (metadata?.description as string) || fallback?.description || "",
      // Priority: metadata.order > fallback.order
      order: (metadata?.order as number) || fallback?.order || 99,
    }
  }).filter(Boolean) as (HttpTypes.StoreCollection & {
    image: string
    description: string
    order: number
  })[]

  // Sort by order
  featuredCollections.sort((a, b) => a.order - b.order)

  if (featuredCollections.length === 0) {
    return null
  }

  return (
    <section className="w-full">
      {featuredCollections.map((collection, index) => (
        <CollectionShowcase
          key={collection.id}
          collection={{
            handle: collection.handle || "",
            title: collection.title || "",
            description: collection.description,
          }}
          imageUrl={collection.image}
          imagePosition={index % 2 === 0 ? "left" : "right"}
          ctaText="Explore Collection"
        />
      ))}
    </section>
  )
}

export default CollectionShowcases
