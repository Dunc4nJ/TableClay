"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import ExpressCheckoutButton from "./express-checkout-button"
import PaymentIcons from "@modules/products/components/payment-icons"

interface ExpressCheckoutProps {
  cart: HttpTypes.StoreCart
}

const ExpressCheckout: React.FC<ExpressCheckoutProps> = ({ cart }) => {
  const [isAvailable, setIsAvailable] = useState(false)
  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false)

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

  const handleAvailabilityChange = (available: boolean) => {
    setIsAvailable(available)
    setHasCheckedAvailability(true)
  }

  return (
    <div className="bg-white pb-2">
      <div className="flex flex-row items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Express checkout</h2>
      </div>

      <ExpressCheckoutButton
        cart={cart}
        onAvailabilityChange={handleAvailabilityChange}
      />

      {hasCheckedAvailability && !isAvailable && (
        <div className="mt-3">
          <PaymentIcons methods={["apple-pay", "google-pay"]} size="md" />
          <p className="mt-2 text-xs text-gray-500 text-center">
            Available on supported devices and browsers
          </p>
        </div>
      )}
    </div>
  )
}

export default ExpressCheckout
