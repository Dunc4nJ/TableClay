import { model } from "@medusajs/framework/utils"

/**
 * FAQ Model - Questions and Answers
 * product_id NULL = global FAQ (shows on all products)
 * product_id set = product-specific FAQ
 */
export const FAQ = model.define("content_faq", {
  id: model.id({ prefix: "faq" }).primaryKey(),

  // NULL = global FAQ, set = product-specific
  product_id: model.text().nullable(),

  // Content
  question: model.text(),
  answer: model.text(),

  // Status
  is_active: model.boolean().default(true),
  sort_order: model.number().default(0),

  // Additional data
  metadata: model.json().nullable(),
})

export default FAQ
