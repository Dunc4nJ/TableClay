"use client"

import { useState } from "react"
import type { Bundle } from "@lib/data/bundles"
import { clx } from "@medusajs/ui"

type BundleSelectorProps = {
  bundles: Bundle[]
  selectedBundleId: string | null
  onSelect: (bundle: Bundle) => void
  promoText?: string
  disabled?: boolean
}

/**
 * Format price in cents to display string
 */
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Badge component for bundle options
 */
function BundleBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black text-white text-xs font-medium rounded">
      <span className="text-yellow-400">★</span>
      {text}
    </span>
  )
}

/**
 * BundleSelector Component
 * Displays bundle tiers as radio buttons for product pages
 * Replaces the variant selector when bundles are available
 */
export default function BundleSelector({
  bundles,
  selectedBundleId,
  onSelect,
  promoText,
  disabled = false,
}: BundleSelectorProps) {
  if (!bundles || bundles.length === 0) {
    return null
  }

  return (
    <div className="w-full border border-gray-300 rounded-lg p-4 bg-white">
      {/* Header with decorative lines */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-px bg-gray-300" />
        <h3 className="text-lg font-semibold tracking-wide text-gray-900">
          BUNDLE & SAVE
        </h3>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      {/* Promo text banner */}
      {promoText && (
        <p className="text-center text-sm text-gray-700 mb-4">{promoText}</p>
      )}

      {/* Bundle options */}
      <div className="flex flex-col gap-2">
        {bundles.map((bundle) => {
          const isSelected = selectedBundleId === bundle.id

          return (
            <button
              key={bundle.id}
              type="button"
              onClick={() => !disabled && onSelect(bundle)}
              disabled={disabled}
              className={clx(
                "w-full p-3 rounded-lg border transition-all text-left",
                "flex items-start gap-3",
                isSelected
                  ? "border-black bg-gray-50"
                  : "border-gray-200 hover:border-gray-400",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Radio circle */}
              <div
                className={clx(
                  "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  isSelected ? "border-black" : "border-gray-400"
                )}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-black" />
                )}
              </div>

              {/* Bundle info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      {bundle.name}
                    </span>
                    {bundle.description && (
                      <p className="text-sm text-gray-600 mt-0.5">
                        {bundle.description}
                      </p>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-gray-900">
                      {formatPrice(bundle.sale_price)}
                    </div>
                    {bundle.original_price > bundle.sale_price && (
                      <div className="text-sm text-gray-500 line-through">
                        {formatPrice(bundle.original_price)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Badge */}
                {bundle.badge_text && (
                  <div className="mt-2 flex justify-end">
                    <BundleBadge text={bundle.badge_text} />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { BundleSelector }
