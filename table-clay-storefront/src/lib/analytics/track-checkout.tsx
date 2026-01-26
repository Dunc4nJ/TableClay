"use client"

import { useEffect, useRef } from "react"
import { HttpTypes } from "@medusajs/types"
import { generateEventId, pushEcommerceEvent } from "@lib/analytics/events"
import { trackOmnisendEvent } from "@lib/analytics/omnisend"
import {
  buildAbandonedCheckoutURL,
  formatOmnisendLineItems,
} from "@lib/analytics/omnisend-helpers"

type TrackInitiateCheckoutProps = {
  cart: HttpTypes.StoreCart
}

export default function TrackInitiateCheckout({
  cart,
}: TrackInitiateCheckoutProps) {
  const hasFiredRef = useRef(false)

  useEffect(() => {
    if (hasFiredRef.current) {
      return
    }

    if (!cart?.items || cart.items.length === 0) {
      return
    }

    hasFiredRef.current = true

    const currency = (
      cart.currency_code || cart.region?.currency_code || "USD"
    ).toUpperCase()
    const items = cart.items.map((item) => ({
      item_id: item.variant_id ?? item.product_id,
      item_name: item.product?.title || item.title || "Item",
      item_variant: item.variant?.title,
      price: (item.unit_price ?? 0) / 100,
      quantity: item.quantity,
    }))

    pushEcommerceEvent({
      event: "begin_checkout",
      event_id: generateEventId(`begin_checkout_${cart.id}`),
      ecommerce: {
        currency,
        value: (cart.total ?? 0) / 100,
        items,
      },
    })

    // OmniSend started checkout event with full cart data
    const countryCode = cart.region?.countries?.[0]?.iso_2 || "us"
    trackOmnisendEvent("started checkout", {
      cartID: cart.id,
      currency,
      value: (cart.total ?? 0) / 100,
      abandonedCheckoutURL: buildAbandonedCheckoutURL(cart.id, countryCode),
      lineItems: formatOmnisendLineItems(cart, countryCode),
    })
  }, [cart])

  return null
}
