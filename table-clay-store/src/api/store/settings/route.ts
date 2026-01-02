import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { STORE_SETTINGS_MODULE } from "../../../modules/store-settings"
import type StoreSettingsModuleService from "../../../modules/store-settings/service"

/**
 * GET /store/settings
 * Get bundle promo settings (read-only for storefront)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const settingsService: StoreSettingsModuleService =
      req.scope.resolve(STORE_SETTINGS_MODULE)

    const bundlePromo = await settingsService.getBundlePromoSettings()

    return res.json({
      success: true,
      bundle_promo: bundlePromo,
    })
  } catch (error) {
    console.error("Error fetching store settings:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch settings",
    })
  }
}
