import { Metadata } from "next"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"
import NewsletterModal from "@modules/common/components/newsletter-modal"
import DiscountRetrievalButton from "@modules/common/components/discount-retrieval-button"
import AdditionalItemBanner from "@modules/common/components/additional-item-banner"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  const customer = await retrieveCustomer()
  const cart = await retrieveCart()
  let shippingOptions: StoreCartShippingOption[] = []
  const showAdditionalItemBanner = cart?.items && cart.items.length > 0

  if (cart) {
    const { shipping_options } = await listCartOptions()

    shippingOptions = shipping_options
  }

  return (
    <>
      <Nav />
      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}

      <AdditionalItemBanner visible={!!showAdditionalItemBanner} />

      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
      {props.children}
      <Footer />
      {/* Newsletter signup popup - shows once per 30 days */}
      <NewsletterModal />
      {/* Floating button to retrieve discount code after dismissing popup */}
      <DiscountRetrievalButton />
    </>
  )
}
