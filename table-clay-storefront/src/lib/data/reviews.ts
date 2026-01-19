"use server"

import type { ProductReviewsResponse, Review } from "./review-types"

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
    const stats = data.stats
      ? {
          average_rating: Number.parseFloat(data.stats.average_rating),
          total_count: Number.parseInt(data.stats.total_count, 10) || 0,
          rating_5_count: Number.parseInt(data.stats.rating_5_count, 10) || 0,
          rating_4_count: Number.parseInt(data.stats.rating_4_count, 10) || 0,
          rating_3_count: Number.parseInt(data.stats.rating_3_count, 10) || 0,
          rating_2_count: Number.parseInt(data.stats.rating_2_count, 10) || 0,
          rating_1_count: Number.parseInt(data.stats.rating_1_count, 10) || 0,
        }
      : null
    return {
      reviews: data.reviews || [],
      stats: stats && Number.isFinite(stats.average_rating) ? stats : null,
    }
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return { reviews: [], stats: null }
  }
}

/**
 * Get featured reviews for homepage showcase
 * Returns admin-curated 5-star reviews
 */
export async function getFeaturedReviews(): Promise<{ reviews: Review[] }> {
  try {
    const response = await fetch(`${BACKEND_URL}/store/reviews/featured`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      next: {
        revalidate: 60, // Cache for 60 seconds
      },
    })

    if (!response.ok) {
      console.error("Failed to fetch featured reviews:", response.status)
      return { reviews: [] }
    }

    const data = await response.json()
    return { reviews: data.reviews || [] }
  } catch (error) {
    console.error("Error fetching featured reviews:", error)
    return { reviews: [] }
  }
}

// Re-export types for convenience (types are allowed in "use server" files)
export type {
  Review,
  ReviewImage,
  ProductReviewStats,
  ProductReviewsResponse,
} from "./review-types"

// Note: DEFAULT_REVIEW_STATS and utility functions (formatReviewDate, getRatingDistribution)
// must be imported directly from "./review-types" as they are not async
// and cannot be exported from a "use server" file
