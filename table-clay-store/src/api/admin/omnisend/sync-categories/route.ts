import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { OMNISEND_MODULE } from "../../../../modules/omnisend"
import type OmnisendModuleService from "../../../../modules/omnisend/service"

/**
 * POST /admin/omnisend/sync-categories
 * Sync all Medusa product categories to OmniSend
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const omnisendService: OmnisendModuleService = req.scope.resolve(OMNISEND_MODULE)
    const productService = req.scope.resolve(Modules.PRODUCT)

    const categories = await productService.listProductCategories(
      {},
      { select: ["id", "name"] }
    )

    const result = await omnisendService.syncAllCategories(categories)

    res.json({
      success: true,
      ...result,
      total: categories.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
