import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
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
        "items.id",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "items.variant_id",
        "items.product_id",
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

    const eventId = `purchase_${order.id}`
    const eventSourceUrl = `https://tableclay.com/us/order/${order.id}/confirmed`

    await sendMetaPurchaseEvent({
      eventId,
      orderId: order.id,
      email: order.email,
      currency,
      value: (order.total ?? 0) / 100,
      items,
      eventSourceUrl,
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
