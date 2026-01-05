"use client"

import { addToCart } from "@lib/data/cart"
import { Bundle } from "@lib/data/bundles"
import type { BundlePromoSettings } from "@lib/data/settings"
import { useIntersection } from "@lib/hooks/use-in-view"
import { Spinner } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import BundleSelector, { SingleItemOption } from "@modules/products/components/bundle-selector"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  bundles?: Bundle[]
  bundleSettings?: BundlePromoSettings
}

/** Selection mode for bundle products */
type SelectionMode = "single" | "bundle"

const ADD_TO_CART_BASE_CLASSES =
  "w-full h-12 lg:h-10 rounded-lg font-medium text-base transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2"

const getAddToCartClasses = (isDisabled: boolean, isLoading: boolean) =>
  clx(
    ADD_TO_CART_BASE_CLASSES,
    isDisabled
      ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
      : "bg-brand-500 hover:bg-brand-600 text-white shadow-md hover:shadow-lg",
    isLoading && "opacity-90 cursor-wait"
  )

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
  bundles = [],
  bundleSettings,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null)
  // Track selection mode: single item or bundle
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("single")
  const countryCode = useParams().countryCode as string

  // Determine if we should show bundles (when available)
  const hasBundles = bundles.length > 0

  // Build single item option from first variant
  const singleItemOption = useMemo<SingleItemOption | undefined>(() => {
    const variant = product.variants?.[0]
    if (!variant?.calculated_price) return undefined

    const price = variant.calculated_price.calculated_amount ?? 0
    const originalPrice = variant.calculated_price.original_amount ?? price

    // Only show variant title if it's not generic
    const genericTitles = ["standard", "default", "one size", "regular", "-"]
    const variantTitle = variant.title && !genericTitles.includes(variant.title.toLowerCase())
      ? variant.title
      : undefined

    return {
      productName: product.title || "Product",
      price,
      originalPrice: originalPrice > price ? originalPrice : undefined,
      variantTitle,
    }
  }, [product])

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // Add the selected variant or bundle to cart
  const handleAddToCart = async () => {
    setIsAdding(true)

    try {
      if (hasBundles && selectionMode === "bundle" && selectedBundle) {
        // Bundle flow: add all bundle items to cart
        for (const item of selectedBundle.items) {
          if (item.variant_id) {
            await addToCart({
              variantId: item.variant_id,
              quantity: item.quantity,
              countryCode,
            })
          }
        }
        // Note: Bundle discount is already reflected in the bundle pricing
        // displayed to the customer. Future: Add promotion workflow.
      } else {
        // Standard variant flow (single item)
        if (!selectedVariant?.id) return null

        await addToCart({
          variantId: selectedVariant.id,
          quantity: 1,
          countryCode,
        })
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
    }

    setIsAdding(false)
  }

  // Handle bundle selection
  const handleBundleSelect = (bundle: Bundle | null) => {
    if (bundle) {
      setSelectedBundle(bundle)
      setSelectionMode("bundle")
    }
  }

  // Handle single item selection
  const handleSingleSelect = () => {
    setSelectionMode("single")
    setSelectedBundle(null)
  }

  // Determine if add to cart should be enabled
  const canAddToCart = useMemo(() => {
    if (hasBundles) {
      // Bundle mode: need either single (with valid variant) or bundle selected
      if (selectionMode === "single") {
        return !!selectedVariant && inStock
      }
      return !!selectedBundle
    }
    // Standard mode: need valid variant in stock
    return !!selectedVariant && inStock && isValidVariant
  }, [hasBundles, selectionMode, selectedVariant, selectedBundle, inStock, isValidVariant])

  const showDisabledStyles = !canAddToCart || !!disabled
  const isAddToCartDisabled = showDisabledStyles || isAdding

  const bundleButtonLabel = () => {
    if (isAdding) return "Adding..."
    if (selectionMode === "single") {
      if (!selectedVariant || !isValidVariant) return "Select an option"
      if (!inStock) return "Out of stock"
      return "Add to Cart"
    }
    if (!selectedBundle) return "Select an option"
    return "Add to Cart"
  }

  const standardButtonLabel = () => {
    if (isAdding) return "Adding..."
    if (!selectedVariant || !isValidVariant) return "Select an option"
    if (!inStock) return "Out of stock"
    return "Add to Cart"
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        {/* Bundle Selector - shown when bundles exist */}
        {hasBundles ? (
          <div className="flex flex-col gap-y-4">
            <BundleSelector
              bundles={bundles}
              selectedBundleId={selectedBundle?.id || null}
              onSelect={handleBundleSelect}
              singleOption={singleItemOption}
              singleSelected={selectionMode === "single"}
              onSelectSingle={handleSingleSelect}
              headline={bundleSettings?.headline || undefined}
              promoText={bundleSettings?.enabled && bundleSettings?.promo_text ? bundleSettings.promo_text : undefined}
              disabled={!!disabled || isAdding}
            />

            <button
              onClick={handleAddToCart}
              type="button"
              disabled={isAddToCartDisabled}
              className={getAddToCartClasses(showDisabledStyles, isAdding)}
              data-testid="add-bundle-button"
            >
              {isAdding && <Spinner className="h-5 w-5 animate-spin" />}
              <span>{bundleButtonLabel()}</span>
            </button>
          </div>
        ) : (
          /* Standard Variant Selector */
          <>
            <div>
              {(product.variants?.length ?? 0) > 1 && (
                <div className="flex flex-col gap-y-4">
                  {(product.options || []).map((option) => {
                    return (
                      <div key={option.id}>
                        <OptionSelect
                          option={option}
                          current={options[option.id]}
                          updateOption={setOptionValue}
                          title={option.title ?? ""}
                          data-testid="product-options"
                          disabled={!!disabled || isAdding}
                        />
                      </div>
                    )
                  })}
                  <Divider />
                </div>
              )}
            </div>

            <ProductPrice product={product} variant={selectedVariant} />

            <button
              onClick={handleAddToCart}
              disabled={isAddToCartDisabled}
              type="button"
              className={getAddToCartClasses(showDisabledStyles, isAdding)}
              data-testid="add-product-button"
            >
              {isAdding && <Spinner className="h-5 w-5 animate-spin" />}
              <span>{standardButtonLabel()}</span>
            </button>
          </>
        )}

        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
