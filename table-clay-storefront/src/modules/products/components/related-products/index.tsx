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
 * RelatedProducts - Smart selection of 3 related products:
 * 1. Global bestseller (top-selling product)
 * 2. Random product from same collection (if available)
 * 3. Random product from different collection
 *
 * Products refresh randomly on each page load.
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
    async function fetchSmartRelatedProducts() {
      try {
        setIsLoading(true)
        setError(null)

        const results: HttpTypes.StoreProduct[] = []
        const usedIds = new Set([product.id])
        const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
        const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

        // Helper to fetch products
        const fetchProducts = async (params: URLSearchParams): Promise<HttpTypes.StoreProduct[]> => {
          params.set("region_id", region.id)
          params.set("is_giftcard", "false")
          params.set("fields", "*variants.calculated_price,+variants.inventory_quantity,*variants.images")

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

        // 2. SAME COLLECTION RANDOM - Get a random product from current product's collection
        if (product.collection_id) {
          const sameCollectionParams = new URLSearchParams()
          sameCollectionParams.set("collection_id[]", product.collection_id)
          sameCollectionParams.set("limit", "50")

          const sameCollectionProducts = await fetchProducts(sameCollectionParams)
          const eligibleSameCollection = sameCollectionProducts.filter(
            (p) => !usedIds.has(p.id)
          )

          if (eligibleSameCollection.length > 0) {
            const randomIndex = Math.floor(Math.random() * eligibleSameCollection.length)
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
          (p) => !usedIds.has(p.id) && p.collection_id !== product.collection_id
        )

        if (differentCollectionProducts.length > 0) {
          const randomIndex = Math.floor(Math.random() * differentCollectionProducts.length)
          const randomProduct = differentCollectionProducts[randomIndex]
          results.push(randomProduct)
          usedIds.add(randomProduct.id)
        }

        // 4. FALLBACK - Fill remaining slots with any available products
        const remainingProducts = allProducts.filter((p) => !usedIds.has(p.id))

        while (results.length < 3 && remainingProducts.length > 0) {
          const randomIndex = Math.floor(Math.random() * remainingProducts.length)
          const randomProduct = remainingProducts.splice(randomIndex, 1)[0]
          results.push(randomProduct)
          usedIds.add(randomProduct.id)
        }

        setProducts(results.slice(0, 3))
      } catch (err) {
        console.error("Error fetching related products:", err)
        setError(err instanceof Error ? err.message : "Failed to load related products")
      } finally {
        setIsLoading(false)
      }
    }

    if (product?.id && region?.id) {
      fetchSmartRelatedProducts()
    }
  }, [product.id, product.collection_id, region?.id])

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
