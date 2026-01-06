import { HttpTypes } from "@medusajs/types"

export type BundlePricing = {
  originalPrice: number
  salePrice: number
  savings: number
  savingsPercent: number
}

export type BundleGroup = {
  bundleInstanceId: string
  bundleName: string
  bundleBadgeText?: string | null
  bundlePricing?: BundlePricing
  items: HttpTypes.StoreCartLineItem[]
}

const getBundlePricing = (
  metadata: Record<string, unknown> | null
): BundlePricing | undefined => {
  if (!metadata) {
    return undefined
  }

  const original = Number(metadata.bundle_original_price)
  const sale = Number(metadata.bundle_sale_price)
  const savings = Number(metadata.bundle_savings)
  const savingsPercent = Number(metadata.bundle_savings_percent)

  if (Number.isNaN(original) || Number.isNaN(sale) || Number.isNaN(savings)) {
    return undefined
  }

  return {
    originalPrice: original,
    salePrice: sale,
    savings,
    savingsPercent: Number.isNaN(savingsPercent) ? 0 : savingsPercent,
  }
}

/**
 * Group cart items by bundle_instance_id
 * Returns: { bundles: BundleGroup[], regularItems: StoreCartLineItem[] }
 */
export function groupItemsByBundle(items: HttpTypes.StoreCartLineItem[]): {
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
          bundleBadgeText: (metadata?.bundle_badge_text as string) || null,
          bundlePricing: getBundlePricing(metadata),
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
