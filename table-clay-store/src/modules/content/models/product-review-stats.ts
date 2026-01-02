import { model } from "@medusajs/framework/utils"

/**
 * ProductReviewStats Model - Admin-controlled stats display
 * NOT calculated from reviews; admin sets these values manually
 */
export const ProductReviewStats = model.define("content_product_review_stats", {
  id: model.id({ prefix: "rstats" }).primaryKey(),

  // One stats record per product
  product_id: model.text(),

  // Main stats (admin-set)
  average_rating: model.number(), // e.g., 4.8
  total_count: model.number(), // e.g., 156

  // Rating distribution for bar chart (optional)
  rating_5_count: model.number().default(0),
  rating_4_count: model.number().default(0),
  rating_3_count: model.number().default(0),
  rating_2_count: model.number().default(0),
  rating_1_count: model.number().default(0),
})

export default ProductReviewStats
