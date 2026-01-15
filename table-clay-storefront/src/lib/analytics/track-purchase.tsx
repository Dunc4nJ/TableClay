"use client"

import { useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { pushEcommerceEvent } from "@lib/analytics/events"

type TrackPurchaseProps = {
  order: HttpTypes.StoreOrder
}

const STORAGE_KEY = "tracked_purchases"

const getOrderCoupon = (order: HttpTypes.StoreOrder) => {
  const promotions = (order as { promotions?: Array<{ code?: string }> })
    .promotions
  const discountCode = (order as { discount_code?: string }).discount_code
  const metadataCode =
    typeof order.metadata === "object" && order.metadata
      ? (order.metadata as { discount_code?: string }).discount_code
      : undefined

  return promotions?.find((promo) => promo?.code)?.code || discountCode || metadataCode
}

const getTrackedOrders = () => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as string[]) : []
  } catch {
    return []
  }
}

const setTrackedOrders = (orders: string[]) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch {
    // Ignore storage failures (private mode, blocked storage, etc.)
  }
}

export default function TrackPurchase({ order }: TrackPurchaseProps) {
  useEffect(() => {
    if (!order?.id) {
      return
    }

    const trackedOrders = getTrackedOrders()
    if (trackedOrders.includes(order.id)) {
      return
    }

    const items = order.items?.map((item) => ({
      item_id: item.variant_id ?? item.product_id,
      item_name: item.product?.title || item.title || "Item",
      item_variant: item.variant?.title || item.variant_title,
      price: (item.unit_price ?? 0) / 100,
      quantity: item.quantity,
    })) ?? []

    const currency = (order.currency_code || "USD").toUpperCase()
    const coupon = getOrderCoupon(order)

    pushEcommerceEvent({
      event: "purchase",
      event_id: `purchase_${order.id}`,
      ecommerce: {
        transaction_id: order.id,
        currency,
        value: (order.total ?? 0) / 100,
        shipping: (order.shipping_total ?? 0) / 100,
        tax: (order.tax_total ?? 0) / 100,
        coupon: coupon || undefined,
        items,
      },
    })

    trackedOrders.push(order.id)
    setTrackedOrders(trackedOrders)
  }, [order])

  return null
}
