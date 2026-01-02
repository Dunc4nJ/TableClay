import { model } from "@medusajs/framework/utils"

/**
 * Review Model - Admin-curated customer testimonials
 * Not customer-submitted; admin has full control over all content
 */
export const Review = model.define("content_review", {
  id: model.id({ prefix: "rev" }).primaryKey(),

  // Product association
  product_id: model.text(),

  // Customer info (admin-entered)
  customer_name: model.text(),
  is_verified_buyer: model.boolean().default(false),

  // Review content
  rating: model.number(), // 1-5 stars
  title: model.text().nullable(),
  content: model.text(),

  // Display settings
  display_date: model.dateTime(),
  helpful_count: model.number().default(0),

  // Status
  is_active: model.boolean().default(true),
  sort_order: model.number().default(0),

  // Additional data
  metadata: model.json().nullable(),
})

export default Review
