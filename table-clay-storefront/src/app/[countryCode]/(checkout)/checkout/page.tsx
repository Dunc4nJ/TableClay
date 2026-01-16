import { initiatePaymentSession, retrieveCart } from "@lib/data/cart"
import { listCartPaymentMethods } from "@lib/data/payment"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import TrackInitiateCheckout from "@lib/analytics/track-checkout"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

// Fields required for checkout - must include payment_collection for Stripe
// NOTE: +payment_collection.payment_sessions.data is CRITICAL for client_secret
const CHECKOUT_CART_FIELDS =
  "*items, *region, *items.product, *items.variant, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name, *payment_collection, *payment_collection.payment_sessions, +payment_collection.payment_sessions.data"

export default async function Checkout() {
  // CRITICAL: Use skipCache=true to bypass Next.js caching and get fresh payment session data
  // This fixes the Stripe CardElement not rendering issue (see GitHub medusajs/medusa#13512)
  // The Medusa SDK has a bug where cache tags don't work properly with Next.js 15+
  let cart = await retrieveCart(undefined, CHECKOUT_CART_FIELDS, true)

  if (!cart) {
    return notFound()
  }

  // Initialize Stripe payment session early for Express Checkout
  // This ensures client_secret is available when Express Checkout renders
  // NOTE: Provider ID is "pp_stripe" (not "pp_stripe_stripe") based on medusa-config.ts id: "stripe"
  const hasPaymentSession = cart.payment_collection?.payment_sessions?.some(
    (s) =>
      s.status === "pending" &&
      (s.provider_id?.startsWith("pp_stripe") ||
        s.provider_id?.startsWith("pp_medusa-"))
  )

  if (!hasPaymentSession) {
    try {
      const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")
      const stripeProviderId =
        paymentMethods?.find(
          (method) =>
            method.id === "pp_stripe" ||
            method.id?.startsWith("pp_stripe") ||
            method.id?.startsWith("pp_medusa-")
        )?.id || "pp_stripe"

      await initiatePaymentSession(cart, {
        provider_id: stripeProviderId,
      })
      // Re-fetch cart with updated payment session (skipCache=true for fresh data)
      cart = (await retrieveCart(undefined, CHECKOUT_CART_FIELDS, true)) || cart
    } catch (error) {
      // Non-blocking - Express Checkout is optional enhancement
      console.error("[Checkout] Failed to initiate payment session:", error)
    }
  }

  const customer = await retrieveCustomer()

  return (
    <div className="bg-tc-cream">
      <TrackInitiateCheckout cart={cart} />
      <div className="grid grid-cols-1 small:grid-cols-[minmax(0,1fr)_420px]">
        <section className="bg-tc-cream">
          <div className="content-container py-10 small:py-12">
            <div className="max-w-[720px]">
              <PaymentWrapper cart={cart}>
                <CheckoutForm cart={cart} customer={customer} />
              </PaymentWrapper>
            </div>
          </div>
        </section>
        <aside className="bg-tc-cream small:bg-ui-bg-component small:border-l small:border-cream-300">
          <div className="content-container py-10 small:py-12">
            <div className="max-w-[420px] small:ml-auto">
              <CheckoutSummary cart={cart} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
