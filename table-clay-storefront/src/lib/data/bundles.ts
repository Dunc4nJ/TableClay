"use server"

import { sdk } from "@lib/config"
import { revalidateTag } from "next/cache"
import { getCacheOptions, getCacheTag, getCartId } from "./cookies"

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
  product_id: string
  variant_id: string
  quantity: number
  sort_order: number
  product_title?: string | null
  variant_title?: string | null
  variant?: BundleItemVariant | null
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
 * @deprecated Use addBundleToCart instead for actually adding bundles
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

// Types for add bundle to cart response
type AddBundleToCartResponse = {
  success: boolean
  bundle_name?: string
  bundle_instance_id?: string
  items_added?: number
  bundle_pricing?: {
    original_price: number
    sale_price: number
    savings: number
    savings_percent: number
  }
  message?: string
  error?: string
}

/**
 * Add a bundle to the cart
 * This adds all bundle items as line items with bundle metadata
 */
export async function addBundleToCart(
  cartId: string,
  bundleId: string
): Promise<AddBundleToCartResponse> {
  try {
    const response = await sdk.client.fetch<AddBundleToCartResponse>(
      "/store/cart/add-bundle",
      {
        method: "POST",
        body: {
          cart_id: cartId,
          bundle_id: bundleId,
        },
      }
    )

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)

    const fulfillmentCacheTag = await getCacheTag("fulfillment")
    revalidateTag(fulfillmentCacheTag)

    return response
  } catch (error) {
    console.error("Error adding bundle to cart:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add bundle to cart",
    }
  }
}

// Types for remove bundle from cart response
type RemoveBundleFromCartResponse = {
  success: boolean
  message?: string
  items_removed?: number
  error?: string
}

/**
 * Remove a bundle from the cart by its instance ID
 */
export async function removeBundleFromCart(
  cartId: string,
  bundleInstanceId: string
): Promise<RemoveBundleFromCartResponse> {
  try {
    const response = await sdk.client.fetch<RemoveBundleFromCartResponse>(
      "/store/cart/add-bundle",
      {
        method: "DELETE",
        body: {
          cart_id: cartId,
          bundle_instance_id: bundleInstanceId,
        },
      }
    )

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)

    const fulfillmentCacheTag = await getCacheTag("fulfillment")
    revalidateTag(fulfillmentCacheTag)

    return response
  } catch (error) {
    console.error("Error removing bundle from cart:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove bundle from cart",
    }
  }
}

type BreakBundleResponse = {
  success: boolean
  message?: string
  items_updated?: number
  error?: string
}

/**
 * Break a bundle by removing a single item and reverting bundle pricing.
 */
export async function breakBundleInCart(
  bundleInstanceId: string,
  lineItemId?: string
): Promise<BreakBundleResponse> {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when breaking bundle")
  }

  try {
    const response = await sdk.client.fetch<BreakBundleResponse>(
      "/store/cart/break-bundle",
      {
        method: "POST",
        body: {
          cart_id: cartId,
          bundle_instance_id: bundleInstanceId,
          line_item_id: lineItemId,
        },
      }
    )

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)

    const fulfillmentCacheTag = await getCacheTag("fulfillment")
    revalidateTag(fulfillmentCacheTag)

    return response
  } catch (error) {
    console.error("Error breaking bundle:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to break bundle",
    }
  }
}
