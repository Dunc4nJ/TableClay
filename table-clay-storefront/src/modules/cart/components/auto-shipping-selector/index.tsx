"use client"

import { setShippingMethod } from "@lib/data/cart"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useRef } from "react"

interface AutoShippingSelectorProps {
  cart: HttpTypes.StoreCart
}

const AutoShippingSelector: React.FC<AutoShippingSelectorProps> = ({ cart }) => {
  const hasAttemptedSelection = useRef(false)

  useEffect(() => {
    const selectDefaultShipping = async () => {
      // Skip if already has a shipping method or already attempted
      if ((cart.shipping_methods?.length ?? 0) > 0 || hasAttemptedSelection.current) {
        return
      }

      // Skip if no shipping address (required for shipping options)
      if (!cart.shipping_address?.address_1) {
        return
      }

      hasAttemptedSelection.current = true

      try {
        const shippingMethods = await listCartShippingMethods(cart.id)

        if (!shippingMethods?.length) {
          return
        }

        // Find standard shipping option (or use first available)
        const standardOption = shippingMethods.find(
          (method) => method.name?.toLowerCase().includes("standard")
        ) || shippingMethods[0]

        if (standardOption) {
          await setShippingMethod({
            cartId: cart.id,
            shippingMethodId: standardOption.id,
          })
        }
      } catch (error) {
        console.error("Failed to auto-select shipping method:", error)
      }
    }

    selectDefaultShipping()
  }, [cart.id, cart.shipping_methods, cart.shipping_address?.address_1])

  return null // This component doesn't render anything
}

export default AutoShippingSelector
