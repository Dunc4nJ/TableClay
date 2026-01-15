"use client"

import { useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { generateEventId, pushEcommerceEvent } from "@lib/analytics/events"

type TrackViewContentProps = {
  product: HttpTypes.StoreProduct
  region?: HttpTypes.StoreRegion
}

const selectVariant = (
  product: HttpTypes.StoreProduct,
  variantId: string | null
) => {
  if (!product.variants || product.variants.length === 0) {
    return null
  }

  if (variantId) {
    return product.variants.find((variant) => variant.id === variantId) ?? null
  }

  return product.variants[0] ?? null
}

export default function TrackViewContent({
  product,
  region,
}: TrackViewContentProps) {
  const searchParams = useSearchParams()
  const lastTrackedRef = useRef<string | null>(null)
  const selectedVariantId = searchParams?.get("v_id") ?? null

  const variant = useMemo(
    () => selectVariant(product, selectedVariantId),
    [product, selectedVariantId]
  )

  const trackingKey = useMemo(() => {
    const variantKey = variant?.id ?? "default"
    return `${product.id}-${variantKey}`
  }, [product.id, variant?.id])

  useEffect(() => {
    if (!product?.id) {
      return
    }

    if (lastTrackedRef.current === trackingKey) {
      return
    }

    lastTrackedRef.current = trackingKey

    const amount =
      variant?.calculated_price?.calculated_amount ??
      product.variants?.[0]?.calculated_price?.calculated_amount ??
      0
    const price = typeof amount === "number" ? amount : 0
    const currency = (region?.currency_code || "USD").toUpperCase()

    pushEcommerceEvent({
      event: "view_item",
      event_id: generateEventId("view_item"),
      ecommerce: {
        currency,
        value: price / 100,
        items: [
          {
            item_id: variant?.id ?? product.id,
            item_name: product.title || "Product",
            item_variant: variant?.title,
            price: price / 100,
            quantity: 1,
          },
        ],
      },
    })
  }, [product, region?.currency_code, trackingKey, variant])

  return null
}
