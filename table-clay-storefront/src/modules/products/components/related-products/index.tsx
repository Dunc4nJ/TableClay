"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"
import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
  region: HttpTypes.StoreRegion
}

/**
 * RelatedProducts - Client-side component for displaying related products
 *
 * Converted from async Server Component to Client Component to avoid
 * hydration issues with async components in Suspense boundaries.
 */
export default function RelatedProducts({
  product,
  countryCode,
  region,
}: RelatedProductsProps) {
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRelatedProducts() {
      try {
        setIsLoading(true)
        setError(null)

        // Build query params for related products
        const params = new URLSearchParams()
        if (region?.id) {
          params.set("region_id", region.id)
        }
        if (product.collection_id) {
          params.set("collection_id[]", product.collection_id)
        }
        params.set("is_giftcard", "false")
        params.set("limit", "8")

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products?${params.toString()}`,
          {
            headers: {
              "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
            },
            credentials: "include",
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch related products: ${response.status}`)
        }

        const data = await response.json()

        // Filter out current product and limit to 4
        const filteredProducts = (data.products || [])
          .filter((p: HttpTypes.StoreProduct) => p.id !== product.id)
          .slice(0, 4)

        setProducts(filteredProducts)
      } catch (err) {
        console.error("Error fetching related products:", err)
        setError(err instanceof Error ? err.message : "Failed to load related products")
      } finally {
        setIsLoading(false)
      }
    }

    if (product?.id && region?.id) {
      fetchRelatedProducts()
    }
  }, [product.id, product.collection_id, region?.id])

  // Loading state - show skeleton
  if (isLoading) {
    return (
      <section className="bg-cream-50 py-12 lg:py-16">
        <div className="content-container">
          {/* Header skeleton */}
          <div className="text-center mb-10">
            <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mx-auto mb-3" />
            <div className="h-5 w-80 bg-gray-100 animate-pulse rounded mx-auto" />
          </div>
          {/* Products skeleton */}
          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {repeat(4).map((index) => (
              <li key={index}>
                <SkeletonProductPreview />
              </li>
            ))}
          </ul>
        </div>
      </section>
    )
  }

  // Error state - hide section silently
  if (error || products.length === 0) {
    return null
  }

  return (
    <section className="bg-cream-50 py-12 lg:py-16">
      <div className="content-container">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-display font-semibold text-ui-fg-base mb-3">
            Complete Your Collection
          </h2>
          <p className="text-ui-fg-subtle max-w-md mx-auto">
            Handcrafted pieces that pair beautifully together
          </p>
        </div>

        {/* Product grid - 4 columns on desktop, 2 on mobile */}
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((relatedProduct) => (
            <li key={relatedProduct.id}>
              <Product region={region} product={relatedProduct} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
