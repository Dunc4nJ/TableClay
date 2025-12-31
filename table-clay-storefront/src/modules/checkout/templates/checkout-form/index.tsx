import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import CheckoutSection from "@modules/checkout/components/checkout-section"
import CheckoutFooter from "@modules/checkout/components/checkout-footer"
import ExpressCheckout from "@modules/checkout/components/express-checkout"
import Payment from "@modules/checkout/components/payment"
import Shipping from "@modules/checkout/components/shipping"
import TipSelector from "@modules/checkout/components/tip-selector"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  return (
    <div className="w-full">
      {/* Express Checkout at TOP */}
      <ExpressCheckout cart={cart} />

      {/* OR Divider - only shown when express checkout might be visible */}
      <div className="relative flex items-center py-6">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-sm text-gray-500 uppercase tracking-wide">
          or continue below
        </span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      {/* Contact & Delivery Section */}
      <CheckoutSection title="Contact & Delivery">
        <Addresses cart={cart} customer={customer} />
      </CheckoutSection>

      {/* Shipping Method Section */}
      <CheckoutSection title="Shipping method">
        <Shipping cart={cart} availableShippingMethods={shippingMethods} />
      </CheckoutSection>

      {/* Payment Section */}
      <CheckoutSection title="Payment">
        <Payment cart={cart} availablePaymentMethods={paymentMethods} />
      </CheckoutSection>

      {/* Add Tip Section */}
      <CheckoutSection title="Add a tip" noBorder>
        <TipSelector cart={cart} />
      </CheckoutSection>

      {/* Checkout Footer with Pay Button */}
      <CheckoutFooter cart={cart} />
    </div>
  )
}
