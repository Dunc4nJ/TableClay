import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { SALES_TRACKING_MODULE } from "../modules/sales-tracking"
import type SalesTrackingModuleService from "../modules/sales-tracking/service"

type OrderLineItem = {
  id: string
  quantity: number
  variant_id: string
  variant?: {
    product_id?: string
  }
}

/**
 * Sales Tracker Subscriber
 * Listens to order.placed events and increments sales counts
 *
 * NOTE: We increment on order.placed (not payment.captured) because:
 * 1. Simpler - order placed = intention to buy
 * 2. We do NOT decrement on cancellation (once sold = sold for analytics)
 */
export default async function salesTrackerHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const salesTrackingService: SalesTrackingModuleService = container.resolve(SALES_TRACKING_MODULE)
  const query = container.resolve("query")

  try {
    // Fetch order items with variant and product info
    const { data: [order] } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "items.id",
        "items.quantity",
        "items.variant_id",
        "items.variant.product_id",
      ],
      filters: {
        id: data.id,
      },
    })

    if (!order || !order.items) {
      console.log("[SalesTracker] Order not found or no items:", data.id)
      return
    }

    const items = order.items as OrderLineItem[]

    // Aggregate quantities by product_id
    const productQuantities: Map<string, number> = new Map()

    for (const item of items) {
      const productId = item.variant?.product_id
      if (!productId) {
        console.warn(`[SalesTracker] Item ${item.id} has no product_id, skipping`)
        continue
      }

      const currentQty = productQuantities.get(productId) || 0
      productQuantities.set(productId, currentQty + item.quantity)
    }

    // Increment sales for each product
    for (const [productId, quantity] of productQuantities) {
      await salesTrackingService.incrementSales({
        product_id: productId,
        quantity,
      })
      console.log(`[SalesTracker] Incremented sales for product ${productId} by ${quantity}`)
    }

    console.log(`[SalesTracker] Processed order #${order.display_id} - ${productQuantities.size} products updated`)
  } catch (error) {
    console.error("[SalesTracker] Failed to track sales:", error)
    // Don't re-throw - sales tracking failure shouldn't fail the order
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
