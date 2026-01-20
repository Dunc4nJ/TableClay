import { HttpTypes } from "@medusajs/types"

/**
 * Free shipping threshold in cents ($50.00 = 5000 cents)
 */
export const FREE_SHIPPING_THRESHOLD = 5000

/**
 * Check if a promotion is a free shipping promotion
 * Detects shipping-targeted promotions by checking application_method.target_type
 */
export function isFreeShippingPromotion(
  promotion: HttpTypes.StorePromotion
): boolean {
  const appMethod = promotion.application_method

  // Check if the promotion targets shipping methods
  if (appMethod?.target_type === "shipping_methods") {
    return true
  }

  return false
}

/**
 * Check if cart has a free shipping promotion applied
 */
export function hasFreeShippingPromotion(
  promotions: HttpTypes.StorePromotion[]
): boolean {
  return promotions.some(isFreeShippingPromotion)
}

/**
 * Calculate how much more is needed to reach free shipping threshold
 * Returns 0 if threshold is already met
 */
export function getAmountToFreeShipping(itemTotal: number): number {
  if (itemTotal >= FREE_SHIPPING_THRESHOLD) {
    return 0
  }
  return FREE_SHIPPING_THRESHOLD - itemTotal
}

/**
 * Check if cart qualifies for free shipping (meets threshold)
 */
export function meetsShippingThreshold(itemTotal: number): boolean {
  return itemTotal >= FREE_SHIPPING_THRESHOLD
}
