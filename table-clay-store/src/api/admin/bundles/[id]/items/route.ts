import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BUNDLE_MODULE } from "../../../../../modules/bundle"
import type BundleModuleService from "../../../../../modules/bundle/service"

type AddItemRequestBody = {
  product_id: string
  variant_id: string
  quantity?: number
  sort_order?: number
  product_title?: string
  variant_title?: string
}

/**
 * GET /admin/bundles/:id/items
 * List items in a bundle
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params

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

    const items = await bundleService.getItemsForBundle(id)

    return res.json({
      success: true,
      items,
      count: items.length,
    })
  } catch (error) {
    console.error("Error listing bundle items:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to list bundle items",
    })
  }
}

/**
 * POST /admin/bundles/:id/items
 * Add an item to a bundle
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const data = req.body as AddItemRequestBody

    if (!data.product_id || !data.variant_id) {
      return res.status(400).json({
        success: false,
        error: "product_id and variant_id are required",
      })
    }

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

    const item = await bundleService.addBundleItem({
      bundle_id: id,
      product_id: data.product_id,
      variant_id: data.variant_id,
      quantity: data.quantity,
      sort_order: data.sort_order,
      product_title: data.product_title,
      variant_title: data.variant_title,
    })

    return res.status(201).json({
      success: true,
      item,
    })
  } catch (error) {
    console.error("Error adding bundle item:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add bundle item",
    })
  }
}
