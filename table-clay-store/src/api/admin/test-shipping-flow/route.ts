import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

type TestShippingInput = {
  email?: string
  order_id?: string
}

type ShippingAddress = {
  first_name?: string
  last_name?: string
  address_1?: string
  address_2?: string
  city?: string
  province?: string
  postal_code?: string
  country_code?: string
}

type OrderItem = {
  title: string
  quantity: number
}

/**
 * POST /admin/test-shipping-flow
 *
 * Test endpoint that sends a shipping notification email.
 * Uses order data to generate the email content.
 *
 * Usage:
 * curl -X POST https://tableclay-production.up.railway.app/admin/test-shipping-flow \
 *   -H "Authorization: Bearer $TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"email": "your@email.com"}'
 *
 * Or with a specific order:
 *   -d '{"email": "your@email.com", "order_id": "order_xxx"}'
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { email = "duncanejurman@gmail.com", order_id } = req.body as TestShippingInput

  try {
    const notificationModuleService = req.scope.resolve(Modules.NOTIFICATION)
    const query = req.scope.resolve("query")

    // Find an order to use for test data
    let orderData: {
      id: string
      display_id: number
      email: string
      shipping_address?: ShippingAddress
      items: OrderItem[]
    }

    if (order_id) {
      // Use specified order
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "display_id", "email", "shipping_address.*", "items.title", "items.quantity"],
        filters: { id: order_id },
      })

      if (!orders || orders.length === 0) {
        return res.status(404).json({
          success: false,
          error: `Order ${order_id} not found`,
        })
      }

      orderData = orders[0] as typeof orderData
    } else {
      // Use most recent order
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "display_id", "email", "shipping_address.*", "items.title", "items.quantity"],
        filters: {},
      })

      if (!orders || orders.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No orders found",
        })
      }

      orderData = orders[0] as typeof orderData
    }

    console.log(`[test-shipping-flow] Using order #${orderData.display_id} (${orderData.id})`)

    // Generate test data
    const trackingNumber = "TEST-" + Date.now().toString().slice(-8)
    const trackingUrl = `https://example.com/track/${trackingNumber}`
    const shippedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Generate items HTML
    const items = orderData.items || [{ title: "Test Item", quantity: 1 }]
    const itemsHtml = items
      .map(
        (item) => `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #E8E0D8;">
              <p style="color: #2C1810; font-size: 14px; margin: 0;">
                ${item.title} × ${item.quantity}
              </p>
            </td>
          </tr>
        `
      )
      .join("")

    const itemsText = items
      .map((item) => `  - ${item.title} × ${item.quantity}`)
      .join("\n")

    // Format shipping address
    const shippingAddress = orderData.shipping_address || {
      first_name: "Test",
      last_name: "Customer",
      address_1: "123 Test Street",
      city: "Portland",
      province: "OR",
      postal_code: "97214",
      country_code: "US",
    }

    const addressHtml = `
      <p style="color: #5C4033; font-size: 14px; line-height: 1.6; margin: 0;">
        ${shippingAddress.first_name || ""} ${shippingAddress.last_name || ""}<br>
        ${shippingAddress.address_1 || ""}${shippingAddress.address_2 ? `<br>${shippingAddress.address_2}` : ""}<br>
        ${shippingAddress.city || ""}, ${shippingAddress.province || ""} ${shippingAddress.postal_code || ""}<br>
        ${(shippingAddress.country_code || "").toUpperCase()}
      </p>
    `

    const addressText = `${shippingAddress.first_name || ""} ${shippingAddress.last_name || ""}
${shippingAddress.address_1 || ""}${shippingAddress.address_2 ? `\n${shippingAddress.address_2}` : ""}
${shippingAddress.city || ""}, ${shippingAddress.province || ""} ${shippingAddress.postal_code || ""}
${(shippingAddress.country_code || "").toUpperCase()}`

    const orderUrl = `https://tableclay.com/us/order/${orderData.id}/confirmed`

    // Send the email
    console.log(`[test-shipping-flow] Sending shipping email to ${email}...`)

    await notificationModuleService.createNotifications({
      to: email,
      channel: "email",
      content: {
        subject: `Your Table Clay Order #${orderData.display_id} Has Shipped!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #F5F0E8; font-family: 'Georgia', serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F0E8;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

                    <!-- Header -->
                    <tr>
                      <td style="background-color: #8B4513; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: normal; letter-spacing: 2px;">TABLE CLAY</h1>
                        <p style="color: #D4A574; margin: 10px 0 0; font-size: 14px; letter-spacing: 1px;">HANDMADE POTTERY</p>
                      </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 50px 40px;">
                        <!-- Shipped Message -->
                        <h2 style="color: #2C1810; font-size: 28px; font-weight: normal; margin: 0 0 10px; text-align: center;">
                          Your Order Is On Its Way!
                        </h2>

                        <p style="color: #5C4033; font-size: 16px; line-height: 1.6; margin: 0 0 30px; text-align: center;">
                          Great news! Your handcrafted pieces have been carefully packed and shipped.
                        </p>

                        <!-- Order Info Box -->
                        <div style="background-color: #F5F0E8; border-radius: 8px; padding: 20px; margin: 0 0 30px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td>
                                <p style="color: #A0826D; font-size: 12px; margin: 0 0 5px; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
                                <p style="color: #2C1810; font-size: 18px; font-weight: bold; margin: 0;">#${orderData.display_id}</p>
                              </td>
                              <td style="text-align: right;">
                                <p style="color: #A0826D; font-size: 12px; margin: 0 0 5px; text-transform: uppercase; letter-spacing: 1px;">Shipped On</p>
                                <p style="color: #2C1810; font-size: 14px; margin: 0;">${shippedDate}</p>
                              </td>
                            </tr>
                          </table>
                        </div>

                        <!-- Tracking Section -->
                        <div style="background-color: #F5F0E8; border-radius: 8px; padding: 20px; margin: 0 0 30px; text-align: center;">
                          <p style="color: #A0826D; font-size: 12px; margin: 0 0 5px; text-transform: uppercase; letter-spacing: 1px;">Tracking Number</p>
                          <p style="color: #2C1810; font-size: 18px; font-weight: bold; margin: 0 0 15px; font-family: monospace;">${trackingNumber}</p>
                          <a href="${trackingUrl}" style="display: inline-block; background-color: #8B4513; color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; border-radius: 4px;">Track Your Package</a>
                        </div>

                        <!-- Items Shipped -->
                        <h3 style="color: #8B4513; font-size: 14px; font-weight: normal; margin: 0 0 15px; text-transform: uppercase; letter-spacing: 2px;">
                          Items Shipped
                        </h3>

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 30px;">
                          ${itemsHtml}
                        </table>

                        <!-- Shipping Address -->
                        <h3 style="color: #8B4513; font-size: 14px; font-weight: normal; margin: 0 0 15px; text-transform: uppercase; letter-spacing: 2px;">
                          Shipping To
                        </h3>

                        <div style="background-color: #F5F0E8; border-radius: 8px; padding: 20px; margin: 0 0 30px;">
                          ${addressHtml}
                        </div>

                        <!-- CTA Button -->
                        <div style="text-align: center;">
                          <a href="${orderUrl}" style="display: inline-block; background-color: #2C1810; color: #ffffff; text-decoration: none; padding: 16px 40px; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; border-radius: 4px;">
                            View Your Order
                          </a>
                        </div>
                      </td>
                    </tr>

                    <!-- Care Instructions Teaser -->
                    <tr>
                      <td style="padding: 0 40px 40px;">
                        <div style="border: 1px solid #E8E0D8; border-radius: 8px; padding: 20px; text-align: center;">
                          <p style="color: #8B4513; font-size: 14px; margin: 0 0 5px; font-weight: 500;">
                            Pottery Care Tip
                          </p>
                          <p style="color: #5C4033; font-size: 13px; margin: 0;">
                            Hand wash with mild soap for best results. Avoid sudden temperature changes.
                          </p>
                        </div>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #F5F0E8; padding: 30px 40px; text-align: center;">
                        <p style="color: #8B4513; font-size: 14px; margin: 0 0 15px;">
                          Every piece is handcrafted with love
                        </p>
                        <p style="color: #A0826D; font-size: 12px; margin: 0;">
                          Table Clay | Handmade Pottery<br>
                          <a href="https://tableclay.com" style="color: #8B4513;">tableclay.com</a>
                        </p>
                        <p style="color: #A0826D; font-size: 11px; margin: 20px 0 0;">
                          Questions? Contact us at <a href="mailto:orders@tableclay.com" style="color: #8B4513;">orders@tableclay.com</a>
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        text: `
Your Order Is On Its Way!

Great news! Your handcrafted pieces have been carefully packed and shipped.

Order Number: #${orderData.display_id}
Shipped On: ${shippedDate}

Tracking Number: ${trackingNumber}
Track your package: ${trackingUrl}

ITEMS SHIPPED
${itemsText}

SHIPPING TO
${addressText}

View your order: ${orderUrl}

---
Pottery Care Tip: Hand wash with mild soap for best results. Avoid sudden temperature changes.

---
Table Clay | Handmade Pottery
Every piece is handcrafted with love
tableclay.com

Questions? Contact us at orders@tableclay.com
        `,
      },
    })

    console.log(`[test-shipping-flow] Shipping email sent to ${email}!`)

    return res.json({
      success: true,
      message: `Test shipping email sent to ${email}`,
      order: {
        id: orderData.id,
        display_id: orderData.display_id,
      },
      tracking: {
        number: trackingNumber,
        url: trackingUrl,
      },
    })
  } catch (error) {
    console.error("[test-shipping-flow] Error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error,
    })
  }
}

/**
 * GET /admin/test-shipping-flow
 *
 * Check the endpoint status
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query")

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "display_id", "email"],
      filters: {},
    })

    return res.json({
      success: true,
      message: "Test shipping flow endpoint ready",
      usage: {
        simple: 'POST /admin/test-shipping-flow with { "email": "your@email.com" }',
        with_order: 'POST /admin/test-shipping-flow with { "email": "your@email.com", "order_id": "order_xxx" }',
      },
      available_orders: orders?.slice(0, 5).map((o: { id: string; display_id: number }) => ({
        id: o.id,
        display_id: o.display_id,
      })) || [],
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
