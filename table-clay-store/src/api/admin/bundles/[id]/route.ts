import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BUNDLE_MODULE } from "../../../../modules/bundle"
import type BundleModuleService from "../../../../modules/bundle/service"

type UpdateBundleRequestBody = {
  name?: string
  description?: string
  pricing_type?: "fixed" | "percentage"
  fixed_original_price?: number
  fixed_sale_price?: number
  discount_percentage?: number
  badge?: "bestseller" | "popular" | "new" | "limited" | "sale" | "none"
  is_active?: boolean
  sort_order?: number
  metadata?: Record<string, unknown>
}

/**
 * GET /admin/bundles/:id
 * Get a single bundle with its items
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params

    const bundleService: BundleModuleService = req.scope.resolve(BUNDLE_MODULE)

    const bundleWithItems = await bundleService.getBundleWithItems(id)

    if (!bundleWithItems) {
      return res.status(404).json({
        success: false,
        error: "Bundle not found",
      })
    }

    const pricing = bundleService.calculateBundlePricing(bundleWithItems)

    return res.json({
      success: true,
      bundle: {
        ...bundleWithItems,
        calculated_pricing: pricing,
      },
    })
  } catch (error) {
    console.error("Error fetching bundle:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch bundle",
    })
  }
}

/**
 * PUT /admin/bundles/:id
 * Update a bundle
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const data = req.body as UpdateBundleRequestBody

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

    // Validate pricing if provided
    if (data.pricing_type === "percentage") {
      if (
        data.discount_percentage !== undefined &&
        (data.discount_percentage < 0 || data.discount_percentage > 100)
      ) {
        return res.status(400).json({
          success: false,
          error: "discount_percentage must be between 0 and 100",
        })
      }
    } else if (data.pricing_type === "fixed" || !data.pricing_type) {
      if (data.fixed_sale_price && data.fixed_original_price) {
        if (data.fixed_sale_price > data.fixed_original_price) {
          return res.status(400).json({
            success: false,
            error: "sale_price cannot be greater than original_price",
          })
        }
      }
    }

    const bundle = await bundleService.updateBundle(id, data)
    const bundleWithItems = await bundleService.getBundleWithItems(bundle.id)
    const pricing = bundleService.calculateBundlePricing(bundle)

    return res.json({
      success: true,
      bundle: {
        ...bundleWithItems,
        calculated_pricing: pricing,
      },
    })
  } catch (error) {
    console.error("Error updating bundle:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update bundle",
    })
  }
}

/**
 * DELETE /admin/bundles/:id
 * Soft delete a bundle (sets is_active to false)
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
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

    await bundleService.deleteBundle(id)

    return res.json({
      success: true,
      message: "Bundle deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting bundle:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete bundle",
    })
  }
}
