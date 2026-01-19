import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import CartRecommendations from "../components/cart-recommendations"
import AutoShippingSelector from "../components/auto-shipping-selector"
import { HttpTypes } from "@medusajs/types"

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
              {cart.region && (
                <CartRecommendations cart={cart} region={cart.region} />
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
