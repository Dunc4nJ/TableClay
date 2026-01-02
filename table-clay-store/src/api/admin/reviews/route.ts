import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../modules/content"
import type ContentModuleService from "../../../modules/content/service"

/**
 * GET /admin/reviews
 * List all reviews with optional filters
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    const {
      product_id,
      is_active,
      rating,
    } = req.query as {
      product_id?: string
      is_active?: string
      rating?: string
    }

    const filters: {
      product_id?: string
      is_active?: boolean
      rating?: number
    } = {}

    if (product_id) filters.product_id = product_id
    if (is_active !== undefined) filters.is_active = is_active === "true"
    if (rating) filters.rating = parseInt(rating, 10)

    const reviews = await contentService.listAllReviews(filters)

    return res.json({
      success: true,
      reviews,
      count: reviews.length,
    })
  } catch (error) {
    console.error("Admin reviews GET error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch reviews",
    })
  }
}

/**
 * POST /admin/reviews
 * Create a new review with optional images
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    const {
      product_id,
      customer_name,
      is_verified_buyer = false,
      rating,
      title,
      content,
      display_date,
      helpful_count = 0,
      is_active = true,
      sort_order = 0,
      image_urls = [],
      metadata,
    } = req.body as {
      product_id: string
      customer_name: string
      is_verified_buyer?: boolean
      rating: number
      title?: string
      content: string
      display_date: string
      helpful_count?: number
      is_active?: boolean
      sort_order?: number
      image_urls?: string[]
      metadata?: Record<string, unknown>
    }

    // Validation
    if (!product_id || !customer_name || !rating || !content || !display_date) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: product_id, customer_name, rating, content, display_date",
      })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5",
      })
    }

    const review = await contentService.createReviewWithImages(
      {
        product_id,
        customer_name,
        is_verified_buyer,
        rating,
        title,
        content,
        display_date: new Date(display_date),
        helpful_count,
        is_active,
        sort_order,
        metadata,
      },
      image_urls
    )

    return res.status(201).json({
      success: true,
      review,
    })
  } catch (error) {
    console.error("Admin reviews POST error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create review",
    })
  }
}
