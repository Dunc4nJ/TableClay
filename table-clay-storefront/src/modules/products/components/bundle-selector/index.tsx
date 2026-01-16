"use client"

import type { Bundle, BundleItem } from "@lib/data/bundles"
import { clx } from "@medusajs/ui"

/**
 * Single item option that appears first in the selector
 */
export type SingleItemOption = {
  productName: string
  price: number  // in cents
  originalPrice?: number  // in cents, for showing strikethrough
  variantTitle?: string  // e.g., "Standard" - shown if not generic
}

type BundleSelectorProps = {
  bundles: Bundle[]
  selectedBundleId: string | null
  onSelect: (bundle: Bundle | null) => void  // null means single item selected
  /** Single item purchase option - appears first when provided */
  singleOption?: SingleItemOption
  /** Whether single item is currently selected (when singleOption provided) */
  singleSelected?: boolean
  /** Callback when single item is selected */
  onSelectSingle?: () => void
  /** Configurable headline text (default: "BUNDLE & SAVE") */
  headline?: string
  promoText?: string
  disabled?: boolean
  /** If true, show the items included in each bundle */
  showItems?: boolean
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-900 text-white text-xs font-medium rounded">
      <span className="text-yellow-400">★</span>
      {text}
    </span>
  )
}

/**
 * Component to display bundle items
 */
/**
 * Get display name for a bundle item
 * Shows product title, and variant title only if it's not generic
 */
function getItemDisplayName(item: BundleItem): string {
  const productTitle = item.product_title || "Unknown Product"
  const variantTitle = item.variant_title

  // Skip variant title if it's generic (Standard, Default, etc.)
  const genericVariants = ["standard", "default", "one size", "regular"]
  const isGenericVariant = !variantTitle ||
    genericVariants.includes(variantTitle.toLowerCase())

  if (isGenericVariant) {
    return productTitle
  }

  return `${productTitle} (${variantTitle})`
}

function BundleItemsList({ items }: { items: BundleItem[] }) {
  return (
    <div className="mt-2 pl-4 border-l-2 border-ui-border-base">
      <div className="text-xs text-ui-fg-muted mb-1">Includes:</div>
      <ul className="space-y-0.5">
        {items.map((item, idx) => (
          <li key={item.id || idx} className="text-xs text-ui-fg-subtle">
            <div className="flex items-center gap-1">
              <span className="text-ui-fg-muted">•</span>
              <span>
                {item.quantity}x {getItemDisplayName(item)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * BundleSelector Component
 * Displays bundle tiers as radio buttons for product pages
 * Supports multi-product bundles where items can come from any product
 * Now includes optional single-item purchase as first option
 */
export default function BundleSelector({
  bundles,
  selectedBundleId,
  onSelect,
  singleOption,
  singleSelected = false,
  onSelectSingle,
  headline = "BUNDLE & SAVE",
  promoText,
  disabled = false,
  showItems = true,
}: BundleSelectorProps) {
  if (!bundles || bundles.length === 0) {
    return null
  }

  // Build single item display name
  const singleDisplayName = singleOption
    ? `Single – "${singleOption.productName}"`
    : null

  return (
    <div className="w-full border border-ui-border-base rounded-lg p-4 bg-ui-bg-component">
      {/* Header with decorative lines */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-px bg-cream-300" />
        <h3 className="text-lg font-semibold tracking-wide text-ui-fg-base">
          {headline}
        </h3>
        <div className="flex-1 h-px bg-cream-300" />
      </div>

      {/* Promo text banner - more prominent styling */}
      {promoText && (
        <p className="text-center text-sm font-medium text-ui-fg-base mb-4">
          <span className="mr-1">🎉</span>
          {promoText}
        </p>
      )}

      {/* Purchase options */}
      <div className="flex flex-col gap-3">
        {/* Single Item Option - First */}
        {singleOption && onSelectSingle && (
          <button
            type="button"
            onClick={() => !disabled && onSelectSingle()}
            disabled={disabled}
            className={clx(
              "w-full min-h-[60px] p-4 rounded-lg border transition-all text-left",
              "flex items-start gap-3",
              singleSelected
                ? "border-brand-600 bg-ui-bg-subtle"
                : "border-ui-border-base hover:border-ui-border-strong",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Radio circle */}
            <div
              className={clx(
                "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                singleSelected ? "border-brand-600" : "border-ui-border-strong"
              )}
            >
              {singleSelected && (
                <div className="w-2.5 h-2.5 rounded-full bg-brand-700" />
              )}
            </div>

            {/* Single item info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="font-medium text-ui-fg-base">
                    {singleDisplayName}
                  </span>
                  {singleOption.variantTitle && (
                    <p className="text-sm text-ui-fg-subtle mt-0.5">
                      {singleOption.variantTitle}
                    </p>
                  )}
                </div>

                {/* Pricing */}
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-ui-fg-base">
                    {formatPrice(singleOption.price)}
                  </div>
                  {singleOption.originalPrice && singleOption.originalPrice > singleOption.price && (
                    <div className="text-sm text-ui-fg-muted line-through">
                      {formatPrice(singleOption.originalPrice)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Bundle Options */}
        {bundles.map((bundle) => {
          const isSelected = !singleSelected && selectedBundleId === bundle.id

          return (
            <button
              key={bundle.id}
              type="button"
              onClick={() => !disabled && onSelect(bundle)}
              disabled={disabled}
              className={clx(
                "w-full min-h-[60px] p-4 rounded-lg border transition-all text-left",
                "flex items-start gap-3",
                isSelected
                  ? "border-brand-600 bg-ui-bg-subtle"
                  : "border-ui-border-base hover:border-ui-border-strong",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Radio circle */}
              <div
                className={clx(
                  "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  isSelected ? "border-brand-600" : "border-ui-border-strong"
                )}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-700" />
                )}
              </div>

              {/* Bundle info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-medium text-ui-fg-base">
                      {bundle.name}
                    </span>
                    {bundle.description && (
                      <p className="text-sm text-ui-fg-subtle mt-0.5">
                        {bundle.description}
                      </p>
                    )}
                  </div>

                  {/* Badge - positioned inline with name */}
                  {bundle.badge_text && (
                    <div className="flex-shrink-0 ml-2">
                      <BundleBadge text={bundle.badge_text} />
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-ui-fg-base">
                      {formatPrice(bundle.sale_price)}
                    </div>
                    {bundle.original_price > bundle.sale_price && (
                      <div className="text-sm text-ui-fg-muted line-through">
                        {formatPrice(bundle.original_price)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bundle items list (shown when selected) */}
                {showItems && isSelected && bundle.items && bundle.items.length > 0 && (
                  <BundleItemsList items={bundle.items} />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* "Save with bundles" messaging when single is selected - animated */}
      {singleSelected && bundles.length > 0 && (
        <p className="text-center text-base font-semibold text-amber-600 mt-4 animate-pulse">
          ✨ Save more with a bundle above
        </p>
      )}
    </div>
  )
}

export { BundleSelector }
