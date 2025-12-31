import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { NEWSLETTER_MODULE } from "../../../../modules/newsletter"
import type NewsletterModuleService from "../../../../modules/newsletter/service"

/**
 * GET /admin/newsletter/export
 * Export newsletter subscribers as CSV
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const newsletterService: NewsletterModuleService = req.scope.resolve(
      NEWSLETTER_MODULE
    )

    const {
      active_only = "true",
      source,
      format = "csv",
    } = req.query as Record<string, string>

    const data = await newsletterService.exportSubscribers({
      activeOnly: active_only === "true",
      source: source || undefined,
    })

    if (format === "json") {
      return res.json({
        success: true,
        data,
        count: data.length,
      })
    }

    // Generate CSV
    if (data.length === 0) {
      return res.status(200)
        .setHeader("Content-Type", "text/csv")
        .setHeader("Content-Disposition", 'attachment; filename="newsletter_subscribers.csv"')
        .send("email,first_name,source,subscribed_at,discount_code,discount_code_used,is_active\n")
    }

    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(","),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header]
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value ?? "")
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join(",")
      ),
    ]

    const csv = csvRows.join("\n")

    return res.status(200)
      .setHeader("Content-Type", "text/csv")
      .setHeader("Content-Disposition", `attachment; filename="newsletter_subscribers_${new Date().toISOString().split("T")[0]}.csv"`)
      .send(csv)
  } catch (error) {
    console.error("Admin newsletter export error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to export subscribers",
    })
  }
}
