"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { addToCart } from "@lib/data/cart"
import { useParams, useRouter } from "next/navigation"
import { Spinner } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { Text } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

type CartRecommendationsProps = {
  cart: HttpTypes.StoreCart
  region: HttpTypes.StoreRegion
}

/**
 * CartRecommendations - Smart selection of 3 recommended products for the cart page:
 * 1. Global bestseller (top-selling product)
 * 2. Random product from same collection as cart items (if available)
 * 3. Random product from different collection
 *
 * Products refresh randomly on each page load.
 * Excludes products already in the cart.
 */
export default function CartRecommendations({
  cart,
  region,
}: CartRecommendationsProps) {
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingProductId, setAddingProductId] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const countryCode =
    typeof params?.countryCode === "string" ? params.countryCode : ""

  // Get collection IDs from cart items
  const cartCollectionIds = cart.items
    ?.map((item) => item.product?.collection_id)
    .filter(Boolean) as string[]

  // Get product IDs already in cart (to exclude from recommendations)
  const cartProductIds = cart.items
    ?.map((item) => item.product_id)
    .filter(Boolean) as string[]

  useEffect(() => {
    async function fetchCartRecommendations() {
      try {
        setIsLoading(true)
        setError(null)

        const results: HttpTypes.StoreProduct[] = []
        const usedIds = new Set(cartProductIds || [])
        const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
        const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

        // Helper to fetch products
        const fetchProducts = async (
          params: URLSearchParams
        ): Promise<HttpTypes.StoreProduct[]> => {
          params.set("region_id", region.id)
          params.set("is_giftcard", "false")
          params.set(
            "fields",
            "*variants.calculated_price,+variants.inventory_quantity,*variants.images"
          )

          const response = await fetch(
            `${baseUrl}/store/products?${params.toString()}`,
            {
              headers: { "x-publishable-api-key": apiKey },
              credentials: "include",
              cache: "no-store", // Disable caching for random selection
            }
          )

          if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status}`)
          }

          const data = await response.json()
          return data.products || []
        }

        // 1. GLOBAL BESTSELLER - Try to get the top-selling product
        try {
          const bestsellerResponse = await fetch(
            `${baseUrl}/store/products/bestseller?region_id=${region.id}`,
            {
              headers: { "x-publishable-api-key": apiKey },
              credentials: "include",
              // Bestseller can be cached for 5 minutes (acceptable staleness)
              next: { revalidate: 300 },
            }
          )

          if (bestsellerResponse.ok) {
            const data = await bestsellerResponse.json()
            if (data.product && !usedIds.has(data.product.id)) {
              results.push(data.product)
              usedIds.add(data.product.id)
            }
          }
        } catch (e) {
          // Bestseller endpoint may not exist yet, continue silently
          console.debug("Bestseller endpoint not available, using fallback")
        }

        // 2. SAME COLLECTION RANDOM - Get a random product from cart items' collections
        if (cartCollectionIds && cartCollectionIds.length > 0) {
          // Pick a random collection from the cart items
          const randomCollectionId =
            cartCollectionIds[
              Math.floor(Math.random() * cartCollectionIds.length)
            ]

          const sameCollectionParams = new URLSearchParams()
          sameCollectionParams.set("collection_id[]", randomCollectionId)
          sameCollectionParams.set("limit", "50")

          const sameCollectionProducts = await fetchProducts(
            sameCollectionParams
          )
          const eligibleSameCollection = sameCollectionProducts.filter(
            (p) => !usedIds.has(p.id)
          )

          if (eligibleSameCollection.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * eligibleSameCollection.length
            )
            const randomProduct = eligibleSameCollection[randomIndex]
            results.push(randomProduct)
            usedIds.add(randomProduct.id)
          }
        }

        // 3. DIFFERENT COLLECTION RANDOM - Get a random product from any other collection
        const allProductsParams = new URLSearchParams()
        allProductsParams.set("limit", "100")

        const allProducts = await fetchProducts(allProductsParams)

        // Filter for products from different collections
        const differentCollectionProducts = allProducts.filter(
          (p) =>
            !usedIds.has(p.id) &&
            (!cartCollectionIds ||
              !cartCollectionIds.includes(p.collection_id || ""))
        )

        if (differentCollectionProducts.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * differentCollectionProducts.length
          )
          const randomProduct = differentCollectionProducts[randomIndex]
          results.push(randomProduct)
          usedIds.add(randomProduct.id)
        }

        // 4. FALLBACK - Fill remaining slots with any available products
        const remainingProducts = allProducts.filter((p) => !usedIds.has(p.id))

        while (results.length < 3 && remainingProducts.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * remainingProducts.length
          )
          const randomProduct = remainingProducts.splice(randomIndex, 1)[0]
          results.push(randomProduct)
          usedIds.add(randomProduct.id)
        }

        setProducts(results.slice(0, 3))
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
      fetchCartRecommendations()
    }
  }, [cart?.id, region?.id, JSON.stringify(cartProductIds), JSON.stringify(cartCollectionIds)])

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
      <section className="bg-cream-50 py-8 lg:py-12 rounded-lg mt-6">
        <div className="content-container">
          {/* Header skeleton */}
          <div className="text-center mb-8">
            <div className="h-7 w-56 bg-gray-200 animate-pulse rounded mx-auto mb-2" />
            <div className="h-4 w-72 bg-gray-100 animate-pulse rounded mx-auto" />
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
    <section className="bg-cream-50 py-8 lg:py-12 rounded-lg mt-6">
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

            return (
              <li key={product.id} className="flex flex-col">
                {/* Product card */}
                <LocalizedClientLink
                  href={`/products/${product.handle}`}
                  className="group flex-1"
                >
                  <div data-testid="product-wrapper">
                    <Thumbnail
                      thumbnail={product.thumbnail}
                      images={product.images}
                      size="full"
                    />
                    <div className="flex txt-compact-medium mt-4 justify-between">
                      <Text
                        className="text-ui-fg-subtle"
                        data-testid="product-title"
                      >
                        {product.title}
                      </Text>
                      <div className="flex items-center gap-x-2">
                        {cheapestPrice && (
                          <Text
                            className="text-ui-fg-base font-semibold"
                            data-testid="price"
                          >
                            {cheapestPrice.calculated_price}
                          </Text>
                        )}
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
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
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
