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

// Fields required for checkout - must include payment_collection for Stripe
const CHECKOUT_CART_FIELDS =
  "*items, *region, *items.product, *items.variant, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name, *payment_collection, *payment_collection.payment_sessions"

export default async function Checkout() {
  let cart = await retrieveCart(undefined, CHECKOUT_CART_FIELDS)

  if (!cart) {
    return notFound()
  }

  // Initialize Stripe payment session early for Express Checkout
  // This ensures client_secret is available when Express Checkout renders
  // NOTE: Provider ID is "pp_stripe" (not "pp_stripe_stripe") based on medusa-config.ts id: "stripe"
  const hasPaymentSession = cart.payment_collection?.payment_sessions?.some(
    (s) => s.status === "pending" && s.provider_id === "pp_stripe"
  )

  if (!hasPaymentSession) {
    try {
      await initiatePaymentSession(cart, {
        provider_id: "pp_stripe",
      })
      // Re-fetch cart with updated payment session (include payment_collection!)
      cart = (await retrieveCart(undefined, CHECKOUT_CART_FIELDS)) || cart
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
