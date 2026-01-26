import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../modules/content"
import type ContentModuleService from "../../../modules/content/service"

/**
 * GET /admin/community-creations
 * List all community creations with optional filters
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    const { is_active } = req.query as {
      is_active?: string
    }

    const filters: {
      is_active?: boolean
    } = {}

    if (is_active !== undefined) {
      filters.is_active = is_active === "true"
    }

    const creations = await contentService.listAllCommunityCreations(filters)
    const stats = await contentService.getCommunityCreationStats()

    return res.json({
      success: true,
      creations,
      stats,
      count: creations.length,
    })
  } catch (error) {
    console.error("Admin Community Creations GET error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch community creations",
    })
  }
}

/**
 * POST /admin/community-creations
 * Create a new community creation
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const contentService: ContentModuleService = req.scope.resolve(CONTENT_MODULE)

    const {
      title,
      creator_first_name,
      creator_last_initial,
      image_url,
      image_alt_text,
      display_date,
      is_active = true,
      sort_order = 0,
      metadata,
    } = req.body as {
      title: string
      creator_first_name: string
      creator_last_initial: string
      image_url: string
      image_alt_text?: string
      display_date: string
      is_active?: boolean
      sort_order?: number
      metadata?: Record<string, unknown>
    }

    // Validation
    if (!title || !creator_first_name || !creator_last_initial || !image_url || !display_date) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, creator_first_name, creator_last_initial, image_url, display_date",
      })
    }

    const creation = await contentService.createCommunityCreation({
      title,
      creator_first_name,
      creator_last_initial,
      image_url,
      image_alt_text,
      display_date: new Date(display_date),
      is_active,
      sort_order,
      metadata,
    })

    return res.status(201).json({
      success: true,
      creation,
    })
  } catch (error) {
    console.error("Admin Community Creations POST error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create community creation",
    })
  }
}
