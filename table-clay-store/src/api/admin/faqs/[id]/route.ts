import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../../modules/content"
import type ContentModuleService from "../../../../modules/content/service"

/**
 * GET /admin/faqs/:id
 * Get a single FAQ by ID
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    const faqs = await contentService.listAllFAQs()
    const faq = faqs.find((f) => f.id === id)

    if (!faq) {
      return res.status(404).json({
        success: false,
        error: "FAQ not found",
      })
    }

    return res.json({
      success: true,
      faq,
    })
  } catch (error) {
    console.error("Admin FAQ GET error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch FAQ",
    })
  }
}

/**
 * PUT /admin/faqs/:id
 * Update a FAQ
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    const {
      product_id,
      question,
      answer,
      is_active,
      sort_order,
      metadata,
    } = req.body as {
      product_id?: string | null
      question?: string
      answer?: string
      is_active?: boolean
      sort_order?: number
      metadata?: Record<string, unknown>
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (product_id !== undefined) updateData.product_id = product_id
    if (question !== undefined) updateData.question = question
    if (answer !== undefined) updateData.answer = answer
    if (is_active !== undefined) updateData.is_active = is_active
    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (metadata !== undefined) updateData.metadata = metadata

    // Update the FAQ
    await contentService.updateFAQs({
      selector: { id },
      data: updateData,
    })

    // Fetch updated FAQ
    const faqs = await contentService.listAllFAQs()
    const faq = faqs.find((f) => f.id === id)

    return res.json({
      success: true,
      faq,
    })
  } catch (error) {
    console.error("Admin FAQ PUT error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update FAQ",
    })
  }
}

/**
 * DELETE /admin/faqs/:id
 * Delete a FAQ (hard delete)
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    await contentService.deleteFAQs(id)

    return res.json({
      success: true,
      message: "FAQ deleted successfully",
    })
  } catch (error) {
    console.error("Admin FAQ DELETE error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete FAQ",
    })
  }
}
