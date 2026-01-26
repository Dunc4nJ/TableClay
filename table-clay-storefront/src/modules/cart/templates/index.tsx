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
