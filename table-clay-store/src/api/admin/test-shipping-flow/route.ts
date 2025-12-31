import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  createOrderWorkflow,
  createOrderFulfillmentWorkflow,
  createOrderShipmentWorkflow,
} from "@medusajs/medusa/core-flows"

type TestShippingInput = {
  email?: string
}

/**
 * POST /admin/test-shipping-flow
 *
 * Test endpoint that creates an order, fulfillment, and shipment in one call.
 * This triggers the shipment.created event which sends the shipping notification email.
 *
 * Usage:
 * curl -X POST https://tableclay-production.up.railway.app/admin/test-shipping-flow \
 *   -H "Authorization: Bearer $TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"email": "your@email.com"}'
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { email = "duncanejurman@gmail.com" } = req.body as TestShippingInput

  try {
    const query = req.scope.resolve("query")

    // 1. Get existing product variant (Blue Cloud Mug)
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "sku", "title"],
      filters: { sku: "CLOUD-MUG-BLUE" },
    })

    if (!variants || variants.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No product variant found with SKU CLOUD-MUG-BLUE",
      })
    }

    const variant = variants[0]
    console.log(`[test-shipping-flow] Using variant: ${variant.id} (${variant.sku})`)

    // 2. Get US region
    const { data: regions } = await query.graph({
      entity: "region",
      fields: ["id", "name", "currency_code"],
      filters: { currency_code: "usd" },
    })

    if (!regions || regions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No USD region found",
      })
    }

    const region = regions[0]
    console.log(`[test-shipping-flow] Using region: ${region.id} (${region.name})`)

    // 3. Get sales channel
    const { data: salesChannels } = await query.graph({
      entity: "sales_channel",
      fields: ["id", "name"],
    })

    const salesChannel = salesChannels?.[0]
    console.log(`[test-shipping-flow] Using sales channel: ${salesChannel?.id}`)

    // 4. Create test order
    console.log(`[test-shipping-flow] Creating order for ${email}...`)

    const shippingAddress = {
      first_name: "Test",
      last_name: "Customer",
      address_1: "123 Test Street",
      city: "Portland",
      province: "OR",
      postal_code: "97214",
      country_code: "us",
    }

    const { result: order } = await createOrderWorkflow(req.scope).run({
      input: {
        email,
        region_id: region.id,
        sales_channel_id: salesChannel?.id,
        currency_code: "usd",
        items: [
          {
            variant_id: variant.id,
            quantity: 1,
            unit_price: 3499, // $34.99
            title: "Test Blue Cloud Mug",
          },
        ],
        shipping_address: shippingAddress,
        billing_address: shippingAddress,
      },
    })

    console.log(`[test-shipping-flow] Order created: #${order.display_id} (${order.id})`)

    // 5. Create fulfillment
    console.log(`[test-shipping-flow] Creating fulfillment...`)

    const orderItems = order.items?.map((item: { id: string; quantity: number }) => ({
      id: item.id,
      quantity: item.quantity,
    })) || []

    const { result: fulfillment } = await createOrderFulfillmentWorkflow(req.scope).run({
      input: {
        order_id: order.id,
        items: orderItems,
      },
    })

    console.log(`[test-shipping-flow] Fulfillment created: ${fulfillment.id}`)

    // 6. Create shipment (this triggers shipment.created event!)
    console.log(`[test-shipping-flow] Creating shipment (triggers email)...`)

    await createOrderShipmentWorkflow(req.scope).run({
      input: {
        order_id: order.id,
        fulfillment_id: fulfillment.id,
        items: orderItems,
        labels: [
          {
            tracking_number: "TEST-" + Date.now().toString().slice(-8),
            tracking_url: "https://example.com/track/TEST123",
            label_url: "",
          },
        ],
        no_notification: false, // Send the email!
      },
    })

    console.log(`[test-shipping-flow] Shipment created! Email should be sent to ${email}`)

    return res.json({
      success: true,
      message: `Test shipping email sent to ${email}`,
      order: {
        id: order.id,
        display_id: order.display_id,
        email: order.email,
      },
      fulfillment: {
        id: fulfillment.id,
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
 * Check the endpoint status and available products
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query")

    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "sku", "title"],
      filters: { sku: "CLOUD-MUG-BLUE" },
    })

    const { data: regions } = await query.graph({
      entity: "region",
      fields: ["id", "name", "currency_code"],
      filters: { currency_code: "usd" },
    })

    return res.json({
      success: true,
      message: "Test shipping flow endpoint ready",
      usage: "POST /admin/test-shipping-flow with { email: 'your@email.com' }",
      available: {
        variant: variants?.[0] || null,
        region: regions?.[0] || null,
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
