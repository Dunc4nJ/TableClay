import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { OMNISEND_MODULE } from "../../../../modules/omnisend"
import type OmnisendModuleService from "../../../../modules/omnisend/service"

/**
 * GET /admin/omnisend/templates
 * List all available Omnisend email templates (read-only)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const omnisendService: OmnisendModuleService = req.scope.resolve(OMNISEND_MODULE)

    const templates = await omnisendService.listTemplates()

    res.json({
      success: true,
      templates,
      count: templates.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
