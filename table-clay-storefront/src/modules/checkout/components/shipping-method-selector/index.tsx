"use client"

import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import { Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import MedusaRadio from "@modules/common/components/radio"
import ErrorMessage from "@modules/checkout/components/error-message"
import { useEffect, useMemo, useState } from "react"

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

interface ShippingMethodSelectorProps {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

function formatAddress(address: HttpTypes.StoreCartAddress) {
  if (!address) return ""

  let ret = ""
  if (address.address_1) ret += ` ${address.address_1}`
  if (address.address_2) ret += `, ${address.address_2}`
  if (address.postal_code) ret += `, ${address.postal_code} ${address.city}`
  if (address.country_code) ret += `, ${address.country_code.toUpperCase()}`

  return ret
}

const ShippingMethodSelector: React.FC<ShippingMethodSelectorProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [showPickupOptions, setShowPickupOptions] =
    useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const shippingMethods = useMemo(
    () =>
      availableShippingMethods?.filter(
        (sm) => (sm as any).service_zone?.fulfillment_set?.type !== "pickup"
      ) || [],
    [availableShippingMethods]
  )

  const pickupMethods = useMemo(
    () =>
      availableShippingMethods?.filter(
        (sm) => (sm as any).service_zone?.fulfillment_set?.type === "pickup"
      ) || [],
    [availableShippingMethods]
  )

  const hasPickupOptions = pickupMethods.length > 0
  const hasShippingAddress = !!cart?.shipping_address?.address_1

  // Calculate prices for calculated shipping options
  useEffect(() => {
    if (!hasShippingAddress) {
      setIsLoadingPrices(false)
      return
    }

    setIsLoadingPrices(true)

    if (shippingMethods.length) {
      const promises = shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled")
            .forEach((p) => (pricesMap[p.value?.id || ""] = p.value?.amount!))

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      } else {
        setIsLoadingPrices(false)
      }
    } else {
      setIsLoadingPrices(false)
    }

    if (pickupMethods.find((m) => m.id === shippingMethodId)) {
      setShowPickupOptions(PICKUP_OPTION_ON)
    }
  }, [shippingMethods, pickupMethods, hasShippingAddress, cart.id, shippingMethodId])

  const handleSetShippingMethod = async (
    id: string,
    variant: "shipping" | "pickup"
  ) => {
    setError(null)

    if (variant === "pickup") {
      setShowPickupOptions(PICKUP_OPTION_ON)
    } else {
      setShowPickupOptions(PICKUP_OPTION_OFF)
    }

    let currentId: string | null = null
    setIsLoading(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setShippingMethodId(currentId)
        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  // Show placeholder when no shipping address
  if (!hasShippingAddress) {
    return (
      <div className="bg-ui-bg-subtle rounded-lg p-6 text-center">
        <p className="text-ui-fg-muted text-sm">
          Enter your shipping address to view available shipping methods.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Pickup Options */}
      {hasPickupOptions && (
        <div className="mb-4">
          <RadioGroup
            value={showPickupOptions}
            onChange={(value) => {
              const id = pickupMethods.find(
                (option) => !option.insufficient_inventory
              )?.id

              if (id) {
                handleSetShippingMethod(id, "pickup")
              }
            }}
          >
            <Radio
              value={PICKUP_OPTION_ON}
              data-testid="delivery-option-radio"
              className={clx(
                "flex items-center justify-between text-sm cursor-pointer py-4 border rounded-lg px-4 hover:border-ui-border-strong transition-colors",
                {
                  "border-tc-terracotta bg-tc-cream ring-1 ring-tc-terracotta":
                    showPickupOptions === PICKUP_OPTION_ON,
                  "border-ui-border-base": showPickupOptions !== PICKUP_OPTION_ON,
                }
              )}
            >
              <div className="flex items-center gap-x-4">
                <MedusaRadio checked={showPickupOptions === PICKUP_OPTION_ON} />
                <span className="font-medium">Pick up your order</span>
              </div>
              <span className="text-ui-fg-muted">Free</span>
            </Radio>
          </RadioGroup>
        </div>
      )}

      {/* Shipping Methods */}
      {showPickupOptions === PICKUP_OPTION_OFF && (
        <RadioGroup
          value={shippingMethodId}
          onChange={(v) => {
            if (v) handleSetShippingMethod(v, "shipping")
          }}
        >
          <div className="space-y-2">
            {shippingMethods.map((option) => {
              const isDisabled =
                option.price_type === "calculated" &&
                !isLoadingPrices &&
                typeof calculatedPricesMap[option.id] !== "number"

              return (
                <Radio
                  key={option.id}
                  value={option.id}
                  data-testid="delivery-option-radio"
                  disabled={isDisabled}
                  className={clx(
                    "flex items-center justify-between text-sm cursor-pointer py-4 border rounded-lg px-4 transition-colors",
                    {
                      "border-tc-terracotta bg-tc-cream ring-1 ring-tc-terracotta":
                        option.id === shippingMethodId,
                      "border-ui-border-base hover:border-ui-border-strong":
                        option.id !== shippingMethodId && !isDisabled,
                      "border-ui-border-base opacity-50 cursor-not-allowed":
                        isDisabled,
                    }
                  )}
                >
                  <div className="flex items-center gap-x-4">
                    <MedusaRadio checked={option.id === shippingMethodId} />
                    <span className="font-medium">{option.name}</span>
                  </div>
                  <span className="text-ui-fg-subtle font-medium">
                    {option.price_type === "flat" ? (
                      convertToLocale({
                        amount: option.amount!,
                        currency_code: cart?.currency_code,
                      })
                    ) : calculatedPricesMap[option.id] ? (
                      convertToLocale({
                        amount: calculatedPricesMap[option.id],
                        currency_code: cart?.currency_code,
                      })
                    ) : isLoadingPrices ? (
                      <Loader className="animate-spin" />
                    ) : (
                      "-"
                    )}
                  </span>
                </Radio>
              )
            })}
          </div>
        </RadioGroup>
      )}

      {/* Pickup Store Selection */}
      {showPickupOptions === PICKUP_OPTION_ON && (
        <div className="mt-4">
          <p className="text-sm text-ui-fg-subtle mb-3">Choose a store near you:</p>
          <RadioGroup
            value={shippingMethodId}
            onChange={(v) => {
              if (v) handleSetShippingMethod(v, "pickup")
            }}
          >
            <div className="space-y-2">
              {pickupMethods.map((option) => (
                <Radio
                  key={option.id}
                  value={option.id}
                  disabled={option.insufficient_inventory}
                  data-testid="pickup-option-radio"
                  className={clx(
                    "flex items-center justify-between text-sm cursor-pointer py-4 border rounded-lg px-4 transition-colors",
                    {
                      "border-tc-terracotta bg-tc-cream ring-1 ring-tc-terracotta":
                        option.id === shippingMethodId,
                      "border-ui-border-base hover:border-ui-border-strong":
                        option.id !== shippingMethodId &&
                        !option.insufficient_inventory,
                      "border-ui-border-base opacity-50 cursor-not-allowed":
                        option.insufficient_inventory,
                    }
                  )}
                >
                  <div className="flex items-start gap-x-4">
                    <MedusaRadio checked={option.id === shippingMethodId} />
                    <div className="flex flex-col">
                      <span className="font-medium">{option.name}</span>
                      <span className="text-ui-fg-muted text-xs">
                        {formatAddress(
                          (option as any).service_zone?.fulfillment_set?.location
                            ?.address as HttpTypes.StoreCartAddress
                        )}
                      </span>
                    </div>
                  </div>
                  <span className="text-ui-fg-subtle font-medium">
                    {convertToLocale({
                      amount: option.amount!,
                      currency_code: cart?.currency_code,
                    })}
                  </span>
                </Radio>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-4 flex items-center gap-2 text-ui-fg-muted">
          <Loader className="animate-spin h-4 w-4" />
          <span className="text-sm">Updating shipping method...</span>
        </div>
      )}

      <ErrorMessage error={error} data-testid="shipping-method-error-message" />
    </div>
  )
}

export default ShippingMethodSelector
