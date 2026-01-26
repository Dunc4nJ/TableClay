"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { Text } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  cartProductIds?: string[]
  showDiscountBadge?: boolean
}

/**
 * RelatedProducts - Fetches curated recommendations for a product detail page.
 */
export default function RelatedProducts({
  product,
  region,
  cartProductIds,
  showDiscountBadge = false,
}: RelatedProductsProps) {
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cartProductIdsKey = (cartProductIds || []).join(",")

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setIsLoading(true)
        setError(null)

        const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
        const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

        if (!baseUrl) {
          throw new Error("Missing backend URL")
        }

        const excludeIds = [product.id, ...(cartProductIds || [])]
          .filter(Boolean)
          .filter((value, index, array) => array.indexOf(value) === index)
          .join(",")

        const url = new URL(`${baseUrl}/store/products/recommended`)
        url.searchParams.set("region_id", region.id)
        if (product.collection_id) {
          url.searchParams.set("collection_id", product.collection_id)
        }
        if (excludeIds) {
          url.searchParams.set("exclude_product_ids", excludeIds)
        }

        const response = await fetch(url.toString(), {
          headers: { "x-publishable-api-key": apiKey },
          credentials: "include",
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch recommendations: ${response.status}`)
        }

        const data = await response.json()
        setProducts(data.products || [])
      } catch (err) {
        console.error("Error fetching related products:", err)
        setError(
          err instanceof Error ? err.message : "Failed to load recommendations"
        )
      } finally {
        setIsLoading(false)
      }
    }

    if (product?.id && region?.id) {
      fetchRecommendations()
    }
  }, [product?.id, product?.collection_id, region?.id, cartProductIdsKey])

  // Loading state - show 3 skeletons
  if (isLoading) {
    return (
      <section className="bg-cream-50 py-12 lg:py-16">
        <div className="content-container">
          {/* Header skeleton */}
          <div className="text-center mb-10">
            <div className="h-8 w-64 bg-cream-300 animate-pulse rounded mx-auto mb-3" />
            <div className="h-5 w-80 bg-cream-200 animate-pulse rounded mx-auto" />
          </div>
          {/* Products skeleton - 3 columns */}
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {repeat(3).map((index) => (
              <li key={index}>
                <SkeletonProductPreview />
              </li>
            ))}
          </ul>
        </div>
      </section>
    )
  }

  // Error state or no products - hide section silently
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

        {/* Product grid - 3 columns centered */}
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {products.map((relatedProduct) => {
            const { cheapestPrice } = getProductPrice({ product: relatedProduct })
            const showDiscount = Boolean(showDiscountBadge && cheapestPrice)
            const discountedAmount = showDiscount
              ? Math.floor(cheapestPrice!.calculated_price_number * 0.9)
              : null

            return (
              <li key={relatedProduct.id} className="flex flex-col">
                <LocalizedClientLink
                  href={`/products/${relatedProduct.handle}`}
                  className="group flex-1"
                >
                  <div data-testid="product-wrapper" className="relative">
                    {showDiscountBadge && (
                      <div
                        className="absolute top-2 left-2 z-10 px-2 py-1 text-xs font-bold text-black rounded shadow-lg"
                        style={{
                          background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                          boxShadow: "0 0 12px rgba(251, 191, 36, 0.6)",
                          animation:
                            "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                        }}
                      >
                        10% OFF
                      </div>
                    )}
                    <Thumbnail
                      thumbnail={relatedProduct.thumbnail}
                      images={relatedProduct.images}
                      size="full"
                    />
                    <div className="flex txt-compact-medium mt-4 justify-between">
                      <Text
                        className="text-ui-fg-subtle"
                        data-testid="product-title"
                      >
                        {relatedProduct.title}
                      </Text>
                      <div className="flex flex-col items-end gap-1">
                        {cheapestPrice && showDiscount ? (
                          <>
                            <Text
                              className="text-ui-fg-muted line-through text-sm"
                              data-testid="original-price"
                            >
                              {cheapestPrice.calculated_price}
                            </Text>
                            <Text
                              className="text-green-600 font-semibold"
                              data-testid="discounted-price"
                            >
                              {convertToLocale({
                                amount: discountedAmount || 0,
                                currency_code: cheapestPrice.currency_code,
                              })}
                            </Text>
                          </>
                        ) : cheapestPrice ? (
                          <Text
                            className="text-ui-fg-base font-semibold"
                            data-testid="price"
                          >
                            {cheapestPrice.calculated_price}
                          </Text>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </LocalizedClientLink>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
