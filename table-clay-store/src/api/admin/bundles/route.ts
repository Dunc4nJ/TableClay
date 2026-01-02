import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BUNDLE_MODULE } from "../../../modules/bundle"
import type BundleModuleService from "../../../modules/bundle/service"

/**
 * Create bundle request body
 * Note: product_id is no longer at the bundle level - it's on each item
 */
type CreateBundleRequestBody = {
  name: string
  description?: string
  pricing_type?: "fixed" | "percentage"
  fixed_original_price?: number
  fixed_sale_price?: number
  discount_percentage?: number
  badge?: "bestseller" | "popular" | "new" | "limited" | "sale" | "none"
  is_active?: boolean
  sort_order?: number
  metadata?: Record<string, unknown>
  items?: Array<{
    product_id: string
    variant_id: string
    quantity?: number
    sort_order?: number
    product_title?: string
    variant_title?: string
  }>
}

/**
 * GET /admin/bundles
 * List all bundles with their items
 * Query params: is_active (optional filter)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { is_active } = req.query

    const bundleService: BundleModuleService = req.scope.resolve(BUNDLE_MODULE)

    // Get all bundles with items
    const bundlesWithItems = await bundleService.listAllBundles()

    // Filter by is_active if specified
    let filteredBundles = bundlesWithItems
    if (is_active !== undefined) {
      const isActiveFilter = is_active === "true"
      filteredBundles = bundlesWithItems.filter(
        (b) => b.is_active === isActiveFilter
      )
    }

    // Add calculated pricing to each bundle
    const enrichedBundles = filteredBundles.map((bundle) => {
      const pricing = bundleService.calculateBundlePricing(bundle)
      return {
        ...bundle,
        calculated_pricing: pricing,
      }
    })

    return res.json({
      success: true,
      bundles: enrichedBundles,
      count: enrichedBundles.length,
    })
  } catch (error) {
    console.error("Error listing bundles:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to list bundles",
    })
  }
}

/**
 * POST /admin/bundles
 * Create a new bundle with items from any products
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const data = req.body as CreateBundleRequestBody

    // Validate required fields
    if (!data.name) {
      return res.status(400).json({
        success: false,
        error: "name is required",
      })
    }

    // Validate that items are provided and have required fields
    if (!data.items || data.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one item is required",
      })
    }

    // Validate each item has product_id and variant_id
    for (const item of data.items) {
      if (!item.product_id || !item.variant_id) {
        return res.status(400).json({
          success: false,
          error: "Each item must have product_id and variant_id",
        })
      }
    }

    // Validate pricing based on pricing_type
    if (data.pricing_type === "percentage") {
      if (
        data.discount_percentage === undefined ||
        data.discount_percentage < 0 ||
        data.discount_percentage > 100
      ) {
        return res.status(400).json({
          success: false,
          error:
            "discount_percentage must be between 0 and 100 for percentage pricing",
        })
      }
    } else {
      // Default to fixed pricing
      if (data.fixed_sale_price && data.fixed_original_price) {
        if (data.fixed_sale_price > data.fixed_original_price) {
          return res.status(400).json({
            success: false,
            error: "sale_price cannot be greater than original_price",
          })
        }
      }
    }

    const bundleService: BundleModuleService = req.scope.resolve(BUNDLE_MODULE)

    const bundle = await bundleService.createBundle(data)

    // Fetch the bundle with items for response
    const bundleWithItems = await bundleService.getBundleWithItems(bundle.id)
    const pricing = bundleService.calculateBundlePricing(bundle)

    return res.status(201).json({
      success: true,
      bundle: {
        ...bundleWithItems,
        calculated_pricing: pricing,
      },
    })
  } catch (error) {
    console.error("Error creating bundle:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create bundle",
    })
  }
}
