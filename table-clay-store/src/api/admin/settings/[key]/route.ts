import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { STORE_SETTINGS_MODULE } from "../../../../modules/store-settings"
import type StoreSettingsModuleService from "../../../../modules/store-settings/service"

type UpdateSettingBody = {
  value: string | null
}

/**
 * GET /admin/settings/:key
 * Get a specific setting by key
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { key } = req.params

    const settingsService: StoreSettingsModuleService =
      req.scope.resolve(STORE_SETTINGS_MODULE)

    const value = await settingsService.getSetting(key)

    return res.json({
      success: true,
      key,
      value,
    })
  } catch (error) {
    console.error("Error fetching setting:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch setting",
    })
  }
}

/**
 * PUT /admin/settings/:key
 * Update a specific setting
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { key } = req.params
    const { value } = req.body as UpdateSettingBody

    const settingsService: StoreSettingsModuleService =
      req.scope.resolve(STORE_SETTINGS_MODULE)

    const setting = await settingsService.setSetting(key, value)

    return res.json({
      success: true,
      key: setting.key,
      value: setting.value,
    })
  } catch (error) {
    console.error("Error updating setting:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update setting",
    })
  }
}

/**
 * DELETE /admin/settings/:key
 * Delete a setting
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { key } = req.params

    const settingsService: StoreSettingsModuleService =
      req.scope.resolve(STORE_SETTINGS_MODULE)

    await settingsService.deleteSetting(key)

    return res.json({
      success: true,
      message: `Setting '${key}' deleted successfully`,
    })
  } catch (error) {
    console.error("Error deleting setting:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete setting",
    })
  }
}
