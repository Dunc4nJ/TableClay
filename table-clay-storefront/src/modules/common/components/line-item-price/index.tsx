import { getPercentageDiff } from "@lib/util/get-percentage-diff"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
}

const LineItemPrice = ({
  item,
  style = "default",
  currencyCode,
}: LineItemPriceProps) => {
  // Use subtotal (tax-exclusive) to match product page prices
  // Fall back to total for backwards compatibility with order line items
  const itemWithSubtotal = item as HttpTypes.StoreCartLineItem & {
    subtotal?: number
    original_subtotal?: number
    tax_total?: number
  }
  const currentPrice = itemWithSubtotal.subtotal ?? item.total ?? 0
  const originalPrice =
    itemWithSubtotal.original_subtotal ?? item.original_total ?? currentPrice
  const taxAmount = itemWithSubtotal.tax_total ?? 0
  const hasReducedPrice = currentPrice < originalPrice

  return (
    <div className="flex flex-col gap-x-2 text-ui-fg-subtle items-end">
      <div className="text-left">
        {hasReducedPrice && (
          <>
            <p>
              {style === "default" && (
                <span className="text-ui-fg-subtle">Original: </span>
              )}
              <span
                className="line-through text-ui-fg-muted"
                data-testid="product-original-price"
              >
                {convertToLocale({
                  amount: originalPrice,
                  currency_code: currencyCode,
                })}
              </span>
            </p>
            {style === "default" && (
              <span className="text-ui-fg-interactive">
                -{getPercentageDiff(originalPrice, currentPrice || 0)}%
              </span>
            )}
          </>
        )}
        <span
          className={clx("text-base-regular", {
            "text-ui-fg-interactive": hasReducedPrice,
          })}
          data-testid="product-price"
        >
          {convertToLocale({
            amount: currentPrice,
            currency_code: currencyCode,
          })}
        </span>
        {taxAmount > 0 && (
          <span className="text-xs text-ui-fg-muted block">
            +{convertToLocale({ amount: taxAmount, currency_code: currencyCode })}{" "}
            tax
          </span>
        )}
      </div>
    </div>
  )
}

export default LineItemPrice
