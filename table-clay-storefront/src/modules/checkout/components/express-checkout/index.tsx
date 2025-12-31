"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import ExpressCheckoutButton from "./express-checkout-button"

interface ExpressCheckoutProps {
  cart: HttpTypes.StoreCart
}

const ExpressCheckout: React.FC<ExpressCheckoutProps> = ({ cart }) => {
  const [showDivider, setShowDivider] = useState(false)

  // Check if payment session exists with client_secret
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const hasClientSecret = !!paymentSession?.data?.client_secret

  // Don't render section if no payment session
  // The ExpressCheckoutButton will handle hiding itself if no methods available
  if (!hasClientSecret) {
    console.log("[ExpressCheckout] No client secret, section hidden")
    return null
  }

  console.log("[ExpressCheckout] Rendering with client secret")

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-4">
        <h2 className="text-xl font-medium">Express checkout</h2>
      </div>

      <div className="mb-4">
        <ExpressCheckoutButton
          cart={cart}
          onAvailabilityChange={setShowDivider}
        />
      </div>

      {/* Divider - only shown when express checkout buttons are visible */}
      {showDivider && (
        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-sm text-gray-500 uppercase tracking-wide">
            or pay with card
          </span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>
      )}
    </div>
  )
}

export default ExpressCheckout
