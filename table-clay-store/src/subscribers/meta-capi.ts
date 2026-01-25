import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendMetaPurchaseEvent } from "../services/meta-conversions"
import { toNumber } from "../utils/decimal-convert"

type OrderItem = {
  id: string
  title?: string
  quantity: number
  unit_price?: number
  variant_id?: string
  product_id?: string
}

type OrderRecord = {
  id: string
  email?: string
  display_id?: string | number | null
  currency_code?: string
  total?: number
  shipping_total?: number
  tax_total?: number
  metadata?: Record<string, unknown> | null
  shipping_address?: {
    phone?: string | null
  } | null
  items?: OrderItem[]
}

export default async function metaCapiHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query")

  try {
    const { data: [order] } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "email",
        "display_id",
        "currency_code",
        "total",
        "shipping_total",
        "tax_total",
        "metadata",
        "items.id",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "items.variant_id",
        "items.product_id",
        "shipping_address.phone",
      ],
      filters: {
        id: data.id,
      },
    }) as { data: OrderRecord[] }

    if (!order?.id) {
      console.log("[Meta CAPI] Order not found:", data.id)
      return
    }

    if (!order.email) {
      console.log("[Meta CAPI] Order has no email, skipping:", order.id)
      return
    }

    const currency = (order.currency_code || "USD").toUpperCase()
    const items = (order.items || [])
      .filter((item) => item.variant_id || item.product_id)
      .map((item) => ({
        id: item.variant_id ?? item.product_id ?? item.id,
        quantity: toNumber(item.quantity),
        item_price: toNumber(item.unit_price) / 100,
      }))

    if (items.length === 0) {
      console.log("[Meta CAPI] No items found for order:", order.id)
      return
    }

    // Read tracking metadata directly from order (copied from cart during checkout)
    const metadata = (order.metadata || {}) as Record<string, unknown>

    const metadataEventId =
      typeof metadata.event_id === "string" ? metadata.event_id : undefined
    const eventId = metadataEventId || `purchase_${order.id}`
    const eventSourceUrl = `https://tableclay.com/us/order/${order.id}/confirmed`

    // DEBUG: Log raw values to diagnose phone and metadata issues
    const metadataKeys = Object.keys(metadata)
    console.log(
      `[Meta CAPI DEBUG] raw phone: "${order.shipping_address?.phone ?? "NULL"}"`
    )
    console.log(
      `[Meta CAPI DEBUG] order.metadata keys: ${metadataKeys.length > 0 ? metadataKeys.join(", ") : "EMPTY"}`
    )
    console.log(`[Meta CAPI DEBUG] metadata.event_id: ${metadata.event_id ?? "MISSING"}`)
    console.log(`[Meta CAPI DEBUG] metadata._fbp: ${metadata._fbp ?? "MISSING"}`)
    console.log(`[Meta CAPI DEBUG] metadata.client_ip: ${metadata.client_ip ?? "MISSING"}`)

    // TODO: Remove testEventCode after verifying CAPI works in production
    const testEventCode = process.env.META_TEST_EVENT_CODE || null

    await sendMetaPurchaseEvent({
      eventId,
      orderId: order.id,
      email: order.email,
      phone: order.shipping_address?.phone,
      fbp: typeof metadata._fbp === "string" ? metadata._fbp : undefined,
      fbc: typeof metadata._fbc === "string" ? metadata._fbc : undefined,
      clientIp:
        typeof metadata.client_ip === "string" ? metadata.client_ip : undefined,
      userAgent:
        typeof metadata.client_user_agent === "string"
          ? metadata.client_user_agent
          : undefined,
      currency,
      value: toNumber(order.total) / 100,
      items,
      eventSourceUrl,
      testEventCode,
    })

    console.log(
      `[Meta CAPI] Purchase sent for order #${order.display_id ?? order.id}`
    )
  } catch (error) {
    console.error("[Meta CAPI] Failed to send purchase event:", error)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
