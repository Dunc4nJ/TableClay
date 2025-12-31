import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { NEWSLETTER_MODULE } from "../../../../modules/newsletter"
import type NewsletterModuleService from "../../../../modules/newsletter/service"
import { Modules } from "@medusajs/framework/utils"
import type { IPromotionModuleService } from "@medusajs/framework/types"

type SubscribeRequestBody = {
  email: string
  first_name?: string
  source?: "popup" | "footer" | "checkout"
}

/**
 * POST /store/newsletter/subscribe
 * Subscribe to newsletter and receive a free shipping discount code
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { email, first_name, source = "popup" } = req.body as SubscribeRequestBody

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      })
    }

    const newsletterService: NewsletterModuleService = req.scope.resolve(
      NEWSLETTER_MODULE
    )

    // Subscribe the email
    const subscriber = await newsletterService.subscribe({
      email: email.toLowerCase().trim(),
      first_name,
      source,
    })

    // Check if this is a new subscriber (discount code not yet sent)
    const isNewSubscriber = !subscriber.discount_code_sent

    if (isNewSubscriber && subscriber.discount_code) {
      // Create a Medusa Promotion for this subscriber's unique discount code
      try {
        const promotionService: IPromotionModuleService = req.scope.resolve(
          Modules.PROMOTION
        )

        // Create a free shipping promotion with the subscriber's unique code
        await promotionService.createPromotions({
          code: subscriber.discount_code,
          type: "standard",
          status: "active",
          application_method: {
            type: "percentage",
            target_type: "shipping_methods",
            value: 100,
          },
        })

        console.log(
          `Created free shipping promotion for code: ${subscriber.discount_code}`
        )
      } catch (promoError) {
        // Log but don't fail - promotion might already exist for returning subscriber
        console.warn(
          `Could not create promotion for ${subscriber.discount_code}:`,
          promoError instanceof Error ? promoError.message : promoError
        )
      }

      // Emit event for welcome email with discount code
      const eventBus = req.scope.resolve(Modules.EVENT_BUS)
      await eventBus.emit({
        name: "newsletter.subscribed",
        data: {
          id: subscriber.id,
          email: subscriber.email,
          first_name: subscriber.first_name,
          discount_code: subscriber.discount_code,
        },
      })

      // Mark discount code as sent
      await newsletterService.markDiscountCodeSent(subscriber.id)
    }

    return res.json({
      success: true,
      message: isNewSubscriber
        ? "Welcome! Check your email for your free shipping code."
        : "You're already subscribed! Check your email for your discount code.",
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        discount_code: subscriber.discount_code,
        is_new: isNewSubscriber,
      },
    })
  } catch (error) {
    console.error("Newsletter subscribe error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to subscribe",
    })
  }
}
