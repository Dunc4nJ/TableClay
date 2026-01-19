import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { OMNISEND_MODULE } from "../modules/omnisend"
import type OmnisendModuleService from "../modules/omnisend/service"

type NewsletterSubscribedData = {
  id: string
  email: string
  first_name?: string
  discount_code: string
  source?: string
}

/**
 * Creates or updates OmniSend contact with subscription status
 * when a user subscribes to the newsletter.
 * OmniSend automation handles sending the welcome email.
 */
export default async function newsletterSubscribedHandler({
  event: { data },
  container,
}: SubscriberArgs<NewsletterSubscribedData>) {
  const { email, first_name, discount_code, source } = data

  try {
    const omnisendService: OmnisendModuleService = container.resolve(OMNISEND_MODULE)

    // Create or update OmniSend contact with subscription status
    await omnisendService.createOrUpdateContact({
      email,
      firstName: first_name,
      identifiers: [
        {
          type: "email",
          id: email,
          channels: {
            email: {
              status: "subscribed",
              statusDate: new Date().toISOString(),
            },
          },
        },
      ],
      customProperties: {
        discount_code,
        signup_source: source || "website",
        signup_date: new Date().toISOString(),
      },
      tags: ["newsletter", "discount-eligible", "tableclay-subscriber"],
      consent: {
        source: "form",
        createdAt: new Date().toISOString(),
      },
      sendWelcomeEmail: true,
    })

    console.log(`OmniSend contact created/updated for ${email} with discount code ${discount_code}`)
  } catch (error) {
    // Log error but do NOT throw - don't fail the subscription if OmniSend fails
    console.error(`Failed to create OmniSend contact for ${email}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: "newsletter.subscribed",
}
