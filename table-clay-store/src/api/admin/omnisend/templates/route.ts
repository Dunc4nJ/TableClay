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
      provider: "omnisend",
      supported: true,
      templates,
      count: templates.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"

    // OmniSend v5 may return 404 for template APIs depending on account/capability.
    // Treat this as unsupported capability instead of a server error.
    if (message.includes("HTTP 404")) {
      return res.status(200).json({
        success: true,
        provider: "omnisend",
        supported: false,
        templates: [],
        count: 0,
        warning: "OmniSend template API is not available for this account/capability.",
      })
    }

    res.status(500).json({
      success: false,
      provider: "omnisend",
      error: message,
    })
  }
}
