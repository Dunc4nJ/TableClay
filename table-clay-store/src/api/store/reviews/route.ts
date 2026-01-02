import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../modules/content"
import type ContentModuleService from "../../../modules/content/service"

/**
 * GET /store/reviews
 * Get reviews for a product (read-only, admin-curated reviews)
 *
 * Query Parameters:
 * - product_id (required): Medusa product ID
 *
 * Response:
 * - reviews: Array of active reviews with images
 * - stats: Admin-set stats (average_rating, total_count, distribution)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { product_id } = req.query as { product_id?: string }

    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: "product_id is required",
      })
    }

    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    const { reviews, stats } = await contentService.getProductReviews(product_id)

    return res.json({
      reviews: reviews.map((review) => ({
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
      stats: stats
        ? {
            average_rating: stats.average_rating,
            total_count: stats.total_count,
            rating_5_count: stats.rating_5_count,
            rating_4_count: stats.rating_4_count,
            rating_3_count: stats.rating_3_count,
            rating_2_count: stats.rating_2_count,
            rating_1_count: stats.rating_1_count,
          }
        : null,
    })
  } catch (error) {
    console.error("Store reviews GET error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch reviews",
    })
  }
}
