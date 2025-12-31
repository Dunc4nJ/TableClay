import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { NEWSLETTER_MODULE } from "../../../../modules/newsletter"
import type NewsletterModuleService from "../../../../modules/newsletter/service"

/**
 * GET /admin/newsletter/stats
 * Get newsletter statistics for admin dashboard
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const newsletterService: NewsletterModuleService = req.scope.resolve(
      NEWSLETTER_MODULE
    )

    const stats = await newsletterService.getStats()

    return res.json({
      success: true,
      stats: {
        ...stats,
        // Add some helpful derived metrics
        growth_message: stats.recent_signups > 0
          ? `+${stats.recent_signups} new subscribers this week`
          : "No new subscribers this week",
        conversion_message: stats.conversion_rate > 0
          ? `${stats.conversion_rate}% of subscribers used their discount code`
          : "No discount codes used yet",
      },
    })
  } catch (error) {
    console.error("Admin newsletter stats error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch stats",
    })
  }
}
