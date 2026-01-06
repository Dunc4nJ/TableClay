import React from "react"
import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table, Text } from "@medusajs/ui"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"
import { BundleGroup, groupItemsByBundle } from "@modules/cart/utils/bundles"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

/**
 * Bundle header row component
 */
function BundleHeader({
  bundle,
  currencyCode,
}: {
  bundle: BundleGroup
  currencyCode?: string
}) {
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD",
    }).format(cents / 100)
  }

  return (
    <tr className="bg-ui-bg-subtle border-t-2 border-ui-border-strong">
      <td colSpan={2} className="!pl-0 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-ui-fg-subtle">
            Bundle
          </span>
          <Text className="font-semibold text-ui-fg-base">{bundle.bundleName}</Text>
          {bundle.bundleBadgeText && (
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] px-2 py-1 rounded-full bg-black text-white">
              {bundle.bundleBadgeText}
            </span>
          )}
        </div>
      </td>
      <td className="text-center p-4">
        <Text className="text-ui-fg-muted text-sm">{bundle.items.length} items</Text>
      </td>
      <td className="hidden small:table-cell p-4">
        {bundle.bundlePricing && (
          <Text className="line-through text-ui-fg-muted text-sm">
            {formatPrice(bundle.bundlePricing.originalPrice)}
          </Text>
        )}
      </td>
      <td className="!pr-0 text-right p-4">
        {bundle.bundlePricing && (
          <Text className="font-semibold text-ui-fg-base">
            {formatPrice(bundle.bundlePricing.salePrice)}
          </Text>
        )}
      </td>
    </tr>
  )
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cart?.currency_code || "USD",
    }).format(cents / 100)
  }

  // Group items by bundle
  const { bundles, regularItems } = items
    ? groupItemsByBundle(items)
    : { bundles: [], regularItems: [] }

  // Sort regular items by created_at
  const sortedRegularItems = regularItems.sort((a, b) => {
    return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  })

  return (
    <div>
      <div className="pb-3 flex items-center">
        <Heading className="text-[2rem] leading-[2.75rem]">Cart</Heading>
      </div>
      <Table>
        <Table.Header className="border-t-0">
          <Table.Row className="text-ui-fg-subtle txt-medium-plus">
            <Table.HeaderCell className="!pl-0">Item</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
            <Table.HeaderCell>Quantity</Table.HeaderCell>
            <Table.HeaderCell className="hidden small:table-cell">
              Price
            </Table.HeaderCell>
            <Table.HeaderCell className="!pr-0 text-right">
              Total
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items ? (
            <>
              {/* Render bundles first */}
              {bundles.map((bundle) => (
                <React.Fragment key={`bundle-${bundle.bundleInstanceId}`}>
                  <BundleHeader
                    bundle={bundle}
                    currencyCode={cart?.currency_code}
                  />
                  {bundle.items.map((item) => (
                    <Item
                      key={item.id}
                      item={item}
                      currencyCode={cart?.currency_code}
                      isBundleItem={true}
                    />
                  ))}
                  {bundle.bundlePricing && bundle.bundlePricing.savings > 0 && (
                    <tr className="border-t border-ui-border-base">
                      <td colSpan={5} className="py-2 !pl-0">
                        <div className="flex items-center justify-end">
                          <span className="text-sm font-semibold px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
                            Save {formatPrice(bundle.bundlePricing.savings)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}

              {/* Render regular items */}
              {sortedRegularItems.map((item) => (
                <Item
                  key={item.id}
                  item={item}
                  currencyCode={cart?.currency_code}
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

export default ItemsTemplate
