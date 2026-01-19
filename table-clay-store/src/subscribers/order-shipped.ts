import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { OMNISEND_MODULE } from "../modules/omnisend"
import type OmnisendModuleService from "../modules/omnisend/service"

type FulfillmentItem = {
  title?: string
  quantity: number
  line_item_id?: string
}

type FulfillmentLabel = {
  tracking_number?: string
  tracking_url?: string
  label_url?: string
}

type ShippingAddress = {
  first_name?: string
  last_name?: string
  address_1?: string
  address_2?: string
  city?: string
  province?: string
  postal_code?: string
  country_code?: string
}

/**
 * Subscriber for shipment.created event
 * Sends an OmniSend "order fulfilled" event when an order is marked as shipped
 */
export default async function orderShippedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  console.log(`[order-shipped] Event received! Fulfillment ID: ${data.id}`)

  // Don't send if notification is suppressed
  if (data.no_notification) {
    console.log(`Shipping notification suppressed for fulfillment ${data.id}`)
    return
  }

  const query = container.resolve("query")

  try {
    // Fetch fulfillment with related order data
    const { data: [fulfillment] } = await query.graph({
      entity: "fulfillment",
      fields: [
        "id",
        "shipped_at",
        "labels.*",
        "items.*",
        "delivery_address.*",
      ],
      filters: {
        id: data.id,
      },
    })

    if (!fulfillment) {
      console.log("Fulfillment not found:", data.id)
      return
    }

    // Get the order associated with this fulfillment via order_id or items
    // We need to find the order to get email and display_id
    const fulfillmentItems = (fulfillment.items || []) as FulfillmentItem[]

    if (fulfillmentItems.length === 0) {
      console.log("No items in fulfillment:", data.id)
      return
    }

    // Get the first item's line_item_id to find the order
    const lineItemId = fulfillmentItems[0]?.line_item_id

    if (!lineItemId) {
      console.log("No line_item_id found in fulfillment items:", data.id)
      return
    }

    // Query to find the order containing this line item
    const { data: orderItems } = await query.graph({
      entity: "order_item",
      fields: [
        "id",
        "order.id",
        "order.email",
        "order.display_id",
        "order.currency_code",
        "order.shipping_address.*",
      ],
      filters: {
        id: lineItemId,
      },
    }) as { data: Array<{ order?: { id: string; email?: string; display_id?: number; currency_code?: string; shipping_address?: ShippingAddress } }> }

    const orderItem = orderItems?.[0]

    if (!orderItem?.order?.email) {
      console.log("Could not find order email for fulfillment:", data.id)
      return
    }

    const order = orderItem.order as {
      id: string
      email: string
      display_id: number
      currency_code?: string
      shipping_address?: ShippingAddress
    }

    const labels = (fulfillment.labels || []) as FulfillmentLabel[]

    // Get tracking info from labels
    const trackingNumber = labels[0]?.tracking_number
    const trackingUrl = labels[0]?.tracking_url || labels[0]?.label_url

    // Get shipped timestamp
    const fulfilledAt = fulfillment.shipped_at
      ? new Date(fulfillment.shipped_at as string).toISOString()
      : new Date().toISOString()

    // Send OmniSend "order fulfilled" event
    const omnisendService: OmnisendModuleService = container.resolve(OMNISEND_MODULE)

    await omnisendService.sendOrderFulfilledEvent(order.email, {
      orderID: order.id,
      orderNumber: String(order.display_id),
      fulfillmentStatus: "fulfilled",
      trackingNumber: trackingNumber,
      trackingURL: trackingUrl,
      fulfilledAt: fulfilledAt,
    })

    console.log(`OmniSend order fulfilled event sent for order #${order.display_id} (${order.email})`)
  } catch (error) {
    // Log error but do NOT re-throw - OmniSend failure should not block fulfillment flow
    console.error(`Failed to send OmniSend order fulfilled event for fulfillment ${data.id}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
