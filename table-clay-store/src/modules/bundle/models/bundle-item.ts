import { model } from "@medusajs/framework/utils"

/**
 * BundleItem Model
 * Represents an item (product variant) within a bundle
 */
export const BundleItem = model.define("bundle_item", {
  id: model.id({ prefix: "bitem" }).primaryKey(),

  // Link to parent bundle
  bundle_id: model.text(),

  // Link to Medusa product variant
  variant_id: model.text(),

  // Quantity of this variant in the bundle
  quantity: model.number().default(1),

  // Ordering within bundle
  sort_order: model.number().default(0),
})

export default BundleItem
