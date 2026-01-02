import React from "react"
import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table, Text, Badge } from "@medusajs/ui"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

type BundleGroup = {
  bundleInstanceId: string
  bundleName: string
  bundlePricing?: {
    originalPrice: number
    salePrice: number
    savings: number
    savingsPercent: number
  }
  items: HttpTypes.StoreCartLineItem[]
}

/**
 * Group cart items by bundle_instance_id
 * Returns: { bundles: BundleGroup[], regularItems: StoreCartLineItem[] }
 */
function groupItemsByBundle(items: HttpTypes.StoreCartLineItem[]): {
  bundles: BundleGroup[]
  regularItems: HttpTypes.StoreCartLineItem[]
} {
  const bundleMap = new Map<string, BundleGroup>()
  const regularItems: HttpTypes.StoreCartLineItem[] = []

  for (const item of items) {
    const metadata = item.metadata as Record<string, unknown> | null
    const bundleInstanceId = metadata?.bundle_instance_id as string | undefined

    if (bundleInstanceId) {
      if (!bundleMap.has(bundleInstanceId)) {
        bundleMap.set(bundleInstanceId, {
          bundleInstanceId,
          bundleName: (metadata?.bundle_name as string) || "Bundle",
          bundlePricing:
            metadata?.bundle_original_price !== undefined
              ? {
                  originalPrice: metadata.bundle_original_price as number,
                  salePrice: metadata.bundle_sale_price as number,
                  savings: metadata.bundle_savings as number,
                  savingsPercent: metadata.bundle_savings_percent as number,
                }
              : undefined,
          items: [],
        })
      }
      bundleMap.get(bundleInstanceId)!.items.push(item)
    } else {
      regularItems.push(item)
    }
  }

  return {
    bundles: Array.from(bundleMap.values()),
    regularItems,
  }
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
        <div className="flex items-center gap-2">
          <Badge color="purple" size="small">
            Bundle
          </Badge>
          <Text className="font-semibold text-ui-fg-base">{bundle.bundleName}</Text>
        </div>
        {bundle.bundlePricing && (
          <Text className="text-xs text-ui-fg-subtle mt-1">
            {bundle.items.length} items • Save{" "}
            {formatPrice(bundle.bundlePricing.savings)} (
            {bundle.bundlePricing.savingsPercent.toFixed(0)}% off)
          </Text>
        )}
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
