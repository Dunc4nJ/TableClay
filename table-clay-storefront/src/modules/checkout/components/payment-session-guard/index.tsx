"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import { initiatePaymentSession } from "@lib/data/cart"
import { isStripeLike } from "@lib/constants"

type PaymentSessionGuardProps = {
  cart: HttpTypes.StoreCart
  paymentMethods: { id: string }[]
}

const PaymentSessionGuard = ({
  cart,
  paymentMethods,
}: PaymentSessionGuardProps) => {
  const router = useRouter()
  const [attemptedKey, setAttemptedKey] = useState<string | null>(null)

  const pendingSession = cart.payment_collection?.payment_sessions?.find(
    (session) => session.status === "pending" && isStripeLike(session.provider_id)
  )

  const hasClientSecret = !!pendingSession?.data?.client_secret

  const stripeProviderId = useMemo(
    () => paymentMethods?.find((method) => isStripeLike(method.id))?.id,
    [paymentMethods]
  )

  const hasShippingMethod = (cart.shipping_methods?.length ?? 0) > 0
  const attemptKey = [cart.id, stripeProviderId ?? "none", hasShippingMethod ? "ship" : "noship"].join("|")

  useEffect(() => {
    if (!hasShippingMethod || hasClientSecret || !stripeProviderId || attemptedKey === attemptKey) {
      return
    }

    const run = async () => {
      setAttemptedKey(attemptKey)

      try {
        await initiatePaymentSession(cart, { provider_id: stripeProviderId })
        router.refresh()
      } catch (error) {
        console.error("[Checkout] Failed to initialize payment session:", error)
      }
    }

    run()
  }, [hasShippingMethod, hasClientSecret, stripeProviderId, attemptKey, attemptedKey, cart, router])

  return null
}

export default PaymentSessionGuard
