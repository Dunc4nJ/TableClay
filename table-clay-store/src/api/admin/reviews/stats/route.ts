import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../../modules/content"
import type ContentModuleService from "../../../../modules/content/service"

/**
 * GET /admin/reviews/stats
 * Get review statistics across all products
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    const allReviews = await contentService.listAllReviews()
    const activeReviews = allReviews.filter((r) => r.is_active)
    const inactiveReviews = allReviews.filter((r) => !r.is_active)

    // Count by rating
    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (const review of allReviews) {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingCounts[review.rating]++
      }
    }

    // Count by product
    const productCounts: Record<string, number> = {}
    for (const review of allReviews) {
      productCounts[review.product_id] = (productCounts[review.product_id] || 0) + 1
    }

    return res.json({
      success: true,
      stats: {
        total_count: allReviews.length,
        active_count: activeReviews.length,
        inactive_count: inactiveReviews.length,
        by_rating: ratingCounts,
        products_with_reviews: Object.keys(productCounts).length,
      },
    })
  } catch (error) {
    console.error("Admin reviews stats error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch stats",
    })
  }
}
