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
  const [hasAttempted, setHasAttempted] = useState(false)

  const pendingSession = cart.payment_collection?.payment_sessions?.find(
    (session) => session.status === "pending" && isStripeLike(session.provider_id)
  )

  const hasClientSecret = !!pendingSession?.data?.client_secret

  const stripeProviderId = useMemo(
    () => paymentMethods?.find((method) => isStripeLike(method.id))?.id,
    [paymentMethods]
  )

  useEffect(() => {
    if (hasClientSecret || hasAttempted || !stripeProviderId) {
      return
    }

    const run = async () => {
      setHasAttempted(true)

      try {
        await initiatePaymentSession(cart, { provider_id: stripeProviderId })
        router.refresh()
      } catch (error) {
        console.error("[Checkout] Failed to initialize payment session:", error)
      }
    }

    run()
  }, [hasClientSecret, hasAttempted, stripeProviderId, cart, router])

  return null
}

export default PaymentSessionGuard
