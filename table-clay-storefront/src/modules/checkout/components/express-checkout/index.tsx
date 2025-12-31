"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import ExpressCheckoutButton from "./express-checkout-button"

interface ExpressCheckoutProps {
  cart: HttpTypes.StoreCart
}

const ExpressCheckout: React.FC<ExpressCheckoutProps> = ({ cart }) => {
  const [isAvailable, setIsAvailable] = useState(false)

  // Check if payment session exists with client_secret
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const hasClientSecret = !!paymentSession?.data?.client_secret

  // Don't render section if no payment session
  // The ExpressCheckoutButton will handle hiding itself if no methods available
  if (!hasClientSecret) {
    return null
  }

  // Hide entire section if no express methods available
  if (!isAvailable && hasClientSecret) {
    // Still render the button so it can call onAvailabilityChange
    return (
      <div className="hidden">
        <ExpressCheckoutButton
          cart={cart}
          onAvailabilityChange={setIsAvailable}
        />
      </div>
    )
  }

  return (
    <div className="bg-white pb-2">
      <div className="flex flex-row items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Express checkout</h2>
      </div>

      <ExpressCheckoutButton
        cart={cart}
        onAvailabilityChange={setIsAvailable}
      />
    </div>
  )
}

export default ExpressCheckout
