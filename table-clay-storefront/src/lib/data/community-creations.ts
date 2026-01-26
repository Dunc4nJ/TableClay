"use server"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export interface CommunityCreation {
  id: string
  title: string
  creator_name: string
  image_url: string
  image_alt_text: string | null
  display_date: string
}

export interface CommunityCreationsResponse {
  creations: CommunityCreation[]
  count: number
  has_more: boolean
}

/**
 * Get community creations for initial page load
 */
export async function getCommunityCreations(options?: {
  limit?: number
  offset?: number
}): Promise<CommunityCreationsResponse> {
  const { limit = 12, offset = 0 } = options || {}

  try {
    const response = await fetch(
      `${BACKEND_URL}/store/community-creations?limit=${limit}&offset=${offset}`,
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
      console.error("Failed to fetch community creations:", response.status)
      return { creations: [], count: 0, has_more: false }
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching community creations:", error)
    return { creations: [], count: 0, has_more: false }
  }
}

/**
 * Fetch more community creations for infinite scroll
 */
export async function fetchMoreCommunityCreations(options: {
  offset: number
  limit?: number
}): Promise<CommunityCreationsResponse> {
  const { limit = 12, offset } = options

  try {
    const response = await fetch(
      `${BACKEND_URL}/store/community-creations?limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_KEY,
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      console.error("Failed to fetch more community creations:", response.status)
      return { creations: [], count: 0, has_more: false }
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching more community creations:", error)
    return { creations: [], count: 0, has_more: false }
  }
}
