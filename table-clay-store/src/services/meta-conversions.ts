import crypto from "crypto"
import { hashForTracking, normalizePhone } from "../utils/tracking-hash"

type MetaPurchaseItem = {
  id: string
  quantity: number
  item_price: number
}

type MetaPurchaseEventInput = {
  eventId: string
  orderId: string
  email: string
  phone?: string | null
  fbp?: string | null
  fbc?: string | null
  clientIp?: string | null
  userAgent?: string | null
  currency: string
  value: number
  items: MetaPurchaseItem[]
  eventSourceUrl: string
  eventTime?: number
}

const META_API_VERSION = "v19.0"

const hashEmail = (email: string) =>
  crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex")

export const sendMetaPurchaseEvent = async (
  input: MetaPurchaseEventInput
) => {
  const pixelId = process.env.META_PIXEL_ID
  const accessToken = process.env.META_CONVERSIONS_ACCESS_TOKEN

  if (!pixelId || !accessToken) {
    return {
      skipped: true,
      reason: "Missing META_PIXEL_ID or META_CONVERSIONS_ACCESS_TOKEN",
    }
  }

  const url = `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events?access_token=${accessToken}`
  const eventTime = input.eventTime ?? Math.floor(Date.now() / 1000)

  const hashedPhone = hashForTracking(normalizePhone(input.phone ?? null))
  const userData: Record<string, string> = {
    em: hashEmail(input.email),
  }

  if (hashedPhone) {
    userData.ph = hashedPhone
  }

  if (input.fbp) {
    userData.fbp = input.fbp
  }

  if (input.fbc) {
    userData.fbc = input.fbc
  }

  if (input.clientIp) {
    userData.client_ip_address = input.clientIp
  }

  if (input.userAgent) {
    userData.client_user_agent = input.userAgent
  }

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: eventTime,
        event_id: input.eventId,
        action_source: "website",
        event_source_url: input.eventSourceUrl,
        user_data: userData,
        custom_data: {
          currency: input.currency,
          value: input.value,
          order_id: input.orderId,
          content_type: "product",
          contents: input.items,
        },
      },
    ],
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      `[Meta CAPI] Request failed (${response.status}): ${JSON.stringify(body)}`
    )
  }

  return { ok: true, status: response.status, body }
}
