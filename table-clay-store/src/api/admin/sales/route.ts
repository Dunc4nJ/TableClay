import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"
import { SALES_TRACKING_MODULE } from "../../../modules/sales-tracking"
import type SalesTrackingModuleService from "../../../modules/sales-tracking/service"

/**
 * GET /admin/sales
 * List all product sales data with product info
 * Returns sorted by sales_count DESC
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const salesService: SalesTrackingModuleService = req.scope.resolve(SALES_TRACKING_MODULE)
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)

    // Get all sales records
    const salesRecords = await salesService.getAllSalesStats()

    // Get all product IDs
    const productIds = salesRecords.map((r) => r.product_id)

    // Fetch product details
    const products = productIds.length > 0
      ? await productService.listProducts(
          { id: productIds },
          { select: ["id", "title", "thumbnail", "handle", "status"] }
        )
      : []

    // Create product lookup map
    const productMap = new Map(products.map((p) => [p.id, p]))

    // Merge sales data with product info
    const enrichedRecords = salesRecords.map((record) => {
      const product = productMap.get(record.product_id)
      return {
        id: record.id,
        product_id: record.product_id,
        product_title: product?.title || "Unknown Product",
        product_thumbnail: product?.thumbnail || null,
        product_handle: product?.handle || null,
        product_status: product?.status || "unknown",
        sales_count: record.sales_count,
        last_sold_at: record.last_sold_at,
        created_at: record.created_at,
        updated_at: record.updated_at,
      }
    })

    // Calculate totals
    const totalSales = salesRecords.reduce((sum, r) => sum + r.sales_count, 0)
    const productsWithSales = salesRecords.filter((r) => r.sales_count > 0).length

    return res.json({
      success: true,
      sales: enrichedRecords,
      stats: {
        total_sales: totalSales,
        products_tracked: salesRecords.length,
        products_with_sales: productsWithSales,
      },
    })
  } catch (error) {
    console.error("Admin sales GET error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch sales data",
    })
  }
}

/**
 * POST /admin/sales/initialize
 * Initialize sales tracking for all existing products
 * Sets sales_count to 0 for products without records
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const salesService: SalesTrackingModuleService = req.scope.resolve(SALES_TRACKING_MODULE)
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)

    // Get all products
    const products = await productService.listProducts(
      {},
      { select: ["id"] }
    )

    let initialized = 0

    // Initialize each product
    for (const product of products) {
      const records = await salesService.listProductSales({
        product_id: product.id,
      })

      if (records.length === 0) {
        await salesService.initializeProduct(product.id)
        initialized++
      }
    }

    return res.json({
      success: true,
      message: `Initialized sales tracking for ${initialized} products`,
      total_products: products.length,
      newly_initialized: initialized,
    })
  } catch (error) {
    console.error("Admin sales POST error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize sales tracking",
    })
  }
}
