import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../../modules/content"
import type ContentModuleService from "../../../../modules/content/service"

/**
 * GET /admin/reviews/product-stats
 * Get product review stats (displayed in store header)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { product_id } = req.query as { product_id?: string }
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    if (product_id) {
      // Get stats for specific product
      const statsList = await contentService.listProductReviewStats({
        product_id,
      })

      return res.json({
        success: true,
        stats: statsList.length > 0 ? statsList[0] : null,
      })
    }

    // Get all product stats
    const allStats = await contentService.listProductReviewStats({})

    return res.json({
      success: true,
      stats: allStats,
    })
  } catch (error) {
    console.error("Admin product stats GET error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch product stats",
    })
  }
}

/**
 * POST /admin/reviews/product-stats
 * Create or update product review stats
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    const {
      product_id,
      average_rating,
      total_count,
      rating_5_count,
      rating_4_count,
      rating_3_count,
      rating_2_count,
      rating_1_count,
    } = req.body as {
      product_id: string
      average_rating: number
      total_count: number
      rating_5_count?: number
      rating_4_count?: number
      rating_3_count?: number
      rating_2_count?: number
      rating_1_count?: number
    }

    if (!product_id || average_rating === undefined || total_count === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: product_id, average_rating, total_count",
      })
    }

    const stats = await contentService.upsertProductStats(product_id, {
      average_rating,
      total_count,
      rating_5_count,
      rating_4_count,
      rating_3_count,
      rating_2_count,
      rating_1_count,
    })

    return res.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Admin product stats POST error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update product stats",
    })
  }
}
