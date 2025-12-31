import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { NEWSLETTER_MODULE } from "../../../modules/newsletter"
import type NewsletterModuleService from "../../../modules/newsletter/service"

/**
 * GET /admin/newsletter
 * Get newsletter subscribers with optional filtering
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const newsletterService: NewsletterModuleService = req.scope.resolve(
      NEWSLETTER_MODULE
    )

    const {
      limit = "50",
      offset = "0",
      active_only = "true",
      source,
    } = req.query as Record<string, string>

    const subscribers = await newsletterService.getActiveSubscribers({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      source: source || undefined,
    })

    // Get stats
    const stats = await newsletterService.getStats()

    return res.json({
      success: true,
      subscribers,
      stats,
      pagination: {
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        total: stats.active_subscribers,
      },
    })
  } catch (error) {
    console.error("Admin newsletter list error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch subscribers",
    })
  }
}
