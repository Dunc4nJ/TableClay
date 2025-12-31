"use server"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

type NewsletterSubscribeResponse = {
  success: boolean
  message: string
  subscriber?: {
    id: string
    email: string
    discount_code: string | null
    is_new: boolean
  }
  error?: string
}

type NewsletterSubscribeParams = {
  email: string
  first_name?: string
  source?: "popup" | "footer" | "checkout"
}

/**
 * Subscribe an email to the Table Clay newsletter
 * Returns a unique free shipping discount code for new subscribers
 */
export async function subscribeToNewsletter(
  params: NewsletterSubscribeParams
): Promise<NewsletterSubscribeResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/store/newsletter/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.error || "Failed to subscribe. Please try again.",
      }
    }

    return data
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return {
      success: false,
      message: "Network error. Please check your connection and try again.",
    }
  }
}

/**
 * Unsubscribe an email from the newsletter
 */
export async function unsubscribeFromNewsletter(
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/store/newsletter/unsubscribe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ email }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.error || "Failed to unsubscribe. Please try again.",
      }
    }

    return {
      success: true,
      message: "You have been unsubscribed from our newsletter.",
    }
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error)
    return {
      success: false,
      message: "Network error. Please check your connection and try again.",
    }
  }
}
