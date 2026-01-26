import { model } from "@medusajs/framework/utils"

/**
 * CommunityCreation Model - Showcase of customer-made pottery
 * Admin-curated gallery of pieces created by customers using Table Clay products
 */
export const CommunityCreation = model.define("content_community_creation", {
  id: model.id({ prefix: "cc" }).primaryKey(),

  // Creation info
  title: model.text(),
  creator_first_name: model.text(),
  creator_last_initial: model.text(),

  // Image (stored in S3)
  image_url: model.text(),
  image_alt_text: model.text().nullable(),

  // Display settings
  display_date: model.dateTime(),
  is_active: model.boolean().default(true),
  sort_order: model.number().default(0),

  // Additional data
  metadata: model.json().nullable(),
})

export default CommunityCreation
