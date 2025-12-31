"use client"

import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { placeOrder } from "@lib/data/cart"
import ErrorMessage from "@modules/checkout/components/error-message"

interface CheckoutFooterProps {
  cart: HttpTypes.StoreCart
}

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-4 h-4"
  >
    <path
      fillRule="evenodd"
      d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
      clipRule="evenodd"
    />
  </svg>
)

const CheckoutFooter: React.FC<CheckoutFooterProps> = ({ cart }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPaymentReady = searchParams.get("step") === "review"

  // Check if all required info is present
  const hasEmail = !!cart.email
  const hasShippingAddress = !!cart.shipping_address?.address_1
  const hasShippingMethod = (cart.shipping_methods?.length ?? 0) > 0
  const hasPaymentMethod =
    !!cart.payment_collection?.payment_sessions?.length &&
    cart.payment_collection?.payment_sessions?.some(
      (s) => s.status === "pending"
    )

  const canPlaceOrder =
    hasEmail && hasShippingAddress && hasShippingMethod && hasPaymentMethod

  const handlePlaceOrder = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await placeOrder()
    } catch (err: any) {
      setError(err.message || "Failed to place order")
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      {/* Security Badge */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-2">
          <LockIcon />
          <span>Secure and encrypted</span>
        </div>
      </div>

      {/* Error Message */}
      {error && <ErrorMessage error={error} data-testid="checkout-error" />}

      {/* Pay Now Button */}
      <Button
        size="large"
        className="w-full py-4 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-lg"
        onClick={handlePlaceOrder}
        isLoading={isLoading}
        disabled={!canPlaceOrder || isLoading}
        data-testid="submit-order-button"
      >
        Pay now
      </Button>

      {/* Missing info hints */}
      {!canPlaceOrder && (
        <div className="mt-3 text-sm text-gray-500">
          <p>Complete the following to place your order:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            {!hasEmail && <li>Enter your email address</li>}
            {!hasShippingAddress && <li>Enter your shipping address</li>}
            {!hasShippingMethod && <li>Select a shipping method</li>}
            {!hasPaymentMethod && <li>Enter payment information</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

export default CheckoutFooter
