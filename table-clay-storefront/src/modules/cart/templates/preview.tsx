"use client"

import React from "react"
import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Table, Text, clx } from "@medusajs/ui"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"
import { BundleGroup, groupItemsByBundle } from "@modules/cart/utils/bundles"

type ItemsTemplateProps = {
  cart: HttpTypes.StoreCart
}

const ItemsPreviewTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart.items
  const hasOverflow = items && items.length > 4

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cart.currency_code || "USD",
    }).format(cents / 100)
  }

  const { bundles, regularItems } = items
    ? groupItemsByBundle(items)
    : { bundles: [], regularItems: [] }

  const sortedRegularItems = regularItems.sort((a, b) => {
    return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  })

  return (
    <div
      className={clx({
        "pl-[1px] overflow-y-scroll overflow-x-hidden no-scrollbar max-h-[420px]":
          hasOverflow,
      })}
    >
      <Table>
        <Table.Body data-testid="items-table">
          {items ? (
            <>
              {bundles.map((bundle: BundleGroup) => (
                <React.Fragment key={`bundle-preview-${bundle.bundleInstanceId}`}>
                  <Table.Row className="bg-ui-bg-subtle border-t border-ui-border-strong">
                    <td colSpan={2} className="!pl-0 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[0.6rem] uppercase tracking-[0.2em] text-ui-fg-subtle">
                          Bundle
                        </span>
                        <Text className="font-semibold text-ui-fg-base text-sm">
                          {bundle.bundleName}
                        </Text>
                        {bundle.bundleBadgeText && (
                          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] px-2 py-1 rounded-full bg-black text-white">
                            {bundle.bundleBadgeText}
                          </span>
                        )}
                        {bundle.bundlePricing && bundle.bundlePricing.savings > 0 && (
                          <span className="text-[0.6rem] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                            Save {formatPrice(bundle.bundlePricing.savings)}
                          </span>
                        )}
                      </div>
                      {bundle.bundlePricing && bundle.bundlePricing.savings > 0 && (
                        <Text className="text-xs text-ui-fg-subtle mt-1">
                          Bundle discount - {formatPrice(bundle.bundlePricing.savings)}
                        </Text>
                      )}
                    </td>
                  </Table.Row>
                  {bundle.items.map((item) => (
                    <Item
                      key={item.id}
                      item={item}
                      type="preview"
                      currencyCode={cart.currency_code}
                      isBundleItem={true}
                    />
                  ))}
                </React.Fragment>
              ))}
              {sortedRegularItems.map((item) => (
                <Item
                  key={item.id}
                  item={item}
                  type="preview"
                  currencyCode={cart.currency_code}
                />
              ))}
            </>
          ) : (
            repeat(5).map((i) => <SkeletonLineItem key={i} />)
          )}
        </Table.Body>
      </Table>
    </div>
  )
}

export default ItemsPreviewTemplate
