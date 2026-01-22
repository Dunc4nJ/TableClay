import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { sendTikTokPurchaseEvent } from "../services/tiktok-events"

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
  cart_id?: string | null
  items?: OrderItem[]
  shipping_address?: {
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
        "cart_id",
        "items.id",
        "items.quantity",
        "items.unit_price",
        "items.variant_id",
        "items.product_id",
        "shipping_address.phone",
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
        quantity: item.quantity,
        price: (item.unit_price ?? 0) / 100,
      }))

    if (items.length === 0) {
      console.log("[TikTok Events] No items found for order:", order.id)
      return
    }

    const currency = (order.currency_code || "USD").toUpperCase()

    const cartModule = container.resolve(Modules.CART)
    let metadata: Record<string, unknown> = {}

    if (order.cart_id) {
      try {
        const cart = await cartModule.retrieveCart(order.cart_id)
        metadata = (cart?.metadata || {}) as Record<string, unknown>
      } catch (cartError) {
        console.warn("[TikTok Events] Failed to load cart metadata:", cartError)
      }
    }

    const eventId =
      typeof metadata.event_id === "string"
        ? metadata.event_id
        : `order_${order.id}`

    await sendTikTokPurchaseEvent({
      eventId,
      orderId: order.id,
      email: order.email ?? null,
      phone: order.shipping_address?.phone ?? null,
      currency,
      value: (order.total ?? 0) / 100,
      items,
      ttclid: typeof metadata.ttclid === "string" ? metadata.ttclid : undefined,
      ttp: typeof metadata._ttp === "string" ? metadata._ttp : undefined,
      clientIp:
        typeof metadata.client_ip === "string" ? metadata.client_ip : undefined,
      userAgent:
        typeof metadata.client_user_agent === "string"
          ? metadata.client_user_agent
          : undefined,
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
