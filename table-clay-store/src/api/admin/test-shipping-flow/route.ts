import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { OMNISEND_MODULE } from "../../../modules/omnisend"
import type OmnisendModuleService from "../../../modules/omnisend/service"

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
 * Test endpoint that sends an OmniSend "order fulfilled" event.
 * OmniSend automation will send the shipping notification email.
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
    const omnisendService: OmnisendModuleService = req.scope.resolve(OMNISEND_MODULE)
    const query = req.scope.resolve("query")

    // Find an order to use for test data
    let orderData: {
      id: string
      display_id: string | number | null | undefined
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

    // Generate test tracking data
    const trackingNumber = "TEST-" + Date.now().toString().slice(-8)
    const trackingUrl = `https://example.com/track/${trackingNumber}`
    const fulfilledAt = new Date().toISOString()

    // Send OmniSend "order fulfilled" event
    console.log(`[test-shipping-flow] Sending OmniSend order fulfilled event for ${email}...`)

    await omnisendService.sendOrderFulfilledEvent(email, {
      orderID: orderData.id,
      orderNumber: String(orderData.display_id || orderData.id),
      fulfillmentStatus: "fulfilled",
      trackingNumber,
      trackingURL: trackingUrl,
      carrier: "Test Carrier",
      fulfilledAt,
    })

    console.log(`[test-shipping-flow] OmniSend event sent for ${email}!`)

    return res.json({
      success: true,
      provider: "omnisend",
      message: `OmniSend "order fulfilled" event sent for ${email}`,
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
      provider: "omnisend",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

/**
 * GET /admin/test-shipping-flow
 *
 * Check the endpoint status and OmniSend configuration
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query")

    let moduleResolved = false
    try {
      const omnisendService = req.scope.resolve(OMNISEND_MODULE)
      moduleResolved = !!omnisendService
    } catch {
      moduleResolved = false
    }

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "display_id", "email"],
      filters: {},
    })

    return res.json({
      success: true,
      provider: "omnisend",
      message: "Test shipping flow endpoint ready",
      configured: !!process.env.OMNISEND_API_KEY,
      moduleResolved,
      usage: {
        simple: 'POST /admin/test-shipping-flow with { "email": "your@email.com" }',
        with_order: 'POST /admin/test-shipping-flow with { "email": "your@email.com", "order_id": "order_xxx" }',
      },
      available_orders: orders?.slice(0, 5).map((o) => ({
        id: o.id,
        display_id: o.display_id,
      })) || [],
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      provider: "omnisend",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
