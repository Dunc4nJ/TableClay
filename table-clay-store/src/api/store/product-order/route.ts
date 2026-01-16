import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { STORE_SETTINGS_MODULE } from "../../../modules/store-settings"
import { SETTING_KEYS } from "../../../modules/store-settings/service"
import type StoreSettingsModuleService from "../../../modules/store-settings/service"

const parseStoredOrder = (value: string | null): string[] => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((id): id is string => typeof id === "string")
  } catch {
    return []
  }
}

/**
 * GET /store/product-order
 * Returns the curated product order for the storefront.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const settingsService: StoreSettingsModuleService =
      req.scope.resolve(STORE_SETTINGS_MODULE)

    const stored = await settingsService.getSetting(SETTING_KEYS.PRODUCT_ORDER)
    const productOrder = parseStoredOrder(stored)

    return res.json({
      success: true,
      product_order: productOrder,
    })
  } catch (error) {
    console.error("Error fetching store product order:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch product order",
    })
  }
}
