import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import type { ProviderWebhookPayload } from "@medusajs/framework/types"
import { Modules, PaymentWebhookEvents } from "@medusajs/framework/utils"

const summarizeRawBody = (rawData: unknown): string => {
  if (!rawData) {
    return "missing"
  }

  if (Buffer.isBuffer(rawData)) {
    return `buffer:${rawData.length}`
  }

  if (typeof rawData === "string") {
    return `string:${rawData.length}`
  }

  if (typeof rawData === "object") {
    const bufferLike = rawData as { type?: string; data?: unknown }
    if (bufferLike.type === "Buffer" && Array.isArray(bufferLike.data)) {
      return `buffer-json:${bufferLike.data.length}`
    }
  }

  return `type:${typeof rawData}`
}

const sanitizeError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

export default async function stripeWebhookDebugHandler({
  event,
  container,
}: SubscriberArgs<ProviderWebhookPayload>) {
  const payload = event?.data?.payload
  const provider = event?.data?.provider
  const headers = payload?.headers || {}
  const signaturePresent =
    "stripe-signature" in headers || "Stripe-Signature" in headers

  const eventBody = payload?.data as
    | {
        id?: string
        type?: string
        livemode?: boolean
        data?: { object?: { id?: string; status?: string; metadata?: { session_id?: string } } }
      }
    | undefined

  const intentObject = eventBody?.data?.object

  console.log(
    `[StripeWebhookDebug] provider=${provider ?? "unknown"} ` +
      `event=${eventBody?.type ?? "unknown"} ` +
      `event_id=${eventBody?.id ?? "unknown"} ` +
      `livemode=${eventBody?.livemode ?? "unknown"} ` +
      `intent=${intentObject?.id ?? "unknown"} ` +
      `intent_status=${intentObject?.status ?? "unknown"} ` +
      `session_id=${intentObject?.metadata?.session_id ?? "missing"} ` +
      `signature=${signaturePresent ? "present" : "missing"} ` +
      `raw=${summarizeRawBody(payload?.rawData)}`
  )

  if (!payload) {
    console.warn("[StripeWebhookDebug] Missing payload; skipping action lookup")
    return
  }

  if (!provider) {
    console.warn("[StripeWebhookDebug] Missing provider; skipping action lookup")
    return
  }

  const paymentService = container.resolve(Modules.PAYMENT)
  const rawData = payload?.rawData
  const normalizedRawData = (() => {
    if (!rawData) {
      return rawData
    }

    if (Buffer.isBuffer(rawData)) {
      return rawData
    }

    if (typeof rawData === "object") {
      const bufferLike = rawData as { type?: string; data?: unknown }
      if (bufferLike.type === "Buffer" && Array.isArray(bufferLike.data)) {
        return Buffer.from(bufferLike.data)
      }
    }

    return rawData
  })()

  try {
    const processed = await paymentService.getWebhookActionAndData({
      provider,
      payload: {
        ...payload,
        rawData: normalizedRawData,
      },
    })

    console.log(
      `[StripeWebhookDebug] action=${processed?.action ?? "unknown"} ` +
        `processed_session_id=${processed?.data?.session_id ?? "missing"}`
    )
  } catch (error) {
    console.warn(
      `[StripeWebhookDebug] getWebhookActionAndData failed: ${sanitizeError(error)}`
    )
  }
}

export const config: SubscriberConfig = {
  event: PaymentWebhookEvents.WebhookReceived,
  context: {
    subscriberId: "stripe-webhook-debug",
  },
}
