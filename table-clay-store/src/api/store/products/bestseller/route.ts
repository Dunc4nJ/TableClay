import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type {
  IProductModuleService,
  IPricingModuleService,
} from "@medusajs/framework/types"
import { SALES_TRACKING_MODULE } from "../../../../modules/sales-tracking"
import type SalesTrackingModuleService from "../../../../modules/sales-tracking/service"

/**
 * GET /store/products/bestseller
 * Returns the single product with the highest sales count
 *
 * Query params:
 *   - region_id: Required for pricing calculation
 *
 * Returns:
 *   - id, handle, title, thumbnail
 *   - calculated_price (for region)
 *   - sales_count
 *
 * Fallback: If no sales yet, returns newest product
 * Cache: Results cached for 5 minutes (via response headers)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { region_id } = req.query

    if (!region_id) {
      return res.status(400).json({
        success: false,
        error: "region_id query parameter is required",
      })
    }

    const salesService: SalesTrackingModuleService = req.scope.resolve(SALES_TRACKING_MODULE)
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    const pricingService: IPricingModuleService = req.scope.resolve(Modules.PRICING)
    const query = req.scope.resolve("query")

    // Get bestseller product ID from sales tracking
    let bestsellerProductId = await salesService.getBestsellerProductId()
    let salesCount = 0

    if (bestsellerProductId) {
      salesCount = await salesService.getSalesCount(bestsellerProductId)
    }

    // Fallback: If no sales yet, get newest product
    if (!bestsellerProductId) {
      const products = await productService.listProducts(
        { status: "published" },
        {
          order: { created_at: "DESC" },
          take: 1,
          select: ["id"],
        }
      )

      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No products found",
        })
      }

      bestsellerProductId = products[0].id
    }

    // Fetch product details with variants
    const products = await productService.listProducts(
      { id: bestsellerProductId },
      {
        relations: ["variants"],
        select: [
          "id",
          "title",
          "handle",
          "thumbnail",
          "created_at",
          "variants.id",
          "variants.title",
        ],
      }
    )

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Bestseller product not found",
      })
    }

    const product = products[0]

    // Get region for currency
    const { data: regions } = await query.graph({
      entity: "region",
      fields: ["id", "currency_code"],
      filters: { id: region_id as string },
    })

    const region = regions[0]
    const currencyCode = region?.currency_code || "usd"

    // Get pricing for the first variant (for display)
    let calculatedPrice: number | null = null
    let originalPrice: number | null = null

    if (product.variants && product.variants.length > 0) {
      const variantId = product.variants[0].id

      try {
        const pricingResult = await pricingService.calculatePrices(
          {
            id: [variantId],
          },
          {
            context: {
              currency_code: currencyCode,
              region_id: region_id as string,
            },
          }
        )

        if (pricingResult.length > 0) {
          const pricing = pricingResult[0]
          // Convert BigNumberValue to number
          calculatedPrice = pricing.calculated_amount !== undefined && pricing.calculated_amount !== null
            ? Number(pricing.calculated_amount)
            : null
          originalPrice = pricing.original_amount !== undefined && pricing.original_amount !== null
            ? Number(pricing.original_amount)
            : null
        }
      } catch (pricingError) {
        console.warn("[Bestseller] Failed to get pricing:", pricingError)
        // Continue without pricing
      }
    }

    // Set cache headers (5 minute cache)
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300")

    return res.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        handle: product.handle,
        thumbnail: product.thumbnail,
        sales_count: salesCount,
        calculated_price: calculatedPrice,
        original_price: originalPrice,
        currency_code: currencyCode,
      },
    })
  } catch (error) {
    console.error("[Bestseller] Error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get bestseller",
    })
  }
}
