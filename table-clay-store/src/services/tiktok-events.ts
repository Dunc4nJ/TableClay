import {
  hashForTracking,
  normalizeEmail,
  normalizePhone,
} from "../utils/tracking-hash"

type TikTokPurchaseItem = {
  content_id: string
  quantity: number
  price: number
}

type TikTokPurchaseEventInput = {
  eventId: string
  orderId: string
  email: string | null
  phone: string | null
  currency: string
  value: number
  items: TikTokPurchaseItem[]
  ttclid?: string | null
  ttp?: string | null
  clientIp?: string | null
  userAgent?: string | null
  testEventCode?: string | null
}

export const sendTikTokPurchaseEvent = async (
  input: TikTokPurchaseEventInput
): Promise<void> => {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN
  const pixelCode = process.env.TIKTOK_PIXEL_CODE

  if (!accessToken || !pixelCode) {
    console.warn("[TikTok Events] Missing TIKTOK_ACCESS_TOKEN or TIKTOK_PIXEL_CODE")
    return
  }

  const emailHash = hashForTracking(normalizeEmail(input.email))
  const phoneHash = hashForTracking(normalizePhone(input.phone))

  // Build user data object, only including fields that have values
  const userData: Record<string, string | undefined> = {}
  if (emailHash) userData.email = emailHash
  if (phoneHash) userData.phone_number = phoneHash
  if (input.ttclid) userData.ttclid = input.ttclid
  if (input.ttp) userData.ttp = input.ttp

  const userDataKeys = Object.keys(userData).join(", ") || "NONE"
  console.log(
    `[TikTok Events] Sending CompletePayment for order ${input.orderId} with user_data keys: ${userDataKeys} | event_id: ${input.eventId}`
  )

  const payload = {
    pixel_code: pixelCode,
    event: "CompletePayment",
    event_id: input.eventId,
    timestamp: new Date().toISOString(),
    context: {
      user_agent: input.userAgent || undefined,
      ip: input.clientIp || undefined,
    },
    user: userData,
    properties: {
      currency: input.currency,
      value: input.value,
      content_type: "product",
      contents: input.items.map((item) => ({
        content_id: item.content_id,
        quantity: item.quantity,
        price: item.price,
      })),
      order_id: input.orderId,
    },
  }

  try {
    const requestBody: {
      pixel_code: string
      data: typeof payload[]
      test_event_code?: string
    } = {
      pixel_code: pixelCode,
      data: [payload],
    }

    if (input.testEventCode) {
      requestBody.test_event_code = input.testEventCode
      console.log(`[TikTok Events] Using test_event_code: ${input.testEventCode}`)
    }

    const response = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/event/track/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": accessToken,
        },
        body: JSON.stringify(requestBody),
      }
    )

    const responseText = await response.text()
    if (!response.ok) {
      console.error(
        "[TikTok Events] Request failed:",
        response.status,
        responseText
      )
    } else {
      console.log("[TikTok Events] Response:", responseText)
    }
  } catch (error) {
    console.error("[TikTok Events] Request error:", error)
  }
}
