import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../modules/content"
import type ContentModuleService from "../../../modules/content/service"

/**
 * GET /store/community-creations
 * Paginated list for storefront with infinite scroll support
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { limit = "12", offset = "0" } = req.query as {
      limit?: string
      offset?: string
    }

    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)
    const { creations, count } = await contentService.listCommunityCreationsForStore({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    })

    const totalLoaded = parseInt(offset, 10) + creations.length
    const hasMore = totalLoaded < count

    return res.json({
      creations: creations.map((c) => ({
        id: c.id,
        title: c.title,
        creator_name: `${c.creator_first_name} ${c.creator_last_initial}.`,
        image_url: c.image_url,
        image_alt_text: c.image_alt_text,
        display_date: c.display_date,
      })),
      count,
      has_more: hasMore,
    })
  } catch (error) {
    console.error("Store community-creations GET error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch community creations",
    })
  }
}
