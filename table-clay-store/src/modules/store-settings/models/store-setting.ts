import { model } from "@medusajs/framework/utils"

/**
 * StoreSetting Model
 * Key-value store for global site settings
 * Initially used for bundle promo banner text
 */
export const StoreSetting = model.define("store_setting", {
  id: model.id({ prefix: "sset" }).primaryKey(),
  key: model.text(), // e.g., 'bundle_promo_text', 'bundle_promo_enabled'
  value: model.text().nullable(), // The setting value
  metadata: model.json().nullable(),
})

export default StoreSetting
