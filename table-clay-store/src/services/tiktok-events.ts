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

  const payload = {
    pixel_code: pixelCode,
    event: "CompletePayment",
    event_id: input.eventId,
    timestamp: new Date().toISOString(),
    context: {
      user_agent: input.userAgent || undefined,
      ip: input.clientIp || undefined,
    },
    user: {
      email: hashForTracking(normalizeEmail(input.email)),
      phone_number: hashForTracking(normalizePhone(input.phone)),
      ttclid: input.ttclid || undefined,
      ttp: input.ttp || undefined,
    },
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
    const response = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/event/track/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": accessToken,
        },
        body: JSON.stringify({
          pixel_code: pixelCode,
          data: [payload],
        }),
      }
    )

    if (!response.ok) {
      console.error(
        "[TikTok Events] Request failed:",
        response.status,
        await response.text()
      )
    }
  } catch (error) {
    console.error("[TikTok Events] Request error:", error)
  }
}
