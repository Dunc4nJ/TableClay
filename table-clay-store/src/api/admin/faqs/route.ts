import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../modules/content"
import type ContentModuleService from "../../../modules/content/service"

/**
 * GET /admin/faqs
 * List all FAQs with optional filters
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    const {
      product_id,
      is_active,
      global_only,
    } = req.query as {
      product_id?: string
      is_active?: string
      global_only?: string
    }

    const filters: {
      product_id?: string | null
      is_active?: boolean
    } = {}

    if (global_only === "true") {
      filters.product_id = null
    } else if (product_id) {
      filters.product_id = product_id
    }

    if (is_active !== undefined) {
      filters.is_active = is_active === "true"
    }

    const faqs = await contentService.listAllFAQs(filters)
    const stats = await contentService.getFAQStats()

    return res.json({
      success: true,
      faqs,
      stats,
      count: faqs.length,
    })
  } catch (error) {
    console.error("Admin FAQs GET error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch FAQs",
    })
  }
}

/**
 * POST /admin/faqs
 * Create a new FAQ
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    const {
      product_id,
      question,
      answer,
      is_active = true,
      sort_order = 0,
      metadata,
    } = req.body as {
      product_id?: string | null
      question: string
      answer: string
      is_active?: boolean
      sort_order?: number
      metadata?: Record<string, unknown>
    }

    // Validation
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: question, answer",
      })
    }

    const faq = await contentService.createFAQ({
      product_id: product_id || null,
      question,
      answer,
      is_active,
      sort_order,
      metadata,
    })

    return res.status(201).json({
      success: true,
      faq,
    })
  } catch (error) {
    console.error("Admin FAQs POST error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create FAQ",
    })
  }
}
