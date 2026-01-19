import type { IProductModuleService } from "@medusajs/framework/types"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { CONTENT_MODULE } from "../../../../modules/content"
import type ContentModuleService from "../../../../modules/content/service"

/**
 * GET /store/reviews/featured
 * Returns featured 5-star reviews for the homepage showcase
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    const reviews = await contentService.getFeaturedReviews()
    let sortedReviews = reviews

    const normalizeSortOrder = (value: unknown): number | null => {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value
      }

      if (typeof value === "string") {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : null
      }

      return null
    }

    const resolveProductSortOrder = (product: {
      id: string
      metadata?: Record<string, unknown> | null
    }): number => {
      const productRecord = product as Record<string, unknown>
      const direct = normalizeSortOrder(productRecord.sort_order)
      if (direct !== null) {
        return direct
      }

      const metadataSort = normalizeSortOrder(product.metadata?.sort_order)
      return metadataSort ?? Number.MAX_SAFE_INTEGER
    }

    const productIds = [...new Set(reviews.map((review) => review.product_id))]
    if (productIds.length > 0) {
      try {
        const productService: IProductModuleService = req.scope.resolve(
          Modules.PRODUCT
        )
        const products = await productService.listProducts(
          { id: productIds },
          { select: ["id", "metadata"] }
        )
        const productSortOrders = new Map<string, number>()

        for (const product of products) {
          productSortOrders.set(product.id, resolveProductSortOrder(product))
        }

        sortedReviews = [...reviews].sort((a, b) => {
          const productSortA =
            productSortOrders.get(a.product_id) ?? Number.MAX_SAFE_INTEGER
          const productSortB =
            productSortOrders.get(b.product_id) ?? Number.MAX_SAFE_INTEGER

          if (productSortA !== productSortB) {
            return productSortA - productSortB
          }

          return (a.sort_order ?? 0) - (b.sort_order ?? 0)
        })
      } catch (error) {
        console.warn(
          "[FeaturedReviews] Failed to resolve product sort order:",
          error
        )
      }
    }

    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=30")

    return res.json({
      reviews: sortedReviews.map((review) => ({
        id: review.id,
        customer_name: review.customer_name,
        is_verified_buyer: review.is_verified_buyer,
        rating: review.rating,
        title: review.title,
        content: review.content,
        helpful_count: review.helpful_count,
        display_date: review.display_date,
        images: review.images?.map((img) => ({
          id: img.id,
          url: img.url,
          alt_text: img.alt_text,
        })) || [],
      })),
    })
  } catch (error) {
    console.error("Store featured reviews GET error:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch featured reviews",
    })
  }
}
