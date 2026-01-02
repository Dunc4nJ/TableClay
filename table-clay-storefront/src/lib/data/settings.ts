"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

// Types for store settings
export type BundlePromoSettings = {
  headline: string | null
  promo_text: string | null
  enabled: boolean
}

type SettingsResponse = {
  success: boolean
  bundle_promo: BundlePromoSettings
  error?: string
}

/**
 * Fetch store settings for the storefront
 * Used by product pages for bundle display configuration
 */
export async function getStoreSettings(): Promise<BundlePromoSettings> {
  const next = {
    ...(await getCacheOptions("products")),
    revalidate: 60, // Revalidate every 60 seconds
  }

  try {
    const response = await sdk.client.fetch<SettingsResponse>(
      "/store/settings",
      {
        method: "GET",
        next,
      }
    )

    if (response.success && response.bundle_promo) {
      return response.bundle_promo
    }

    // Return default settings if fetch fails
    return {
      headline: null,
      promo_text: null,
      enabled: true,
    }
  } catch (error) {
    console.error("Error fetching store settings:", error)
    // Return default settings on error
    return {
      headline: null,
      promo_text: null,
      enabled: true,
    }
  }
}
