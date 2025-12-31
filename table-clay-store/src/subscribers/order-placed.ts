import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { NEWSLETTER_MODULE } from "../modules/newsletter"
import type NewsletterModuleService from "../modules/newsletter/service"

type OrderItem = {
  title: string
  quantity: number
  unit_price: number
  total: number
  thumbnail?: string
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

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const query = container.resolve("query")

  // Fetch order details including promotions for discount tracking
  const { data: [order] } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "email",
      "display_id",
      "created_at",
      "total",
      "subtotal",
      "shipping_total",
      "tax_total",
      "discount_total",
      "currency_code",
      "items.*",
      "shipping_address.*",
      "summary.pending_difference",
    ],
    filters: {
      id: data.id,
    },
  })

  if (!order || !order.email) {
    console.log("Order not found or no email:", data.id)
    return
  }

  const items = (order.items || []) as OrderItem[]
  const shippingAddress = order.shipping_address as ShippingAddress | undefined
  const currencyCode = (order.currency_code || "USD").toUpperCase()

  // Format currency
  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount / 100)
  }

  // Format date
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Generate items HTML
  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 15px 0; border-bottom: 1px solid #E8E0D8;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="vertical-align: top;">
                  <p style="color: #2C1810; font-size: 16px; margin: 0 0 5px; font-weight: 500;">
                    ${item.title}
                  </p>
                  <p style="color: #A0826D; font-size: 14px; margin: 0;">
                    Qty: ${item.quantity}
                  </p>
                </td>
                <td style="text-align: right; vertical-align: top;">
                  <p style="color: #2C1810; font-size: 16px; margin: 0;">
                    ${formatPrice(item.total)}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `
    )
    .join("")

  // Generate items text
  const itemsText = items
    .map((item) => `  - ${item.title} x${item.quantity} = ${formatPrice(item.total)}`)
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
    : "<p style=\"color: #A0826D; font-size: 14px; margin: 0;\">No shipping address provided</p>"

  const addressText = shippingAddress
    ? `${shippingAddress.first_name || ""} ${shippingAddress.last_name || ""}
${shippingAddress.address_1 || ""}${shippingAddress.address_2 ? `\n${shippingAddress.address_2}` : ""}
${shippingAddress.city || ""}, ${shippingAddress.province || ""} ${shippingAddress.postal_code || ""}
${(shippingAddress.country_code || "").toUpperCase()}`
    : "No shipping address provided"

  // Order confirmation URL
  const orderUrl = `https://tableclay.com/us/order/${order.id}/confirmed`

  try {
    // Send order confirmation email with inline content
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: "email",
      content: {
        subject: `Order Confirmed - Table Clay #${order.display_id}`,
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
                        <!-- Thank You Message -->
                        <h2 style="color: #2C1810; font-size: 28px; font-weight: normal; margin: 0 0 10px; text-align: center;">
                          Thank You for Your Order!
                        </h2>

                        <p style="color: #5C4033; font-size: 16px; line-height: 1.6; margin: 0 0 30px; text-align: center;">
                          We're preparing your handcrafted pieces with care.
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
                                <p style="color: #A0826D; font-size: 12px; margin: 0 0 5px; text-transform: uppercase; letter-spacing: 1px;">Order Date</p>
                                <p style="color: #2C1810; font-size: 14px; margin: 0;">${orderDate}</p>
                              </td>
                            </tr>
                          </table>
                        </div>

                        <!-- Order Items -->
                        <h3 style="color: #8B4513; font-size: 14px; font-weight: normal; margin: 0 0 15px; text-transform: uppercase; letter-spacing: 2px;">
                          Order Details
                        </h3>

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 20px;">
                          ${itemsHtml}
                        </table>

                        <!-- Order Totals -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 30px;">
                          <tr>
                            <td style="padding: 8px 0;">
                              <p style="color: #5C4033; font-size: 14px; margin: 0;">Subtotal</p>
                            </td>
                            <td style="text-align: right; padding: 8px 0;">
                              <p style="color: #5C4033; font-size: 14px; margin: 0;">${formatPrice(order.subtotal || 0)}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <p style="color: #5C4033; font-size: 14px; margin: 0;">Shipping</p>
                            </td>
                            <td style="text-align: right; padding: 8px 0;">
                              <p style="color: #5C4033; font-size: 14px; margin: 0;">${formatPrice(order.shipping_total || 0)}</p>
                            </td>
                          </tr>
                          ${
                            order.discount_total && order.discount_total > 0
                              ? `
                          <tr>
                            <td style="padding: 8px 0;">
                              <p style="color: #8B4513; font-size: 14px; margin: 0;">Discount</p>
                            </td>
                            <td style="text-align: right; padding: 8px 0;">
                              <p style="color: #8B4513; font-size: 14px; margin: 0;">-${formatPrice(order.discount_total)}</p>
                            </td>
                          </tr>
                          `
                              : ""
                          }
                          <tr>
                            <td style="padding: 8px 0;">
                              <p style="color: #5C4033; font-size: 14px; margin: 0;">Tax</p>
                            </td>
                            <td style="text-align: right; padding: 8px 0;">
                              <p style="color: #5C4033; font-size: 14px; margin: 0;">${formatPrice(order.tax_total || 0)}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 15px 0 0; border-top: 2px solid #8B4513;">
                              <p style="color: #2C1810; font-size: 18px; font-weight: bold; margin: 0;">Total</p>
                            </td>
                            <td style="text-align: right; padding: 15px 0 0; border-top: 2px solid #8B4513;">
                              <p style="color: #2C1810; font-size: 18px; font-weight: bold; margin: 0;">${formatPrice(order.total || 0)}</p>
                            </td>
                          </tr>
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
Thank You for Your Order!

We're preparing your handcrafted pieces with care.

Order Number: #${order.display_id}
Order Date: ${orderDate}

ORDER DETAILS
${itemsText}

Subtotal: ${formatPrice(order.subtotal || 0)}
Shipping: ${formatPrice(order.shipping_total || 0)}${order.discount_total && order.discount_total > 0 ? `\nDiscount: -${formatPrice(order.discount_total)}` : ""}
Tax: ${formatPrice(order.tax_total || 0)}
Total: ${formatPrice(order.total || 0)}

SHIPPING TO
${addressText}

View your order: ${orderUrl}

---
Table Clay | Handmade Pottery
Every piece is handcrafted with love
tableclay.com

Questions? Contact us at orders@tableclay.com
        `,
      },
    })

    console.log(`Order confirmation email sent to ${order.email} for order #${order.display_id}`)
  } catch (error) {
    console.error(`Failed to send order confirmation email to ${order.email}:`, error)
    // Re-throw to let Medusa handle retry logic
    throw error
  }

  // Track newsletter discount code usage
  // Only track if this order has a discount applied
  if (order.discount_total && order.discount_total > 0) {
    try {
      const newsletterService: NewsletterModuleService = container.resolve(NEWSLETTER_MODULE)

      // Query order with shipping method adjustments to find applied promotion codes
      const { data: [orderWithAdjustments] } = await query.graph({
        entity: "order",
        fields: [
          "id",
          "shipping_methods.adjustments.code",
          "items.adjustments.code",
        ],
        filters: {
          id: data.id,
        },
      })

      // Collect all promotion codes from adjustments
      const appliedCodes = new Set<string>()

      // Check shipping method adjustments (where FREESHIP codes apply)
      const shippingMethods = (orderWithAdjustments?.shipping_methods || []) as Array<{
        adjustments?: Array<{ code?: string }>
      }>
      for (const method of shippingMethods) {
        for (const adj of method.adjustments || []) {
          if (adj.code && adj.code.startsWith("FREESHIP-")) {
            appliedCodes.add(adj.code)
          }
        }
      }

      // Also check item adjustments (in case code was applied to items)
      const orderItems = (orderWithAdjustments?.items || []) as Array<{
        adjustments?: Array<{ code?: string }>
      }>
      for (const item of orderItems) {
        for (const adj of item.adjustments || []) {
          if (adj.code && adj.code.startsWith("FREESHIP-")) {
            appliedCodes.add(adj.code)
          }
        }
      }

      // Mark each applied FREESHIP code as used
      for (const code of appliedCodes) {
        await newsletterService.markDiscountCodeUsed(code)
        console.log(`Marked newsletter discount code ${code} as used for order #${order.display_id}`)
      }
    } catch (discountError) {
      // Don't fail the order if discount tracking fails - just log it
      console.warn("Failed to track newsletter discount code usage:", discountError)
    }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
