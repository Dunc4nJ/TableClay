import { convertToLocale } from "@lib/util/money"
import {
  FREE_SHIPPING_THRESHOLD,
  getAmountToFreeShipping,
} from "@lib/constants/free-shipping"

type FreeShippingBarProps = {
  itemSubtotal: number
  currencyCode: string
  className?: string
}

const FreeShippingBar = ({
  itemSubtotal,
  currencyCode,
  className = "",
}: FreeShippingBarProps) => {
  const subtotal = Math.max(itemSubtotal, 0)
  const amountNeeded = getAmountToFreeShipping(subtotal)
  const unlocked = amountNeeded === 0
  const progress = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  )

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 ${className}`}
      data-testid="free-shipping-progress"
    >
      <p className="text-sm text-amber-900">
        {unlocked ? (
          <span className="font-semibold">Free shipping unlocked!</span>
        ) : (
          <>
            Add{" "}
            <span className="font-semibold">
              {convertToLocale({ amount: amountNeeded, currency_code: currencyCode })}
            </span>{" "}
            more for free shipping
          </>
        )}
      </p>
      <div className="mt-2 h-2 w-full rounded-full bg-amber-100">
        <div
          role="progressbar"
          aria-label="Progress to free shipping"
          aria-valuemin={0}
          aria-valuemax={FREE_SHIPPING_THRESHOLD}
          aria-valuenow={Math.min(subtotal, FREE_SHIPPING_THRESHOLD)}
          className="h-full rounded-full bg-amber-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default FreeShippingBar
