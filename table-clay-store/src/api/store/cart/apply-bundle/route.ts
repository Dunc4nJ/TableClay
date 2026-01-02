import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BUNDLE_MODULE } from "../../../../modules/bundle"
import type BundleModuleService from "../../../../modules/bundle/service"

type ApplyBundleRequestBody = {
  cart_id: string
  bundle_id: string
}

/**
 * POST /store/cart/apply-bundle
 * Calculate bundle discount for the cart
 * Returns discount information that can be displayed in checkout
 *
 * Note: Actual promotion application would require Medusa workflows
 * This endpoint provides the discount calculation for display purposes
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { cart_id, bundle_id } = req.body as ApplyBundleRequestBody

    if (!cart_id || !bundle_id) {
      return res.status(400).json({
        success: false,
        error: "cart_id and bundle_id are required",
      })
    }

    const bundleService: BundleModuleService = req.scope.resolve(BUNDLE_MODULE)

    // Get bundle with items
    const bundle = await bundleService.getBundleWithItems(bundle_id)

    if (!bundle) {
      return res.status(404).json({
        success: false,
        error: "Bundle not found",
      })
    }

    if (!bundle.is_active) {
      return res.status(400).json({
        success: false,
        error: "This bundle is no longer available",
      })
    }

    // Calculate the discount amount
    const pricing = bundleService.calculateBundlePricing(bundle)
    const discountAmount = pricing.savings

    // Generate a reference code for this bundle purchase
    const bundleRef = `BUNDLE-${bundle.id.slice(-8)}`.toUpperCase()

    return res.json({
      success: true,
      bundle_ref: bundleRef,
      bundle_name: bundle.name,
      discount_amount: discountAmount,
      discount_formatted: `$${(discountAmount / 100).toFixed(2)}`,
      original_price: pricing.original_price,
      sale_price: pricing.sale_price,
      savings_percent: pricing.savings_percent,
      message: `Bundle discount of $${(discountAmount / 100).toFixed(2)} applied`,
      items: bundle.items.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
      })),
    })
  } catch (error) {
    console.error("Error applying bundle:", error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to apply bundle discount",
    })
  }
}
