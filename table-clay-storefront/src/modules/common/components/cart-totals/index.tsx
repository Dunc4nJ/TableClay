"use client"

import { convertToLocale } from "@lib/util/money"
import {
  FREE_SHIPPING_THRESHOLD,
  getAmountToFreeShipping,
  hasFreeShippingPromotion,
} from "@lib/constants/free-shipping"
import { HttpTypes } from "@medusajs/types"
import React from "react"

// Default shipping cost (Standard Shipping = $5.00 = 500 cents)
const DEFAULT_SHIPPING_COST = 500

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
    metadata?: Record<string, unknown> | null
  }
  promotions?: HttpTypes.StorePromotion[]
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals, promotions = [] }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
    metadata,
  } = totals

  // Get tip amount from cart metadata
  const tipAmount = (metadata?.tip_amount as number) || 0

  // Use default shipping cost if no shipping method selected
  const displayShipping = shipping_subtotal ?? DEFAULT_SHIPPING_COST

  // Calculate total including tip and default shipping if not already included
  const shippingAdjustment = (shipping_subtotal == null || shipping_subtotal === 0) ? DEFAULT_SHIPPING_COST : 0
  const totalWithTip = (total ?? 0) + tipAmount + shippingAdjustment

  // Check for free shipping threshold warning
  const hasFreeShipping = hasFreeShippingPromotion(promotions)
  const belowThreshold = (item_subtotal ?? 0) < FREE_SHIPPING_THRESHOLD
  const showThresholdWarning = hasFreeShipping && belowThreshold
  const amountNeeded = getAmountToFreeShipping(item_subtotal ?? 0)

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span>Subtotal (excl. shipping and taxes)</span>
          <span data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span data-testid="cart-shipping" data-value={displayShipping}>
            {convertToLocale({ amount: displayShipping, currency_code })}
          </span>
        </div>
        {showThresholdWarning && (
          <div className="text-sm text-amber-700 bg-amber-50 px-2 py-1.5 rounded">
            Add{" "}
            <span className="font-medium">
              {convertToLocale({ amount: amountNeeded, currency_code })}
            </span>{" "}
            more for free shipping
          </div>
        )}
        {!!discount_subtotal && (
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={discount_subtotal || 0}
            >
              -{" "}
              {convertToLocale({
                amount: discount_subtotal ?? 0,
                currency_code,
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="flex gap-x-1 items-center ">Taxes</span>
          <span data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({ amount: tax_total ?? 0, currency_code })}
          </span>
        </div>
        {tipAmount > 0 && (
          <div className="flex items-center justify-between">
            <span className="flex gap-x-1 items-center text-tc-terracotta">
              Tip
            </span>
            <span
              className="text-tc-terracotta"
              data-testid="cart-tip"
              data-value={tipAmount}
            >
              {convertToLocale({ amount: tipAmount, currency_code })}
            </span>
          </div>
        )}
      </div>
      <div className="h-px w-full border-b border-ui-border-base my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-2 txt-medium ">
        <span>Total</span>
        <span
          className="txt-xlarge-plus"
          data-testid="cart-total"
          data-value={totalWithTip}
        >
          {convertToLocale({ amount: totalWithTip, currency_code })}
        </span>
      </div>
      <div className="h-px w-full border-b border-ui-border-base mt-4" />
    </div>
  )
}

export default CartTotals
