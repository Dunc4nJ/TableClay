import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import CheckoutSection from "@modules/checkout/components/checkout-section"
import CheckoutFooter from "@modules/checkout/components/checkout-footer"
import ExpressCheckout from "@modules/checkout/components/express-checkout"
import ContactDeliveryForm from "@modules/checkout/components/contact-delivery-form"
import ShippingMethodSelector from "@modules/checkout/components/shipping-method-selector"
import PaymentSessionGuard from "@modules/checkout/components/payment-session-guard"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import PaymentForm from "@modules/checkout/components/payment-form"
import TipSelector from "@modules/checkout/components/tip-selector"
import { CheckoutSaveProvider } from "@modules/checkout/context/checkout-save-context"

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
    <PaymentWrapper cart={cart}>
      <CheckoutSaveProvider>
        <div className="w-full">
          <PaymentSessionGuard cart={cart} paymentMethods={paymentMethods} />
        {/* Express Checkout at TOP */}
        <ExpressCheckout cart={cart} />

        {/* OR Divider */}
        <div className="relative flex items-center py-6">
          <div className="flex-grow border-t border-cream-300"></div>
          <span className="flex-shrink mx-4 text-xs text-ui-fg-subtle uppercase tracking-[0.2em]">
            or continue below
          </span>
          <div className="flex-grow border-t border-cream-300"></div>
        </div>

        {/* Contact & Delivery Section */}
        <CheckoutSection title="Contact & Delivery">
          <ContactDeliveryForm cart={cart} customer={customer} />
        </CheckoutSection>

        {/* Shipping Method Section */}
        <CheckoutSection title="Shipping method">
          <ShippingMethodSelector
            cart={cart}
            availableShippingMethods={shippingMethods}
          />
        </CheckoutSection>

        {/* Payment Section */}
        <CheckoutSection title="Payment">
          <PaymentForm cart={cart} availablePaymentMethods={paymentMethods} />
        </CheckoutSection>

        {/* Add Tip Section */}
        <CheckoutSection title="Add a tip" noBorder>
          <TipSelector cart={cart} />
        </CheckoutSection>

        {/* Checkout Footer with Pay Button */}
        <CheckoutFooter cart={cart} />
        </div>
      </CheckoutSaveProvider>
    </PaymentWrapper>
  )
}
