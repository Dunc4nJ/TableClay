"use server"

import type { ProductReviewsResponse } from "./review-types"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

/**
 * Get reviews and stats for a product
 * Returns admin-curated reviews with manual stats
 */
export async function getProductReviews(
  productId: string
): Promise<ProductReviewsResponse> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/store/reviews?product_id=${encodeURIComponent(productId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_KEY,
        },
        next: {
          revalidate: 60, // Cache for 60 seconds
        },
      }
    )

    if (!response.ok) {
      console.error("Failed to fetch reviews:", response.status)
      return { reviews: [], stats: null }
    }

    const data = await response.json()
    return {
      reviews: data.reviews || [],
      stats: data.stats || null,
    }
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return { reviews: [], stats: null }
  }
}

// Re-export types for convenience (types are allowed in "use server" files)
export type {
  Review,
  ReviewImage,
  ProductReviewStats,
  ProductReviewsResponse,
} from "./review-types"

// Note: Utility functions (formatReviewDate, getRatingDistribution)
// must be imported directly from "./review-types" as they are not async
