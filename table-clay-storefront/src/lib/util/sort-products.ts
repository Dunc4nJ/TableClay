import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number
}

/**
 * Helper function to sort products by price until the store API supports sorting by price
 * @param products
 * @param sortBy
 * @returns products sorted by price
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions,
  productOrder: string[] = []
): HttpTypes.StoreProduct[] {
  const sortedProducts = [...products] as MinPricedProduct[]

  if (sortBy === "featured") {
    const orderIndex = new Map(productOrder.map((id, index) => [id, index]))
    const ordered: MinPricedProduct[] = []
    const unlisted: MinPricedProduct[] = []

    for (const product of sortedProducts) {
      if (orderIndex.has(product.id)) {
        ordered.push(product)
      } else {
        unlisted.push(product)
      }
    }

    unlisted.sort((a, b) => {
      const aTime = new Date(a.created_at ?? 0).getTime()
      const bTime = new Date(b.created_at ?? 0).getTime()
      return bTime - aTime
    })

    ordered.sort((a, b) => {
      return (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0)
    })

    return [...unlisted, ...ordered]
  }

  if (["price_asc", "price_desc"].includes(sortBy)) {
    // Precompute the minimum price for each product
    sortedProducts.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        product._minPrice = Math.min(
          ...product.variants.map(
            (variant) => variant?.calculated_price?.calculated_amount || 0
          )
        )
      } else {
        product._minPrice = Infinity
      }
    })

    // Sort products based on the precomputed minimum prices
    sortedProducts.sort((a, b) => {
      const diff = a._minPrice! - b._minPrice!
      return sortBy === "price_asc" ? diff : -diff
    })
  }

  if (sortBy === "created_at") {
    sortedProducts.sort((a, b) => {
      return (
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
    })
  }

  return sortedProducts
}
