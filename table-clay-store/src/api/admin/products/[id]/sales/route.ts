import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SALES_TRACKING_MODULE } from "../../../../../modules/sales-tracking"
import type SalesTrackingModuleService from "../../../../../modules/sales-tracking/service"

/**
 * GET /admin/products/:id/sales
 * Get sales count for a specific product
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id: productId } = req.params
    const salesService: SalesTrackingModuleService = req.scope.resolve(SALES_TRACKING_MODULE)

    const records = await salesService.listProductSales({
      product_id: productId,
    })

    if (records.length === 0) {
      // No sales record yet, return 0
      return res.json({
        success: true,
        product_id: productId,
        sales_count: 0,
        last_sold_at: null,
      })
    }

    const record = records[0]

    return res.json({
      success: true,
      product_id: productId,
      sales_count: record.sales_count,
      last_sold_at: record.last_sold_at,
      created_at: record.created_at,
      updated_at: record.updated_at,
    })
  } catch (error) {
    console.error("Admin product sales GET error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch sales data",
    })
  }
}

/**
 * PUT /admin/products/:id/sales
 * Update sales count for a product (manual correction/promotion)
 *
 * Body: { sales_count: number }
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id: productId } = req.params
    const { sales_count } = req.body as { sales_count: number }

    if (typeof sales_count !== "number" || sales_count < 0) {
      return res.status(400).json({
        success: false,
        error: "sales_count must be a non-negative number",
      })
    }

    const salesService: SalesTrackingModuleService = req.scope.resolve(SALES_TRACKING_MODULE)

    const record = await salesService.setSalesCount(productId, sales_count)

    return res.json({
      success: true,
      product_id: productId,
      sales_count: record.sales_count,
      last_sold_at: record.last_sold_at,
      updated_at: record.updated_at,
    })
  } catch (error) {
    console.error("Admin product sales PUT error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update sales data",
    })
  }
}
