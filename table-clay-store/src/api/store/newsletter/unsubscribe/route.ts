import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { NEWSLETTER_MODULE } from "../../../../modules/newsletter"
import type NewsletterModuleService from "../../../../modules/newsletter/service"

type UnsubscribeRequestBody = {
  email: string
}

/**
 * POST /store/newsletter/unsubscribe
 * Unsubscribe from newsletter
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { email } = req.body as UnsubscribeRequestBody

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      })
    }

    const newsletterService: NewsletterModuleService = req.scope.resolve(
      NEWSLETTER_MODULE
    )

    await newsletterService.unsubscribe(email.toLowerCase().trim())

    return res.json({
      success: true,
      message: "You have been unsubscribed from our newsletter.",
    })
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error)

    // Don't reveal if email wasn't found (privacy)
    return res.json({
      success: true,
      message: "If this email was subscribed, it has been removed.",
    })
  }
}
