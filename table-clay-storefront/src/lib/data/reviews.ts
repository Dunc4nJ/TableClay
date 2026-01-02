"use server"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

// Type definitions matching backend response
export interface ReviewImage {
  id: string
  url: string
  alt_text: string | null
}

export interface Review {
  id: string
  customer_name: string
  is_verified_buyer: boolean
  rating: number
  title: string | null
  content: string
  helpful_count: number
  display_date: string
  images: ReviewImage[]
}

export interface ProductReviewStats {
  average_rating: number
  total_count: number
  rating_5_count: number
  rating_4_count: number
  rating_3_count: number
  rating_2_count: number
  rating_1_count: number
}

export interface ProductReviewsResponse {
  reviews: Review[]
  stats: ProductReviewStats | null
}

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

/**
 * Format a display date for showing in the UI
 * Input: ISO date string like "2024-06-15T00:00:00Z"
 * Output: "June 2024"
 */
export function formatReviewDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

/**
 * Get rating distribution percentages for a bar chart
 * Returns percentages based on total_count
 */
export function getRatingDistribution(
  stats: ProductReviewStats
): { rating: number; percentage: number; count: number }[] {
  const total = stats.total_count || 1 // Avoid division by zero

  return [
    { rating: 5, percentage: (stats.rating_5_count / total) * 100, count: stats.rating_5_count },
    { rating: 4, percentage: (stats.rating_4_count / total) * 100, count: stats.rating_4_count },
    { rating: 3, percentage: (stats.rating_3_count / total) * 100, count: stats.rating_3_count },
    { rating: 2, percentage: (stats.rating_2_count / total) * 100, count: stats.rating_2_count },
    { rating: 1, percentage: (stats.rating_1_count / total) * 100, count: stats.rating_1_count },
  ]
}
