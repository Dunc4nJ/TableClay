import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { sendMetaPurchaseEvent } from "../services/meta-conversions"

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
  cart_id?: string | null
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
        "cart_id",
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
        quantity: item.quantity,
        item_price: (item.unit_price ?? 0) / 100,
      }))

    if (items.length === 0) {
      console.log("[Meta CAPI] No items found for order:", order.id)
      return
    }

    const cartModule = container.resolve(Modules.CART)
    let metadata: Record<string, unknown> = {}

    if (order.cart_id) {
      try {
        const cart = await cartModule.retrieveCart(order.cart_id)
        metadata = (cart?.metadata || {}) as Record<string, unknown>
      } catch (cartError) {
        console.warn("[Meta CAPI] Failed to load cart metadata:", cartError)
      }
    }

    const metadataEventId =
      typeof metadata.event_id === "string" ? metadata.event_id : undefined
    const eventId = metadataEventId || `purchase_${order.id}`
    const eventSourceUrl = `https://tableclay.com/us/order/${order.id}/confirmed`

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
      value: (order.total ?? 0) / 100,
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
