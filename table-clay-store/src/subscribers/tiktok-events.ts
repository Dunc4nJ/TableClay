import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendTikTokPurchaseEvent } from "../services/tiktok-events"
import { toNumber } from "../utils/decimal-convert"

type OrderItem = {
  id: string
  quantity: number
  unit_price?: number
  variant_id?: string
  product_id?: string
}

type OrderRecord = {
  id: string
  display_id?: string | number | null
  email?: string | null
  currency_code?: string | null
  total?: number | null
  subtotal?: number | null
  shipping_total?: number | null
  tax_total?: number | null
  discount_total?: number | null
  metadata?: Record<string, unknown> | null
  items?: OrderItem[]
  shipping_address?: {
    phone?: string | null
  } | null
  billing_address?: {
    phone?: string | null
  } | null
}

export default async function tiktokEventsSubscriber({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query")

  try {
    const { data: [order] } = (await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "total",
        "subtotal",
        "shipping_total",
        "tax_total",
        "discount_total",
        "metadata",
        "items.id",
        "items.quantity",
        "items.unit_price",
        "items.variant_id",
        "items.product_id",
        "shipping_address.phone",
        "billing_address.phone",
      ],
      filters: {
        id: data.id,
      },
    })) as { data: OrderRecord[] }

    if (!order?.id) {
      console.log("[TikTok Events] Order not found:", data.id)
      return
    }

    const items = (order.items || [])
      .filter((item) => item.variant_id || item.product_id)
      .map((item) => ({
        content_id: item.variant_id ?? item.product_id ?? item.id,
        quantity: toNumber(item.quantity),
        price: toNumber(item.unit_price) / 100,
      }))

    if (items.length === 0) {
      console.log("[TikTok Events] No items found for order:", order.id)
      return
    }

    const currency = (order.currency_code || "USD").toUpperCase()

    // Read tracking metadata directly from order (copied from cart during checkout)
    const metadata = (order.metadata || {}) as Record<string, unknown>

    const metadataEventId =
      typeof metadata.event_id === "string" ? metadata.event_id : undefined
    const eventId = metadataEventId || `purchase_${order.id}`

    // Try both shipping and billing address for phone (fallback)
    const shippingPhone = order.shipping_address?.phone || ""
    const billingPhone = order.billing_address?.phone || ""
    const phone = shippingPhone || billingPhone || null

    // DEBUG: Log raw values to diagnose address/metadata issues
    const metadataKeys = Object.keys(metadata)
    console.log(
      `[TikTok Events DEBUG] shipping_address.phone: "${shippingPhone || "EMPTY"}"`
    )
    console.log(
      `[TikTok Events DEBUG] billing_address.phone: "${billingPhone || "EMPTY"}"`
    )
    console.log(
      `[TikTok Events DEBUG] resolved phone: "${phone || "NULL"}"`
    )
    console.log(
      `[TikTok Events DEBUG] order.metadata keys: ${metadataKeys.length > 0 ? metadataKeys.join(", ") : "EMPTY"}`
    )
    console.log(`[TikTok Events DEBUG] metadata.event_id: ${metadata.event_id ?? "MISSING"}`)
    console.log(`[TikTok Events DEBUG] metadata._ttp: ${metadata._ttp ?? "MISSING"}`)
    console.log(`[TikTok Events DEBUG] metadata.ttclid: ${metadata.ttclid ?? "MISSING"}`)

    // DEBUG: Log raw order totals to diagnose value=0 issue
    console.log(`[TikTok Events DEBUG] order.total: ${order.total}, type: ${typeof order.total}`)
    console.log(`[TikTok Events DEBUG] order.subtotal: ${order.subtotal}, shipping: ${order.shipping_total}, tax: ${order.tax_total}, discount: ${order.discount_total}`)

    // Calculate value with fallback and logging
    const rawTotal = toNumber(order.total)
    const value = rawTotal / 100
    console.log(`[TikTok Events DEBUG] Calculated value: ${value} (raw: ${rawTotal} / 100)`)

    // TODO: Remove testEventCode after verifying TikTok Events work in production
    const testEventCode = process.env.TIKTOK_TEST_EVENT_CODE || null

    await sendTikTokPurchaseEvent({
      eventId,
      orderId: order.id,
      email: order.email ?? null,
      phone,
      currency,
      value,
      items,
      ttclid: typeof metadata.ttclid === "string" ? metadata.ttclid : undefined,
      ttp: typeof metadata._ttp === "string" ? metadata._ttp : undefined,
      clientIp:
        typeof metadata.client_ip === "string" ? metadata.client_ip : undefined,
      userAgent:
        typeof metadata.client_user_agent === "string"
          ? metadata.client_user_agent
          : undefined,
      testEventCode,
    })

    console.log(
      `[TikTok Events] Purchase sent for order #${order.display_id ?? order.id}`
    )
  } catch (error) {
    console.error("[TikTok Events] Failed to send purchase event:", error)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
