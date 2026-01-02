"use server"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

// Type definitions matching backend response
export interface FAQ {
  id: string
  question: string
  answer: string
  is_global: boolean
}

export interface ProductFAQsResponse {
  faqs: FAQ[]
}

/**
 * Get FAQs for a product
 * Returns global FAQs first, then product-specific FAQs
 */
export async function getProductFAQs(
  productId: string
): Promise<FAQ[]> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/store/faqs?product_id=${encodeURIComponent(productId)}`,
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
      console.error("Failed to fetch FAQs:", response.status)
      return []
    }

    const data: ProductFAQsResponse = await response.json()
    return data.faqs || []
  } catch (error) {
    console.error("Error fetching FAQs:", error)
    return []
  }
}
