import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BUNDLE_MODULE } from "../../../../../../modules/bundle"
import type BundleModuleService from "../../../../../../modules/bundle/service"

type UpdateItemRequestBody = {
  quantity?: number
  sort_order?: number
}

/**
 * PUT /admin/bundles/:id/items/:itemId
 * Update a bundle item
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id, itemId } = req.params
    const data = req.body as UpdateItemRequestBody

    const bundleService: BundleModuleService = req.scope.resolve(BUNDLE_MODULE)

    // Check bundle exists
    try {
      await bundleService.getBundleById(id)
    } catch {
      return res.status(404).json({
        success: false,
        error: "Bundle not found",
      })
    }

    // Validate quantity if provided
    if (data.quantity !== undefined && data.quantity < 1) {
      return res.status(400).json({
        success: false,
        error: "quantity must be at least 1",
      })
    }

    const item = await bundleService.updateBundleItem(itemId, data)

    return res.json({
      success: true,
      item,
    })
  } catch (error) {
    console.error("Error updating bundle item:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update bundle item",
    })
  }
}

/**
 * DELETE /admin/bundles/:id/items/:itemId
 * Remove an item from a bundle
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id, itemId } = req.params

    const bundleService: BundleModuleService = req.scope.resolve(BUNDLE_MODULE)

    // Check bundle exists
    try {
      await bundleService.getBundleById(id)
    } catch {
      return res.status(404).json({
        success: false,
        error: "Bundle not found",
      })
    }

    await bundleService.removeBundleItem(itemId)

    return res.json({
      success: true,
      message: "Bundle item removed successfully",
    })
  } catch (error) {
    console.error("Error removing bundle item:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to remove bundle item",
    })
  }
}
