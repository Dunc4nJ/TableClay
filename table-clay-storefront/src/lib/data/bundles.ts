"use server"

import { sdk } from "@lib/config"
import { getCacheOptions, getCacheTag } from "./cookies"

// Types for bundle data
export type BundleItemVariant = {
  id: string
  title: string
  sku?: string
  product?: {
    id: string
    title: string
    thumbnail?: string
  } | null
}

export type BundleItem = {
  id: string
  variant_id: string
  quantity: number
  sort_order: number
  variant: BundleItemVariant | null
}

export type Bundle = {
  id: string
  name: string
  description?: string | null
  pricing_type: "fixed" | "percentage"
  original_price: number
  sale_price: number
  savings: number
  savings_percent: number
  badge: "bestseller" | "popular" | "new" | "limited" | "sale" | "none"
  badge_text: string | null
  sort_order: number
  items: BundleItem[]
}

type BundlesResponse = {
  success: boolean
  bundles: Bundle[]
  error?: string
}

/**
 * Fetch bundles for a product
 * Used by BundleSelector component on product pages
 */
export async function getBundlesForProduct(
  productId: string
): Promise<Bundle[]> {
  if (!productId) {
    return []
  }

  const next = {
    ...(await getCacheOptions("products")),
    revalidate: 60, // Revalidate every 60 seconds
  }

  try {
    const response = await sdk.client.fetch<BundlesResponse>(
      `/store/bundles?product_id=${productId}`,
      {
        method: "GET",
        next,
      }
    )

    if (response.success && response.bundles) {
      return response.bundles
    }

    return []
  } catch (error) {
    console.error("Error fetching bundles:", error)
    return []
  }
}

type ApplyBundleResponse = {
  success: boolean
  bundle_ref?: string
  bundle_name?: string
  discount_amount?: number
  discount_formatted?: string
  original_price?: number
  sale_price?: number
  savings_percent?: number
  message?: string
  items?: Array<{ variant_id: string; quantity: number }>
  error?: string
}

/**
 * Get bundle discount information for the cart
 * Returns discount calculation details for display
 */
export async function applyBundleToCart(
  cartId: string,
  bundleId: string
): Promise<ApplyBundleResponse> {
  try {
    const response = await sdk.client.fetch<ApplyBundleResponse>(
      "/store/cart/apply-bundle",
      {
        method: "POST",
        body: {
          cart_id: cartId,
          bundle_id: bundleId,
        },
      }
    )

    return response
  } catch (error) {
    console.error("Error applying bundle:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to apply bundle",
    }
  }
}
