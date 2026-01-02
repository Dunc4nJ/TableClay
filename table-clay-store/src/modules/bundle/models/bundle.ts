import { model } from "@medusajs/framework/utils"

/**
 * Bundle Model
 * Represents a product bundle (e.g., 'Starter Set', 'Creative Set')
 * Bundles can contain items from ANY product and appear on all product pages
 * where their component items exist.
 */
export const Bundle = model.define("bundle", {
  id: model.id({ prefix: "bun" }).primaryKey(),

  // Display info
  name: model.text(), // e.g., 'Starter Set'
  description: model.text().nullable(), // e.g., '4 plates + 4 bowls + Free Shipping'

  // Pricing - Admin chooses ONE approach per bundle
  pricing_type: model.enum(["fixed", "percentage"]).default("fixed"),
  fixed_original_price: model.bigNumber().nullable(), // Cents - strikethrough price
  fixed_sale_price: model.bigNumber().nullable(), // Cents - actual price
  discount_percentage: model.number().nullable(), // e.g., 20 for 20% off

  // Badge - predefined options only
  badge: model
    .enum(["bestseller", "popular", "new", "limited", "sale", "none"])
    .default("none"),

  // Status and ordering
  is_active: model.boolean().default(true),
  sort_order: model.number().default(0),

  // Additional metadata
  metadata: model.json().nullable(),
})

export default Bundle
