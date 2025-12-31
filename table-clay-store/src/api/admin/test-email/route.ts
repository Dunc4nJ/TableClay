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

    // Send a test email using inline content (no template required)
    const result = await notificationModuleService.createNotifications({
      to: email,
      channel: "email",
      content: {
        subject: "Table Clay - Test Email",
        text: `This is a test email to verify SendGrid configuration is working correctly.\n\nTimestamp: ${new Date().toISOString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #8B4513;">Table Clay</h1>
            <p>This is a test email to verify SendGrid configuration is working correctly.</p>
            <p style="color: #666; font-size: 12px;">Timestamp: ${new Date().toISOString()}</p>
          </div>
        `,
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
