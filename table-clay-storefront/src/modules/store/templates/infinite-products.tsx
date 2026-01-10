"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useIntersection } from "@lib/hooks/use-in-view"
import { fetchMoreProducts } from "@lib/data/infinite-products"
import ProductPreview from "@modules/products/components/product-preview"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { HttpTypes } from "@medusajs/types"

const PRODUCT_LIMIT = 12

type InfiniteProductsProps = {
  initialProducts: HttpTypes.StoreProduct[]
  totalCount: number
  sortBy: SortOptions
  countryCode: string
  collectionId?: string
  categoryId?: string
  region: HttpTypes.StoreRegion
}

export default function InfiniteProducts({
  initialProducts,
  totalCount,
  sortBy,
  countryCode,
  collectionId,
  categoryId,
  region,
}: InfiniteProductsProps) {
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>(initialProducts)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialProducts.length < totalCount)
  const [isPending, startTransition] = useTransition()

  // Ref for the sentinel element at the bottom
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isInView = useIntersection(loadMoreRef, "200px")

  // Track current sort to reset on change
  const [currentSort, setCurrentSort] = useState(sortBy)

  // Reset when sortBy changes
  useEffect(() => {
    if (sortBy !== currentSort) {
      setProducts(initialProducts)
      setPage(1)
      setHasMore(initialProducts.length < totalCount)
      setCurrentSort(sortBy)
    }
  }, [sortBy, currentSort, initialProducts, totalCount])

  // Reset when initial products change (from server)
  useEffect(() => {
    setProducts(initialProducts)
    setPage(1)
    setHasMore(initialProducts.length < totalCount)
  }, [initialProducts, totalCount])

  const loadMore = useCallback(() => {
    if (isPending || !hasMore) return

    const nextPage = page + 1

    startTransition(async () => {
      try {
        const result = await fetchMoreProducts({
          page: nextPage,
          sortBy,
          countryCode,
          collectionId,
          categoryId,
          limit: PRODUCT_LIMIT,
        })

        // Filter out duplicates by product id
        const existingIds = new Set(products.map(p => p.id))
        const newProducts = result.products.filter(
          (p) => !existingIds.has(p.id)
        )

        if (newProducts.length > 0) {
          setProducts(prev => [...prev, ...newProducts])
          setPage(nextPage)
        }

        setHasMore(result.hasMore)
      } catch (error) {
        console.error("Error loading more products:", error)
      }
    })
  }, [isPending, hasMore, page, sortBy, countryCode, collectionId, categoryId, products])

  // Trigger load when sentinel is visible
  useEffect(() => {
    if (isInView && !isPending && hasMore) {
      loadMore()
    }
  }, [isInView, isPending, hasMore, loadMore])

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {products.map((p) => (
          <li key={p.id}>
            <ProductPreview product={p} region={region} />
          </li>
        ))}
      </ul>

      {/* Sentinel element for intersection observer */}
      <div ref={loadMoreRef} className="w-full py-8 flex justify-center">
        {isPending && (
          <div className="flex items-center gap-2 text-ui-fg-subtle">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading more products...</span>
          </div>
        )}
        {!hasMore && products.length > 0 && (
          <p className="text-ui-fg-muted text-sm">
            No more products to show
          </p>
        )}
        {products.length === 0 && !isPending && (
          <p className="text-ui-fg-muted text-sm">
            No products found
          </p>
        )}
      </div>
    </>
  )
}
