import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BUNDLE_MODULE } from "../../../modules/bundle"
import type BundleModuleService from "../../../modules/bundle/service"

type CreateBundleRequestBody = {
  product_id: string
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
    variant_id: string
    quantity?: number
    sort_order?: number
  }>
}

/**
 * GET /admin/bundles
 * List bundles with optional filters
 * Query params: product_id, is_active
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { product_id, is_active } = req.query

    const bundleService: BundleModuleService = req.scope.resolve(BUNDLE_MODULE)

    const filters: Record<string, unknown> = {}
    if (product_id) {
      filters.product_id = product_id
    }
    if (is_active !== undefined) {
      filters.is_active = is_active === "true"
    }

    const bundles = await bundleService.listBundles(filters, {
      order: { sort_order: "ASC", created_at: "DESC" },
    })

    // Enrich with items
    const enrichedBundles = await Promise.all(
      bundles.map(async (bundle) => {
        const items = await bundleService.getItemsForBundle(bundle.id)
        const pricing = bundleService.calculateBundlePricing(bundle)
        return {
          ...bundle,
          items,
          calculated_pricing: pricing,
        }
      })
    )

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
 * Create a new bundle with optional items
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const data = req.body as CreateBundleRequestBody

    // Validate required fields
    if (!data.product_id) {
      return res.status(400).json({
        success: false,
        error: "product_id is required",
      })
    }

    if (!data.name) {
      return res.status(400).json({
        success: false,
        error: "name is required",
      })
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
