import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../../modules/content"
import type ContentModuleService from "../../../../modules/content/service"

/**
 * GET /admin/reviews/:id
 * Get a single review by ID
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    const reviews = await contentService.listAllReviews()
    const review = reviews.find((r) => r.id === id)

    if (!review) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      })
    }

    return res.json({
      success: true,
      review,
    })
  } catch (error) {
    console.error("Admin review GET error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch review",
    })
  }
}

/**
 * PUT /admin/reviews/:id
 * Update a review
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    const {
      customer_name,
      is_verified_buyer,
      rating,
      title,
      content,
      display_date,
      helpful_count,
      is_active,
      sort_order,
      image_urls,
      metadata,
    } = req.body as {
      customer_name?: string
      is_verified_buyer?: boolean
      rating?: number
      title?: string
      content?: string
      display_date?: string
      helpful_count?: number
      is_active?: boolean
      sort_order?: number
      image_urls?: string[]
      metadata?: Record<string, unknown>
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (customer_name !== undefined) updateData.customer_name = customer_name
    if (is_verified_buyer !== undefined) updateData.is_verified_buyer = is_verified_buyer
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: "Rating must be between 1 and 5",
        })
      }
      updateData.rating = rating
    }
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (display_date !== undefined) updateData.display_date = new Date(display_date)
    if (helpful_count !== undefined) updateData.helpful_count = helpful_count
    if (is_active !== undefined) updateData.is_active = is_active
    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (metadata !== undefined) updateData.metadata = metadata

    // Update the review
    await contentService.updateReviews({
      selector: { id },
      data: updateData,
    })

    // Update images if provided
    if (image_urls !== undefined) {
      await contentService.replaceReviewImages(id, image_urls)
    }

    // Fetch updated review
    const reviews = await contentService.listAllReviews()
    const review = reviews.find((r) => r.id === id)

    return res.json({
      success: true,
      review,
    })
  } catch (error) {
    console.error("Admin review PUT error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update review",
    })
  }
}

/**
 * DELETE /admin/reviews/:id
 * Delete a review (hard delete)
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    // Delete images first (cascade should handle this, but being explicit)
    const images = await contentService.listReviewImages({ review_id: id })
    for (const img of images) {
      await contentService.deleteReviewImages(img.id)
    }

    // Delete the review
    await contentService.deleteReviews(id)

    return res.json({
      success: true,
      message: "Review deleted successfully",
    })
  } catch (error) {
    console.error("Admin review DELETE error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete review",
    })
  }
}
