import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
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

    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=30")

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
