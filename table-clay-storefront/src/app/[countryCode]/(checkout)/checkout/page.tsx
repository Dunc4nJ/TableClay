import { initiatePaymentSession, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout() {
  let cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  // Initialize Stripe payment session early for Express Checkout
  // This ensures client_secret is available when Express Checkout renders
  const hasPaymentSession = cart.payment_collection?.payment_sessions?.some(
    (s) => s.status === "pending" && s.provider_id === "pp_stripe_stripe"
  )

  if (!hasPaymentSession) {
    try {
      await initiatePaymentSession(cart, {
        provider_id: "pp_stripe_stripe",
      })
      // Re-fetch cart with updated payment session
      cart = (await retrieveCart()) || cart
    } catch (error) {
      // Non-blocking - Express Checkout is optional enhancement
      console.error("[Checkout] Failed to initiate payment session:", error)
    }
  }

  const customer = await retrieveCustomer()

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
      <PaymentWrapper cart={cart}>
        <CheckoutForm cart={cart} customer={customer} />
      </PaymentWrapper>
      <CheckoutSummary cart={cart} />
    </div>
  )
}
