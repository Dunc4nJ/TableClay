"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Button, Text } from "@medusajs/ui"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { groupItemsByBundle } from "@modules/cart/utils/bundles"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = cartState?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)

  const formatPrice = (cents: number) => {
    return convertToLocale({
      amount: cents,
      currency_code: cartState?.currency_code || "USD",
    })
  }

  const timedOpen = () => {
    open()

    const timer = setTimeout(close, 5000)

    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }

    open()
  }

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname() ?? ""

  // open cart dropdown when modifying the cart items, but only if we're not on the cart page
  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, itemRef.current])

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <PopoverButton className="h-full">
          <LocalizedClientLink
            className="hover:text-ui-fg-base"
            href="/cart"
            data-testid="nav-cart-link"
          >{`Cart (${totalItems})`}</LocalizedClientLink>
        </PopoverButton>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="hidden small:block absolute top-[calc(100%+1px)] right-0 bg-white border-x border-b border-gray-200 w-[420px] text-ui-fg-base"
            data-testid="nav-cart-dropdown"
          >
            <div className="p-4 flex items-center justify-center">
              <h3 className="text-large-semi">Cart</h3>
            </div>
            {cartState && cartState.items?.length ? (
              <>
                <div className="overflow-y-scroll max-h-[402px] px-4 grid grid-cols-1 gap-y-8 no-scrollbar p-px">
                  {(() => {
                    const { bundles, regularItems } = groupItemsByBundle(
                      cartState.items
                    )

                    const sortedRegularItems = regularItems.sort((a, b) => {
                      return (a.created_at ?? "") > (b.created_at ?? "")
                        ? -1
                        : 1
                    })

                    return (
                      <>
                        {bundles.map((bundle) => (
                          <div key={`bundle-${bundle.bundleInstanceId}`}>
                            <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-ui-fg-subtle">
                                    Bundle
                                  </span>
                                  <Text className="text-sm font-semibold text-ui-fg-base">
                                    {bundle.bundleName}
                                  </Text>
                                  {bundle.bundleBadgeText && (
                                    <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] px-2 py-1 rounded-full bg-black text-white">
                                      {bundle.bundleBadgeText}
                                    </span>
                                  )}
                                  {bundle.bundlePricing &&
                                    bundle.bundlePricing.savings > 0 && (
                                      <span className="text-[0.6rem] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                                        Save{" "}
                                        {formatPrice(
                                          bundle.bundlePricing.savings
                                        )}
                                      </span>
                                    )}
                                </div>
                                {bundle.bundlePricing && (
                                  <div className="text-right">
                                    <div className="text-xs text-ui-fg-muted line-through">
                                      {formatPrice(
                                        bundle.bundlePricing.originalPrice
                                      )}
                                    </div>
                                    <div className="text-sm font-semibold text-ui-fg-base">
                                      {formatPrice(
                                        bundle.bundlePricing.salePrice
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {bundle.bundlePricing &&
                                bundle.bundlePricing.savings > 0 && (
                                <Text className="text-xs text-ui-fg-subtle mt-1">
                                  Bundle discount -{" "}
                                  {formatPrice(bundle.bundlePricing.savings)}
                                </Text>
                              )}
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-y-6">
                              {bundle.items.map((item) => {
                                const metadata = item.metadata as Record<
                                  string,
                                  unknown
                                >
                                const bundleInstanceId = metadata
                                  ?.bundle_instance_id as string | undefined

                                return (
                                  <div
                                    className="grid grid-cols-[122px_1fr] gap-x-4"
                                    key={item.id}
                                    data-testid="cart-item"
                                  >
                                    <LocalizedClientLink
                                      href={`/products/${item.product_handle}`}
                                      className="w-24"
                                    >
                                      <Thumbnail
                                        thumbnail={item.thumbnail}
                                        images={item.variant?.product?.images}
                                        size="square"
                                      />
                                    </LocalizedClientLink>
                                    <div className="flex flex-col justify-between flex-1">
                                      <div className="flex flex-col flex-1">
                                        <div className="flex items-start justify-between">
                                          <div className="flex flex-col overflow-ellipsis whitespace-nowrap mr-4 w-[180px]">
                                            <h3 className="text-base-regular overflow-hidden text-ellipsis">
                                              <LocalizedClientLink
                                                href={`/products/${item.product_handle}`}
                                                data-testid="product-link"
                                              >
                                                {item.title}
                                              </LocalizedClientLink>
                                            </h3>
                                            <LineItemOptions
                                              variant={item.variant}
                                              data-testid="cart-item-variant"
                                              data-value={item.variant}
                                            />
                                            <span
                                              data-testid="cart-item-quantity"
                                              data-value={item.quantity}
                                            >
                                              Quantity: {item.quantity}
                                            </span>
                                          </div>
                                          <div className="flex justify-end">
                                            <LineItemPrice
                                              item={item}
                                              style="tight"
                                              currencyCode={
                                                cartState.currency_code
                                              }
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      <DeleteButton
                                        id={item.id}
                                        bundleInstanceId={bundleInstanceId}
                                        className="mt-1"
                                        data-testid="cart-item-remove-button"
                                      >
                                        Remove
                                      </DeleteButton>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                        {sortedRegularItems.map((item) => {
                          const metadata = item.metadata as Record<
                            string,
                            unknown
                          >
                          const bundleInstanceId = metadata
                            ?.bundle_instance_id as string | undefined

                          return (
                            <div
                              className="grid grid-cols-[122px_1fr] gap-x-4"
                              key={item.id}
                              data-testid="cart-item"
                            >
                              <LocalizedClientLink
                                href={`/products/${item.product_handle}`}
                                className="w-24"
                              >
                                <Thumbnail
                                  thumbnail={item.thumbnail}
                                  images={item.variant?.product?.images}
                                  size="square"
                                />
                              </LocalizedClientLink>
                              <div className="flex flex-col justify-between flex-1">
                                <div className="flex flex-col flex-1">
                                  <div className="flex items-start justify-between">
                                    <div className="flex flex-col overflow-ellipsis whitespace-nowrap mr-4 w-[180px]">
                                      <h3 className="text-base-regular overflow-hidden text-ellipsis">
                                        <LocalizedClientLink
                                          href={`/products/${item.product_handle}`}
                                          data-testid="product-link"
                                        >
                                          {item.title}
                                        </LocalizedClientLink>
                                      </h3>
                                      <LineItemOptions
                                        variant={item.variant}
                                        data-testid="cart-item-variant"
                                        data-value={item.variant}
                                      />
                                      <span
                                        data-testid="cart-item-quantity"
                                        data-value={item.quantity}
                                      >
                                        Quantity: {item.quantity}
                                      </span>
                                    </div>
                                    <div className="flex justify-end">
                                      <LineItemPrice
                                        item={item}
                                        style="tight"
                                        currencyCode={cartState.currency_code}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <DeleteButton
                                  id={item.id}
                                  bundleInstanceId={bundleInstanceId}
                                  className="mt-1"
                                  data-testid="cart-item-remove-button"
                                >
                                  Remove
                                </DeleteButton>
                              </div>
                            </div>
                          )
                        })}
                      </>
                    )
                  })()}
                </div>
                <div className="p-4 flex flex-col gap-y-4 text-small-regular">
                  <div className="flex items-center justify-between">
                    <span className="text-ui-fg-base font-semibold">
                      Subtotal{" "}
                      <span className="font-normal">(excl. taxes)</span>
                    </span>
                    <span
                      className="text-large-semi"
                      data-testid="cart-subtotal"
                      data-value={subtotal}
                    >
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: cartState.currency_code,
                      })}
                    </span>
                  </div>
                  <LocalizedClientLink href="/cart" passHref>
                    <Button
                      className="w-full"
                      size="large"
                      data-testid="go-to-cart-button"
                    >
                      Go to cart
                    </Button>
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div>
                <div className="flex py-16 flex-col gap-y-4 items-center justify-center">
                  <div className="bg-gray-900 text-small-regular flex items-center justify-center w-6 h-6 rounded-full text-white">
                    <span>0</span>
                  </div>
                  <span>Your shopping bag is empty.</span>
                  <div>
                    <LocalizedClientLink href="/store">
                      <>
                        <span className="sr-only">Go to all products page</span>
                        <Button onClick={close}>Explore products</Button>
                      </>
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
