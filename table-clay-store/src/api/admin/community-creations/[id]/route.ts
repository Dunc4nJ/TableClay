import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../../modules/content"
import type ContentModuleService from "../../../../modules/content/service"

/**
 * GET /admin/community-creations/:id
 * Get a single community creation by ID
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    const creations = await contentService.listAllCommunityCreations()
    const creation = creations.find((c) => c.id === id)

    if (!creation) {
      return res.status(404).json({
        success: false,
        error: "Community creation not found",
      })
    }

    return res.json({
      success: true,
      creation,
    })
  } catch (error) {
    console.error("Admin Community Creation GET error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch community creation",
    })
  }
}

/**
 * PUT /admin/community-creations/:id
 * Update a community creation
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    const {
      title,
      creator_first_name,
      creator_last_initial,
      image_url,
      image_alt_text,
      display_date,
      is_active,
      sort_order,
      metadata,
    } = req.body as {
      title?: string
      creator_first_name?: string
      creator_last_initial?: string
      image_url?: string
      image_alt_text?: string
      display_date?: string
      is_active?: boolean
      sort_order?: number
      metadata?: Record<string, unknown>
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (creator_first_name !== undefined) updateData.creator_first_name = creator_first_name
    if (creator_last_initial !== undefined) updateData.creator_last_initial = creator_last_initial
    if (image_url !== undefined) updateData.image_url = image_url
    if (image_alt_text !== undefined) updateData.image_alt_text = image_alt_text
    if (display_date !== undefined) updateData.display_date = new Date(display_date)
    if (is_active !== undefined) updateData.is_active = is_active
    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (metadata !== undefined) updateData.metadata = metadata

    // Update the community creation
    await contentService.updateCommunityCreations({
      selector: { id },
      data: updateData,
    })

    // Fetch updated creation
    const creations = await contentService.listAllCommunityCreations()
    const creation = creations.find((c) => c.id === id)

    return res.json({
      success: true,
      creation,
    })
  } catch (error) {
    console.error("Admin Community Creation PUT error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update community creation",
    })
  }
}

/**
 * DELETE /admin/community-creations/:id
 * Delete a community creation (hard delete)
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    await contentService.deleteCommunityCreations(id)

    return res.json({
      success: true,
      message: "Community creation deleted successfully",
    })
  } catch (error) {
    console.error("Admin Community Creation DELETE error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete community creation",
    })
  }
}
