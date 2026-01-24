"use client"

import { getAllTrackingData } from "@lib/analytics/tracking-cookies"
import { isManual, isStripeLike } from "@lib/constants"
import { placeOrder, saveTrackingMetadata } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import { useState } from "react"
import ErrorMessage from "@modules/checkout/components/error-message"

interface CheckoutFooterProps {
  cart: HttpTypes.StoreCart
}

type CartWithGiftCards = HttpTypes.StoreCart & {
  gift_cards?: unknown[]
  total?: number | null
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const stripe = useStripe()
  const elements = useElements()

  // Check if all required info is present
  const hasEmail = !!cart.email
  const hasShippingAddress = !!cart.shipping_address?.address_1
  const hasShippingMethod = (cart.shipping_methods?.length ?? 0) > 0
  const cartWithGiftCards = cart as CartWithGiftCards
  const paidByGiftcard =
    (cartWithGiftCards.gift_cards?.length ?? 0) > 0 &&
    cartWithGiftCards.total === 0

  const pendingSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )
  const hasPaymentMethod = paidByGiftcard || !!pendingSession

  const canPlaceOrder =
    hasEmail && hasShippingAddress && hasShippingMethod && hasPaymentMethod

  const captureTrackingMetadata = async (cartId?: string | null) => {
    if (!cartId) {
      return
    }

    try {
      const trackingData = getAllTrackingData()
      await saveTrackingMetadata(cartId, trackingData)

      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(
            "purchase_event_id",
            trackingData.event_id
          )
        } catch {
          return
        }
      }
    } catch (err) {
      console.error("Tracking capture failed:", err)
    }
  }

  const finalizeOrder = async () => {
    await captureTrackingMetadata(cart?.id)
    await placeOrder()
  }

  const handlePlaceOrder = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (paidByGiftcard) {
        await finalizeOrder()
        return
      }

      if (pendingSession && isStripeLike(pendingSession.provider_id)) {
        if (!stripe || !elements) {
          setError("Payment system not ready. Please refresh and try again.")
          return
        }

        const card = elements.getElement("card")
        if (!card) {
          setError("Please enter your card details before placing the order.")
          return
        }

        const { error: stripeError, paymentIntent } =
          await stripe.confirmCardPayment(
            pendingSession?.data?.client_secret as string,
            {
              payment_method: {
                card,
                billing_details: {
                  name:
                    cart.billing_address?.first_name +
                    " " +
                    cart.billing_address?.last_name,
                  address: {
                    city: cart.billing_address?.city ?? undefined,
                    country: cart.billing_address?.country_code ?? undefined,
                    line1: cart.billing_address?.address_1 ?? undefined,
                    line2: cart.billing_address?.address_2 ?? undefined,
                    postal_code: cart.billing_address?.postal_code ?? undefined,
                    state: cart.billing_address?.province ?? undefined,
                  },
                  email: cart.email,
                  phone: cart.billing_address?.phone ?? undefined,
                },
              },
            }
          )

        if (stripeError) {
          const pi = stripeError.payment_intent
          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            await finalizeOrder()
            return
          }

          setError(stripeError.message || "Payment failed. Please try again.")
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent?.status === "succeeded"
        ) {
          await finalizeOrder()
          return
        }

        setError("Payment was not completed. Please try again.")
        return
      }

      if (pendingSession && isManual(pendingSession.provider_id)) {
        await finalizeOrder()
        return
      }

      await finalizeOrder()
    } catch (err: any) {
      setError(err.message || "Failed to place order")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-8 pt-6 border-t border-ui-border-base">
      {/* Security Badge */}
      <div className="flex items-center justify-between text-sm text-ui-fg-muted mb-4">
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
        className="w-full py-4 bg-tc-terracotta hover:bg-tc-brown text-white font-semibold text-lg transition-colors"
        onClick={handlePlaceOrder}
        isLoading={isLoading}
        disabled={!canPlaceOrder || isLoading}
        data-testid="submit-order-button"
      >
        Pay now
      </Button>

      {/* Missing info hints */}
      {!canPlaceOrder && (
        <div className="mt-3 text-sm text-ui-fg-muted">
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
