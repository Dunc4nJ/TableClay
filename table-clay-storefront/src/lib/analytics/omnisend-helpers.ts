import { HttpTypes } from "@medusajs/types"

export interface OmnisendLineItem {
  productID: string
  variantID?: string
  title: string
  quantity: number
  price: number
  imageURL?: string
  productURL?: string
}

export interface OmnisendCartProperties {
  cartID: string
  currency: string
  value: number
  abandonedCheckoutURL: string
  lineItems: OmnisendLineItem[]
}

/**
 * Get the base URL for the storefront.
 * Uses NEXT_PUBLIC_BASE_URL environment variable.
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "https://tableclay.com"
}

/**
 * Build the abandoned checkout URL that restores the cart and redirects to checkout.
 * @param cartId - The Medusa cart ID
 * @param countryCode - The country code (e.g., "us")
 * @returns Full URL to the cart recovery endpoint
 */
export function buildAbandonedCheckoutURL(
  cartId: string,
  countryCode: string
): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/${countryCode}/recover-cart/${cartId}`
}

/**
 * Format cart items into Omnisend lineItems format.
 * @param cart - The Medusa cart object with items
 * @param countryCode - The country code for product URLs
 * @returns Array of Omnisend line items
 */
export function formatOmnisendLineItems(
  cart: HttpTypes.StoreCart,
  countryCode: string
): OmnisendLineItem[] {
  if (!cart.items || cart.items.length === 0) {
    return []
  }

  const baseUrl = getBaseUrl()

  return cart.items.map((item) => {
    // Get product handle for SEO-friendly URL
    const productHandle = (item.product as any)?.handle
    const productUrl = productHandle
      ? `${baseUrl}/${countryCode}/products/${productHandle}`
      : undefined

    return {
      productID: item.product_id || item.id,
      variantID: item.variant_id || undefined,
      title: item.product?.title || item.title || "Product",
      quantity: item.quantity,
      price: (item.unit_price ?? 0) / 100,
      imageURL: item.thumbnail || undefined,
      productURL: productUrl,
    }
  })
}

/**
 * Build complete cart event properties for Omnisend.
 * @param cart - The Medusa cart object
 * @param countryCode - The country code
 * @returns Complete properties object for cart events
 */
export function buildCartEventProperties(
  cart: HttpTypes.StoreCart,
  countryCode: string
): OmnisendCartProperties {
  const currency = (
    cart.currency_code || cart.region?.currency_code || "USD"
  ).toUpperCase()

  return {
    cartID: cart.id,
    currency,
    value: (cart.total ?? 0) / 100,
    abandonedCheckoutURL: buildAbandonedCheckoutURL(cart.id, countryCode),
    lineItems: formatOmnisendLineItems(cart, countryCode),
  }
}
