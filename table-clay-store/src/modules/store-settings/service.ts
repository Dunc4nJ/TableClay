import { MedusaService } from "@medusajs/framework/utils"
import { StoreSetting } from "./models"

// Type definitions
export type StoreSettingRecord = {
  id: string
  key: string
  value: string | null
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

// Predefined setting keys
export const SETTING_KEYS = {
  BUNDLE_HEADLINE: "bundle_headline",
  BUNDLE_PROMO_TEXT: "bundle_promo_text",
  BUNDLE_PROMO_ENABLED: "bundle_promo_enabled",
  PRODUCT_ORDER: "product_order",
} as const

/**
 * Store Settings Module Service
 * Handles global store settings CRUD operations
 */
class StoreSettingsModuleService extends MedusaService({
  StoreSetting,
}) {
  /**
   * Get a single setting by key
   */
  async getSetting(key: string): Promise<string | null> {
    const settings = await this.listStoreSettings({ key })
    return settings.length > 0 ? settings[0].value : null
  }

  /**
   * Get a setting with fallback default
   */
  async getSettingWithDefault(key: string, defaultValue: string): Promise<string> {
    const value = await this.getSetting(key)
    return value ?? defaultValue
  }

  /**
   * Set a setting value (upsert)
   */
  async setSetting(key: string, value: string | null): Promise<StoreSettingRecord> {
    const existing = await this.listStoreSettings({ key })

    if (existing.length > 0) {
      const updated = await this.updateStoreSettings({
        selector: { id: existing[0].id },
        data: { value },
      })
      return Array.isArray(updated) ? updated[0] : updated
    }

    // Create new setting
    const created = await this.createStoreSettings({
      key,
      value,
    })
    return Array.isArray(created) ? created[0] : created
  }

  /**
   * Get all settings as key-value object
   */
  async getAllSettings(): Promise<Record<string, string | null>> {
    const settings = await this.listStoreSettings({})
    return Object.fromEntries(settings.map((s) => [s.key, s.value]))
  }

  /**
   * Get bundle promo settings specifically
   */
  async getBundlePromoSettings(): Promise<{
    headline: string | null
    promo_text: string | null
    enabled: boolean
  }> {
    const headline = await this.getSetting(SETTING_KEYS.BUNDLE_HEADLINE)
    const promoText = await this.getSetting(SETTING_KEYS.BUNDLE_PROMO_TEXT)
    const enabledStr = await this.getSetting(SETTING_KEYS.BUNDLE_PROMO_ENABLED)

    return {
      headline: headline,
      promo_text: promoText,
      enabled: enabledStr === "true",
    }
  }

  /**
   * Update bundle promo settings
   */
  async updateBundlePromoSettings(data: {
    headline?: string | null
    promo_text?: string | null
    enabled?: boolean
  }): Promise<void> {
    if (data.headline !== undefined) {
      await this.setSetting(SETTING_KEYS.BUNDLE_HEADLINE, data.headline)
    }
    if (data.promo_text !== undefined) {
      await this.setSetting(SETTING_KEYS.BUNDLE_PROMO_TEXT, data.promo_text)
    }
    if (data.enabled !== undefined) {
      await this.setSetting(
        SETTING_KEYS.BUNDLE_PROMO_ENABLED,
        data.enabled ? "true" : "false"
      )
    }
  }

  /**
   * Delete a setting by key
   */
  async deleteSetting(key: string): Promise<void> {
    const existing = await this.listStoreSettings({ key })
    if (existing.length > 0) {
      await this.deleteStoreSettings(existing[0].id)
    }
  }
}

export default StoreSettingsModuleService
