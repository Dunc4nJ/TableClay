import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const query = container.resolve("query")

  // Fetch order details
  const { data: [order] } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "email",
      "display_id",
      "created_at",
      "total",
      "currency_code",
      "items.*",
      "shipping_address.*",
    ],
    filters: {
      id: data.id,
    },
  })

  if (!order || !order.email) {
    console.log("Order not found or no email:", data.id)
    return
  }

  // Send order confirmation email
  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-placed",
    data: {
      order_id: order.id,
      display_id: order.display_id,
      email: order.email,
      created_at: order.created_at,
      total: order.total,
      currency_code: order.currency_code,
      items: order.items,
      shipping_address: order.shipping_address,
    },
  })

  console.log(`Order confirmation email sent to ${order.email} for order ${order.display_id}`)
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
