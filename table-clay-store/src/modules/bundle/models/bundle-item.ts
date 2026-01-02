import { model } from "@medusajs/framework/utils"

/**
 * BundleItem Model
 * Represents an item (product variant) within a bundle.
 * Items can come from ANY product - bundles are no longer tied to a single product.
 */
export const BundleItem = model.define("bundle_item", {
  id: model.id({ prefix: "bitem" }).primaryKey(),

  // Link to parent bundle
  bundle_id: model.text(),

  // Link to Medusa product (denormalized for efficient querying)
  product_id: model.text(),

  // Link to Medusa product variant
  variant_id: model.text(),

  // Quantity of this variant in the bundle
  quantity: model.number().default(1),

  // Ordering within bundle
  sort_order: model.number().default(0),

  // Cached display info (denormalized for performance)
  product_title: model.text().nullable(),
  variant_title: model.text().nullable(),
})

export default BundleItem
