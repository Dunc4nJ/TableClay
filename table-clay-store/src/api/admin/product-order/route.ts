import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { STORE_SETTINGS_MODULE } from "../../../modules/store-settings"
import {
  SETTING_KEYS,
  type StoreSettingRecord,
} from "../../../modules/store-settings/service"
import type StoreSettingsModuleService from "../../../modules/store-settings/service"

type ProductOrderBody = {
  product_order?: unknown
}

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

const normalizeOrder = (input: unknown): string[] => {
  if (!Array.isArray(input)) {
    return []
  }

  const seen = new Set<string>()
  const result: string[] = []

  for (const item of input) {
    if (typeof item !== "string") continue
    const trimmed = item.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    result.push(trimmed)
  }

  return result
}

/**
 * GET /admin/product-order
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
    console.error("Error fetching product order:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch product order",
    })
  }
}

/**
 * PUT /admin/product-order
 * Updates the curated product order.
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { product_order } = req.body as ProductOrderBody

    if (!Array.isArray(product_order)) {
      return res.status(400).json({
        success: false,
        error: "product_order must be an array of product IDs",
      })
    }

    const normalized = normalizeOrder(product_order)

    const settingsService: StoreSettingsModuleService =
      req.scope.resolve(STORE_SETTINGS_MODULE)

    const setting: StoreSettingRecord = await settingsService.setSetting(
      SETTING_KEYS.PRODUCT_ORDER,
      JSON.stringify(normalized)
    )

    return res.json({
      success: true,
      product_order: parseStoredOrder(setting.value),
    })
  } catch (error) {
    console.error("Error updating product order:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update product order",
    })
  }
}
