"use client"

import { useState, useCallback, useTransition } from "react"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { convertToLocale } from "@lib/util/money"
import { addTipToCart } from "@lib/data/cart"

interface TipSelectorProps {
  cart: HttpTypes.StoreCart
  onTipChange?: (tipAmount: number) => void
}

const TIP_PERCENTAGES = [
  { value: 0.1, label: "10%" },
  { value: 0.15, label: "15%" },
  { value: 0.2, label: "20%" },
  { value: 0, label: "None" },
]

const TipSelector: React.FC<TipSelectorProps> = ({ cart, onTipChange }) => {
  const [isPending, startTransition] = useTransition()
  const [showTip, setShowTip] = useState(true)
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(
    null
  )
  const [customTip, setCustomTip] = useState("")
  const [appliedTip, setAppliedTip] = useState<number>(
    (cart.metadata as any)?.tip_amount || 0
  )
  const [error, setError] = useState<string | null>(null)

  const subtotal = cart.subtotal || 0
  const currencyCode = cart.currency_code || "usd"

  const calculateTipAmount = (percentage: number) => {
    return Math.round(subtotal * percentage)
  }

  const formatPrice = (amount: number) => {
    return convertToLocale({
      amount,
      currency_code: currencyCode,
    })
  }

  const handlePercentageSelect = useCallback(
    (percentage: number) => {
      setSelectedPercentage(percentage)
      setCustomTip("")
      setError(null)

      const tipAmount = percentage === 0 ? 0 : calculateTipAmount(percentage)

      startTransition(async () => {
        try {
          await addTipToCart(cart.id, tipAmount)
          setAppliedTip(tipAmount)
          onTipChange?.(tipAmount)
        } catch (err: any) {
          setError(err.message || "Failed to add tip")
        }
      })
    },
    [subtotal, cart.id, onTipChange]
  )

  const handleCustomTipChange = (value: string) => {
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustomTip(value)
    }
  }

  const handleCustomTipApply = useCallback(() => {
    const amount = parseFloat(customTip) * 100 // Convert dollars to cents
    if (!isNaN(amount) && amount > 0) {
      setSelectedPercentage(null)
      setError(null)

      startTransition(async () => {
        try {
          await addTipToCart(cart.id, amount)
          setAppliedTip(amount)
          onTipChange?.(amount)
        } catch (err: any) {
          setError(err.message || "Failed to add tip")
        }
      })
    }
  }, [customTip, cart.id, onTipChange])

  const incrementCustomTip = () => {
    const current = parseFloat(customTip) || 0
    setCustomTip((current + 1).toFixed(2))
  }

  const decrementCustomTip = () => {
    const current = parseFloat(customTip) || 0
    if (current >= 1) {
      setCustomTip((current - 1).toFixed(2))
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {/* Enable/Disable Toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={showTip}
          onChange={(e) => {
            setShowTip(e.target.checked)
            if (!e.target.checked) {
              setSelectedPercentage(null)
              setAppliedTip(0)
              onTipChange?.(0)
            }
          }}
          className="w-4 h-4 text-amber-700 bg-white border-gray-300 rounded focus:ring-amber-600"
        />
        <span className="text-sm text-gray-700">
          Show your support for the team at Table Clay
        </span>
      </label>

      {showTip && (
        <>
          {/* Percentage Options */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {TIP_PERCENTAGES.map((tip) => (
              <button
                key={tip.label}
                type="button"
                onClick={() => handlePercentageSelect(tip.value)}
                className={clx(
                  "py-3 px-2 rounded border text-center transition-colors",
                  selectedPercentage === tip.value
                    ? "border-amber-700 bg-amber-50 ring-1 ring-amber-700"
                    : "border-gray-300 bg-white hover:border-gray-400"
                )}
              >
                <div className="text-sm font-medium text-gray-900">
                  {tip.label}
                </div>
                {tip.value > 0 && (
                  <div className="text-xs text-gray-500">
                    {formatPrice(calculateTipAmount(tip.value))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Custom Tip */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-gray-600">Custom tip</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={customTip}
                onChange={(e) => handleCustomTipChange(e.target.value)}
                placeholder="0.00"
                className="w-24 pl-7 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-600 focus:border-amber-600"
              />
            </div>
            <button
              type="button"
              onClick={decrementCustomTip}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-600"
            >
              −
            </button>
            <button
              type="button"
              onClick={incrementCustomTip}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-600"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleCustomTipApply}
              disabled={!customTip || parseFloat(customTip) <= 0}
              className="px-4 py-2 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add tip
            </button>
          </div>

          {/* Loading State */}
          {isPending && (
            <div className="mt-4 flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-700"></div>
              <span className="text-sm">Applying tip...</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Applied Tip Display */}
          {appliedTip > 0 && !isPending && !error && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm text-amber-800">
                Tip added: {formatPrice(appliedTip)}
              </p>
            </div>
          )}

          {/* Thank you message */}
          <p className="text-sm text-gray-500 mt-4">
            Thank you, we appreciate your support!
          </p>
        </>
      )}
    </div>
  )
}

export default TipSelector
