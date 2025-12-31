import { model } from "@medusajs/framework/utils"

/**
 * Newsletter Subscriber Model
 * Stores email subscribers separately from Medusa customers
 * for marketing and promotional purposes
 */
export const Subscriber = model.define("newsletter_subscriber", {
  id: model.id({ prefix: "nsub" }).primaryKey(),

  // Contact info
  email: model.text().unique(),
  first_name: model.text().nullable(),

  // Subscription status
  is_active: model.boolean().default(true),
  subscribed_at: model.dateTime(),
  unsubscribed_at: model.dateTime().nullable(),

  // Source tracking (popup, footer, checkout, etc.)
  source: model.text().default("popup"),

  // Discount code management
  discount_code: model.text().nullable(),
  discount_code_sent: model.boolean().default(false),
  discount_code_used: model.boolean().default(false),
  discount_code_used_at: model.dateTime().nullable(),

  // For segmentation and campaigns
  tags: model.json().default({}),

  // Additional metadata
  metadata: model.json().nullable(),
})

export default Subscriber
