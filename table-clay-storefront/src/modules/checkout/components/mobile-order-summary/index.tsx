"use client"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

type MobileOrderSummaryProps = {
  cart: HttpTypes.StoreCart
}

const MobileOrderSummary = ({ cart }: MobileOrderSummaryProps) => {
  const items = cart.items
  const itemCount = items?.length ?? 0
  const total = cart.total ?? 0
  const currencyCode = cart.currency_code ?? "usd"

  if (itemCount === 0) return null

  return (
    <div className="small:hidden mb-6">
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer list-none py-3 px-4 bg-ui-bg-component rounded-lg border border-cream-300 [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ui-fg-base">
              Order summary
            </span>
            <span className="text-xs text-ui-fg-muted">
              ({itemCount} {itemCount === 1 ? "item" : "items"})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ui-fg-base">
              {convertToLocale({ amount: total, currency_code: currencyCode })}
            </span>
            <svg
              className="w-4 h-4 text-ui-fg-muted transition-transform duration-200 group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </summary>
        <div className="mt-2 px-4 py-3 bg-ui-bg-component rounded-lg border border-cream-300">
          <div className="flex flex-col divide-y divide-cream-200">
            {items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                {item.thumbnail && (
                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-ui-bg-subtle">
                    <Image
                      src={item.thumbnail}
                      alt={item.product_title ?? ""}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ui-fg-base truncate">
                    {item.product_title}
                  </p>
                  {item.variant?.title &&
                    item.variant.title !== "Default variant" && (
                      <p className="text-xs text-ui-fg-muted truncate">
                        {item.variant.title}
                      </p>
                    )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm text-ui-fg-base">
                    {convertToLocale({
                      amount: item.total ?? 0,
                      currency_code: currencyCode,
                    })}
                  </p>
                  {(item.quantity ?? 1) > 1 && (
                    <p className="text-xs text-ui-fg-muted">
                      Qty: {item.quantity}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  )
}

export default MobileOrderSummary
