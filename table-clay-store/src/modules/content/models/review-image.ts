import { model } from "@medusajs/framework/utils"

/**
 * ReviewImage Model - S3-hosted images for reviews
 */
export const ReviewImage = model.define("content_review_image", {
  id: model.id({ prefix: "rimg" }).primaryKey(),

  // Parent review
  review_id: model.text(),

  // Image data
  url: model.text(), // S3 URL
  alt_text: model.text().nullable(),

  // Ordering
  sort_order: model.number().default(0),
})

export default ReviewImage
