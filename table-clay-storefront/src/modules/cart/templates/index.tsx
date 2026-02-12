import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import CartRecommendations from "../components/cart-recommendations"
import AutoShippingSelector from "../components/auto-shipping-selector"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@medusajs/ui"

const getCheckoutStep = (cart: HttpTypes.StoreCart) => {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  }
  if (!cart?.shipping_methods?.length) {
    return "delivery"
  }
  return "payment"
}

const CartTemplate = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
  return (
    <div className="py-12">
      <div className="content-container" data-testid="cart-container">
        {cart?.items?.length ? (
          <>
            <AutoShippingSelector cart={cart} />
            <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-40">
            <div className="flex flex-col bg-transparent py-6 gap-y-4">
              <ItemsTemplate cart={cart} />
              <div className="small:hidden">
                <LocalizedClientLink
                  href={`/checkout?step=${getCheckoutStep(cart)}`}
                  data-testid="checkout-button-mobile"
                >
                  <Button className="w-full h-10 bg-brand-700 hover:bg-brand-800 text-white border-0">
                    Go to checkout
                  </Button>
                </LocalizedClientLink>
                <div className="flex items-center justify-center gap-x-3 mt-3 text-xs text-ui-fg-subtle">
                  <span className="flex items-center gap-x-1">
                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                    Ships in 24hrs
                  </span>
                  <span className="text-ui-fg-muted">·</span>
                  <span className="flex items-center gap-x-1">
                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    14-day returns
                  </span>
                  <span className="text-ui-fg-muted">·</span>
                  <span className="flex items-center gap-x-1">
                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Damage protection
                  </span>
                </div>
              </div>
              {cart.region && (
                <CartRecommendations
                  cart={cart}
                  region={cart.region}
                  showDiscountBadge={Boolean(cart.items?.length)}
                />
              )}
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-8 sticky top-12">
                {cart && cart.region && (
                  <>
                    <div className="bg-transparent py-6">
                      <Summary cart={cart as any} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          </>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
