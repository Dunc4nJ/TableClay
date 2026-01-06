"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import ExpressCheckoutButton from "./express-checkout-button"
import PaymentIcons from "@modules/products/components/payment-icons"
import { isStripeLike } from "@lib/constants"

interface ExpressCheckoutProps {
  cart: HttpTypes.StoreCart
}

const ExpressCheckout: React.FC<ExpressCheckoutProps> = ({ cart }) => {
  const [isAvailable, setIsAvailable] = useState(false)
  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false)

  // Check if payment session exists with client_secret
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending" && isStripeLike(s.provider_id)
  )

  const hasClientSecret = !!paymentSession?.data?.client_secret

  const showFallbackBadges =
    !hasClientSecret || (hasCheckedAvailability && !isAvailable)

  const handleAvailabilityChange = (available: boolean) => {
    setIsAvailable(available)
    setHasCheckedAvailability(true)
  }

  return (
    <div className="rounded-2xl border border-cream-200 bg-cream-50/80 p-5 shadow-sm">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-semibold text-ui-fg-base">
          Express checkout
        </h2>
        <span className="inline-flex items-center rounded-full border border-cream-200 bg-cream-100 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.24em] text-ui-fg-subtle">
          Wallets
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-cream-100/70 p-3 ring-1 ring-cream-200/80">
        {hasClientSecret && (
          <ExpressCheckoutButton
            cart={cart}
            onAvailabilityChange={handleAvailabilityChange}
          />
        )}

        {showFallbackBadges && (
          <div className="py-2">
            <PaymentIcons methods={["apple-pay", "google-pay"]} size="md" />
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-ui-fg-muted text-center">
        Secure, accelerated checkout for supported wallets
      </p>
    </div>
  )
}

export default ExpressCheckout
