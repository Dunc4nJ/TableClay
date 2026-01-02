import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { STORE_SETTINGS_MODULE } from "../../../modules/store-settings"
import type StoreSettingsModuleService from "../../../modules/store-settings/service"

/**
 * GET /admin/settings
 * Get all store settings
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const settingsService: StoreSettingsModuleService =
      req.scope.resolve(STORE_SETTINGS_MODULE)

    const settings = await settingsService.getAllSettings()
    const bundlePromo = await settingsService.getBundlePromoSettings()

    return res.json({
      success: true,
      settings,
      bundle_promo: bundlePromo,
    })
  } catch (error) {
    console.error("Error fetching admin settings:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch settings",
    })
  }
}

type UpdateBundlePromoBody = {
  promo_text?: string | null
  enabled?: boolean
}

/**
 * PUT /admin/settings
 * Update bundle promo settings
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const data = req.body as UpdateBundlePromoBody

    const settingsService: StoreSettingsModuleService =
      req.scope.resolve(STORE_SETTINGS_MODULE)

    await settingsService.updateBundlePromoSettings(data)
    const updatedSettings = await settingsService.getBundlePromoSettings()

    return res.json({
      success: true,
      bundle_promo: updatedSettings,
    })
  } catch (error) {
    console.error("Error updating settings:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update settings",
    })
  }
}
