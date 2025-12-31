import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Test endpoint to verify SendGrid email configuration
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

    const notificationModuleService = req.scope.resolve(Modules.NOTIFICATION)

    // Send a test email
    const result = await notificationModuleService.createNotifications({
      to: email,
      channel: "email",
      template: "test-email",
      data: {
        subject: "Table Clay - Test Email",
        message: "This is a test email to verify SendGrid configuration is working correctly.",
        timestamp: new Date().toISOString(),
      },
    })

    console.log(`Test email sent to ${email}`, result)

    return res.json({
      success: true,
      message: `Test email sent to ${email}`,
      result,
    })
  } catch (error) {
    console.error("Failed to send test email:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error,
    })
  }
}

/**
 * GET endpoint to check notification module status
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const notificationModuleService = req.scope.resolve(Modules.NOTIFICATION)

    return res.json({
      success: true,
      message: "Notification module is available",
      moduleResolved: !!notificationModuleService,
      sendgridConfigured: !!process.env.SENDGRID_API_KEY,
      sendgridFrom: process.env.SENDGRID_FROM || "orders@tableclay.com",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
