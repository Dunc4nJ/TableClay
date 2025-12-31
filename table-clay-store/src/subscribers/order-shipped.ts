import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

type FulfillmentItem = {
  title?: string
  quantity: number
  line_item_id?: string
}

type FulfillmentLabel = {
  tracking_number?: string
  tracking_url?: string
  label_url?: string
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

/**
 * Subscriber for shipment.created event
 * Sends a shipping notification email when an order is marked as shipped
 */
export default async function orderShippedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  console.log(`[order-shipped] Event received! Fulfillment ID: ${data.id}`)

  // Don't send if notification is suppressed
  if (data.no_notification) {
    console.log(`Shipping notification suppressed for fulfillment ${data.id}`)
    return
  }

  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const query = container.resolve("query")

  try {
    // Fetch fulfillment with related order data
    const { data: [fulfillment] } = await query.graph({
      entity: "fulfillment",
      fields: [
        "id",
        "shipped_at",
        "labels.*",
        "items.*",
        "delivery_address.*",
      ],
      filters: {
        id: data.id,
      },
    })

    if (!fulfillment) {
      console.log("Fulfillment not found:", data.id)
      return
    }

    // Get the order associated with this fulfillment via order_id or items
    // We need to find the order to get email and display_id
    const fulfillmentItems = (fulfillment.items || []) as FulfillmentItem[]

    if (fulfillmentItems.length === 0) {
      console.log("No items in fulfillment:", data.id)
      return
    }

    // Get the first item's line_item_id to find the order
    const lineItemId = fulfillmentItems[0]?.line_item_id

    if (!lineItemId) {
      console.log("No line_item_id found in fulfillment items:", data.id)
      return
    }

    // Query to find the order containing this line item
    // Using 'any' for the result type since Medusa's graph query returns complex nested types
    const { data: orderItems } = await query.graph({
      entity: "order_item",
      fields: [
        "id",
        "order.id",
        "order.email",
        "order.display_id",
        "order.currency_code",
        "order.shipping_address.*",
      ],
      filters: {
        id: lineItemId,
      },
    }) as { data: Array<{ order?: { id: string; email?: string; display_id?: number; currency_code?: string; shipping_address?: ShippingAddress } }> }

    const orderItem = orderItems?.[0]

    if (!orderItem?.order?.email) {
      console.log("Could not find order email for fulfillment:", data.id)
      return
    }

    const order = orderItem.order as {
      id: string
      email: string
      display_id: number
      currency_code?: string
      shipping_address?: ShippingAddress
    }

    const labels = (fulfillment.labels || []) as FulfillmentLabel[]
    // Use delivery_address from fulfillment or fall back to order shipping_address
    const fulfillmentData = fulfillment as { delivery_address?: ShippingAddress }
    const shippingAddress = (fulfillmentData.delivery_address || order.shipping_address) as ShippingAddress | undefined

    // Get tracking info from labels
    const trackingNumber = labels[0]?.tracking_number
    const trackingUrl = labels[0]?.tracking_url

    // Format shipped date
    const shippedDate = fulfillment.shipped_at
      ? new Date(fulfillment.shipped_at as string).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })

    // Generate items HTML
    const itemsHtml = fulfillmentItems
      .map(
        (item) => `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #E8E0D8;">
              <p style="color: #2C1810; font-size: 14px; margin: 0;">
                ${item.title || "Item"} × ${item.quantity}
              </p>
            </td>
          </tr>
        `
      )
      .join("")

    // Generate items text
    const itemsText = fulfillmentItems
      .map((item) => `  - ${item.title || "Item"} × ${item.quantity}`)
      .join("\n")

    // Format shipping address
    const addressHtml = shippingAddress
      ? `
          <p style="color: #5C4033; font-size: 14px; line-height: 1.6; margin: 0;">
            ${shippingAddress.first_name || ""} ${shippingAddress.last_name || ""}<br>
            ${shippingAddress.address_1 || ""}${shippingAddress.address_2 ? `<br>${shippingAddress.address_2}` : ""}<br>
            ${shippingAddress.city || ""}, ${shippingAddress.province || ""} ${shippingAddress.postal_code || ""}<br>
            ${(shippingAddress.country_code || "").toUpperCase()}
          </p>
        `
      : "<p style=\"color: #A0826D; font-size: 14px; margin: 0;\">Address on file</p>"

    const addressText = shippingAddress
      ? `${shippingAddress.first_name || ""} ${shippingAddress.last_name || ""}
${shippingAddress.address_1 || ""}${shippingAddress.address_2 ? `\n${shippingAddress.address_2}` : ""}
${shippingAddress.city || ""}, ${shippingAddress.province || ""} ${shippingAddress.postal_code || ""}
${(shippingAddress.country_code || "").toUpperCase()}`
      : "Address on file"

    // Generate tracking section HTML (only if tracking info available)
    const trackingHtml = trackingNumber
      ? `
          <div style="background-color: #F5F0E8; border-radius: 8px; padding: 20px; margin: 0 0 30px; text-align: center;">
            <p style="color: #A0826D; font-size: 12px; margin: 0 0 5px; text-transform: uppercase; letter-spacing: 1px;">Tracking Number</p>
            <p style="color: #2C1810; font-size: 18px; font-weight: bold; margin: 0 0 15px; font-family: monospace;">${trackingNumber}</p>
            ${
              trackingUrl
                ? `<a href="${trackingUrl}" style="display: inline-block; background-color: #8B4513; color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; border-radius: 4px;">Track Your Package</a>`
                : ""
            }
          </div>
        `
      : `
          <div style="background-color: #F5F0E8; border-radius: 8px; padding: 20px; margin: 0 0 30px; text-align: center;">
            <p style="color: #5C4033; font-size: 14px; margin: 0;">
              Your order has been shipped and is on its way to you!
            </p>
          </div>
        `

    const trackingText = trackingNumber
      ? `Tracking Number: ${trackingNumber}${trackingUrl ? `\nTrack your package: ${trackingUrl}` : ""}`
      : "Your order has been shipped and is on its way to you!"

    // Order URL
    const orderUrl = `https://tableclay.com/us/order/${order.id}/confirmed`

    // Send shipping notification email
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: "email",
      content: {
        subject: `Your Table Clay Order #${order.display_id} Has Shipped!`,
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
                                <p style="color: #2C1810; font-size: 18px; font-weight: bold; margin: 0;">#${order.display_id}</p>
                              </td>
                              <td style="text-align: right;">
                                <p style="color: #A0826D; font-size: 12px; margin: 0 0 5px; text-transform: uppercase; letter-spacing: 1px;">Shipped On</p>
                                <p style="color: #2C1810; font-size: 14px; margin: 0;">${shippedDate}</p>
                              </td>
                            </tr>
                          </table>
                        </div>

                        <!-- Tracking Section -->
                        ${trackingHtml}

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
                            💡 Pottery Care Tip
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

Order Number: #${order.display_id}
Shipped On: ${shippedDate}

${trackingText}

ITEMS SHIPPED
${itemsText}

SHIPPING TO
${addressText}

View your order: ${orderUrl}

---
💡 Pottery Care Tip: Hand wash with mild soap for best results. Avoid sudden temperature changes.

---
Table Clay | Handmade Pottery
Every piece is handcrafted with love
tableclay.com

Questions? Contact us at orders@tableclay.com
        `,
      },
    })

    console.log(`Shipping notification email sent to ${order.email} for order #${order.display_id}`)
  } catch (error) {
    console.error(`Failed to send shipping notification email:`, error)
    // Re-throw to let Medusa handle retry logic
    throw error
  }
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
