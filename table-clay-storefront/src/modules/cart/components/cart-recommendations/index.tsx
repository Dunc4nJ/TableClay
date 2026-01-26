"use client"

import { useState, useEffect, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import { addToCart } from "@lib/data/cart"
import { useParams, useRouter } from "next/navigation"
import { Spinner } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { Text } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

type CartRecommendationsProps = {
  cart: HttpTypes.StoreCart
  region: HttpTypes.StoreRegion
  showDiscountBadge?: boolean
}

/**
 * CartRecommendations - Curated recommendations for the cart page.
 * Uses /store/products/recommended with exclusions for cart items.
 */
export default function CartRecommendations({
  cart,
  region,
  showDiscountBadge = false,
}: CartRecommendationsProps) {
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingProductId, setAddingProductId] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const countryCode =
    typeof params?.countryCode === "string" ? params.countryCode : ""

  const cartProductIds = useMemo(
    () =>
      (cart.items
        ?.map((item) => item.product_id)
        .filter(Boolean) as string[]) || [],
    [cart.items]
  )

  const preferredCollectionId = useMemo(() => {
    const collectionIds =
      (cart.items
        ?.map((item) => item.product?.collection_id)
        .filter(Boolean) as string[]) || []
    return collectionIds[0] || ""
  }, [cart.items])

  const cartProductIdsKey = useMemo(
    () => cartProductIds.join(","),
    [cartProductIds]
  )

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setIsLoading(true)
        setError(null)

        const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
        const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

        if (!baseUrl) {
          throw new Error("Missing NEXT_PUBLIC_MEDUSA_BACKEND_URL")
        }

        const excludeIds = cartProductIds.join(",")
        const url = new URL(`${baseUrl}/store/products/recommended`)
        url.searchParams.set("region_id", region.id)
        if (preferredCollectionId) {
          url.searchParams.set("collection_id", preferredCollectionId)
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
        console.error("Error fetching cart recommendations:", err)
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load recommendations"
        )
      } finally {
        setIsLoading(false)
      }
    }

    if (cart?.id && region?.id) {
      fetchRecommendations()
    }
  }, [cart?.id, region?.id, preferredCollectionId, cartProductIdsKey])

  // Handle adding product to cart
  const handleAddToCart = async (product: HttpTypes.StoreProduct) => {
    const variant = product.variants?.[0]
    if (!variant?.id || !countryCode) return

    setAddingProductId(product.id)
    try {
      await addToCart({
        variantId: variant.id,
        quantity: 1,
        countryCode,
      })
      router.refresh()
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setAddingProductId(null)
    }
  }

  // Loading state - show 3 skeletons
  if (isLoading) {
    return (
      <section className="bg-cream-50 py-8 lg:py-12 rounded-lg">
        <div className="content-container">
          {/* Header skeleton */}
          <div className="text-center mb-8">
            <div className="h-7 w-56 bg-cream-300 animate-pulse rounded mx-auto mb-2" />
            <div className="h-4 w-72 bg-cream-200 animate-pulse rounded mx-auto" />
          </div>
          {/* Products skeleton - 3 columns */}
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    <section className="bg-cream-50 py-8 lg:py-12 rounded-lg">
      <div className="content-container">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-display font-semibold text-ui-fg-base mb-2">
            Complete Your Collection
          </h2>
          <p className="text-ui-fg-subtle text-sm max-w-md mx-auto">
            Handcrafted pieces that pair beautifully together
          </p>
        </div>

        {/* Product grid - 3 columns */}
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => {
            const { cheapestPrice } = getProductPrice({ product })
            const isAdding = addingProductId === product.id
            const variant = product.variants?.[0]
            const inStock =
              !variant?.manage_inventory ||
              variant?.allow_backorder ||
              (variant?.inventory_quantity || 0) > 0
            const discountedPrice =
              showDiscountBadge && cheapestPrice
                ? convertToLocale({
                    amount: Math.floor(
                      cheapestPrice.calculated_price_number * 0.9
                    ),
                    currency_code: cheapestPrice.currency_code,
                  })
                : null

            return (
              <li key={product.id} className="flex flex-col">
                {/* Product card */}
                <LocalizedClientLink
                  href={`/products/${product.handle}`}
                  className="group flex-1"
                >
                  <div data-testid="product-wrapper">
                    <div className="relative">
                      {showDiscountBadge && (
                        <div
                          className="badge-pulse absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-950 ring-2 ring-amber-200/70 shadow-[0_6px_16px_rgba(245,158,11,0.35)] will-change-transform"
                          style={{
                            background:
                              "linear-gradient(135deg, #fde68a 0%, #fbbf24 45%, #f59e0b 100%)",
                          }}
                        >
                          <span className="relative inline-flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-200 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-50" />
                          </span>
                          <span>10% OFF!</span>
                        </div>
                      )}
                      <Thumbnail
                        thumbnail={product.thumbnail}
                        images={product.images}
                        size="full"
                      />
                    </div>
                    <div className="flex txt-compact-medium mt-4 justify-between">
                      <Text
                        className="text-ui-fg-subtle"
                        data-testid="product-title"
                      >
                        {product.title}
                      </Text>
                      <div className="flex items-center gap-x-2">
                        {cheapestPrice && showDiscountBadge ? (
                          <div className="flex flex-col items-end">
                            <Text
                              className="text-ui-fg-muted line-through text-sm"
                              data-testid="original-price"
                            >
                              {cheapestPrice.calculated_price}
                            </Text>
                            {discountedPrice && (
                              <Text
                                className="text-green-600 font-semibold"
                                data-testid="discounted-price"
                              >
                                {discountedPrice}
                              </Text>
                            )}
                          </div>
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

                {/* Add to Cart button */}
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={isAdding || !inStock}
                  className={`mt-3 w-full h-10 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 ${
                    !inStock
                      ? "bg-ui-bg-subtle text-ui-fg-muted cursor-not-allowed"
                      : "bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow-md"
                  } ${isAdding ? "opacity-90 cursor-wait" : ""}`}
                  data-testid="add-to-cart-button"
                >
                  {isAdding && <Spinner className="h-4 w-4 animate-spin" />}
                  <span>{!inStock ? "Out of Stock" : "Add to Cart"}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
