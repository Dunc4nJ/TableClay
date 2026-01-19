import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { OMNISEND_MODULE } from "../../../modules/omnisend"
import type OmnisendModuleService from "../../../modules/omnisend/service"

/**
 * Test endpoint to verify OmniSend integration
 * POST /admin/test-email
 * Body: { email: "test@example.com" }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { email } = req.body as { email?: string }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email address is required in request body",
      })
    }

    const omnisendService: OmnisendModuleService = req.scope.resolve(OMNISEND_MODULE)

    // Create/update a test contact in OmniSend
    await omnisendService.createOrUpdateContact({
      email,
      tags: ["test-email", "admin-test"],
      customProperties: {
        test_timestamp: new Date().toISOString(),
        test_source: "admin-test-email-endpoint",
      },
    })

    console.log(`OmniSend test contact created/updated for ${email}`)

    return res.json({
      success: true,
      provider: "omnisend",
      message: `Test contact created/updated in OmniSend for ${email}`,
    })
  } catch (error) {
    console.error("Failed to create OmniSend test contact:", error)
    return res.status(500).json({
      success: false,
      provider: "omnisend",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

/**
 * GET endpoint to check OmniSend module status
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    let moduleResolved = false
    try {
      const omnisendService = req.scope.resolve(OMNISEND_MODULE)
      moduleResolved = !!omnisendService
    } catch {
      moduleResolved = false
    }

    return res.json({
      success: true,
      provider: "omnisend",
      message: "OmniSend module status",
      configured: !!process.env.OMNISEND_API_KEY,
      moduleResolved,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      provider: "omnisend",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
