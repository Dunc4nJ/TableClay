import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../modules/content"
import type ContentModuleService from "../../../modules/content/service"

/**
 * GET /store/faqs
 * Get FAQs for a product (global + product-specific merged)
 *
 * Query Parameters:
 * - product_id (required): Medusa product ID
 *
 * Response:
 * - faqs: Array of FAQs (global first, then product-specific)
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

    const faqs = await contentService.getProductFAQs(product_id)

    return res.json({
      faqs: faqs.map((faq) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        is_global: faq.product_id === null,
      })),
    })
  } catch (error) {
    console.error("Store FAQs GET error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch FAQs",
    })
  }
}
