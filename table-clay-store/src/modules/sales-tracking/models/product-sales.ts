import { model } from "@medusajs/framework/utils"

/**
 * Product Sales Model
 * Tracks total units sold per product for bestseller functionality
 * and admin analytics.
 */
export const ProductSales = model.define("product_sales", {
  id: model.id({ prefix: "psales" }).primaryKey(),

  // Reference to the product (product level, not variant)
  product_id: model.text().unique(),

  // Total units sold (increments on order.placed, never decrements)
  sales_count: model.number().default(0),

  // Timestamp of most recent sale
  last_sold_at: model.dateTime().nullable(),

  // Additional metadata
  metadata: model.json().nullable(),
})

export default ProductSales
