import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

type NewsletterSubscribedData = {
  id: string
  email: string
  first_name?: string
  discount_code: string
}

/**
 * Sends welcome email with free shipping discount code
 * when a user subscribes to the newsletter
 */
export default async function newsletterSubscribedHandler({
  event: { data },
  container,
}: SubscriberArgs<NewsletterSubscribedData>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  const { email, first_name, discount_code } = data

  try {
    // Send welcome email with discount code
    // Note: This uses inline content until SendGrid templates are set up
    // TODO: Replace with SendGrid dynamic template ID when available
    await notificationModuleService.createNotifications({
      to: email,
      channel: "email",
      content: {
        subject: "Welcome to Table Clay! Here's Your Free Shipping Code",
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
                      <td style="padding: 50px 40px; text-align: center;">
                        <h2 style="color: #2C1810; font-size: 32px; font-weight: normal; margin: 0 0 20px;">
                          Welcome${first_name ? `, ${first_name}` : ""}!
                        </h2>

                        <p style="color: #5C4033; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                          Thank you for joining the Table Clay family. We're thrilled to have you!
                        </p>

                        <p style="color: #5C4033; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                          As a welcome gift, here's your exclusive <strong>free shipping code</strong>:
                        </p>

                        <!-- Discount Code Box -->
                        <div style="background-color: #F5F0E8; border: 2px dashed #8B4513; border-radius: 8px; padding: 25px; margin: 30px 0;">
                          <p style="color: #8B4513; font-size: 12px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 2px;">
                            Your Free Shipping Code
                          </p>
                          <p style="color: #2C1810; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 3px;">
                            ${discount_code}
                          </p>
                        </div>

                        <p style="color: #8B4513; font-size: 14px; margin: 0 0 30px; font-style: italic;">
                          Limited time offer - Use it on your first order!
                        </p>

                        <!-- CTA Button -->
                        <a href="https://tableclay.com" style="display: inline-block; background-color: #2C1810; color: #ffffff; text-decoration: none; padding: 16px 40px; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; border-radius: 4px;">
                          Shop Now
                        </a>
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
                          <a href="https://tableclay.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #A0826D;">Unsubscribe</a>
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
Welcome${first_name ? `, ${first_name}` : ""}!

Thank you for joining the Table Clay family. We're thrilled to have you!

As a welcome gift, here's your exclusive FREE SHIPPING CODE:

${discount_code}

Limited time offer - Use it on your first order!

Shop now at https://tableclay.com

---
Table Clay | Handmade Pottery
Every piece is handcrafted with love

Unsubscribe: https://tableclay.com/unsubscribe?email=${encodeURIComponent(email)}
        `,
      },
    })

    console.log(`Welcome email sent to ${email} with discount code ${discount_code}`)
  } catch (error) {
    console.error(`Failed to send welcome email to ${email}:`, error)
    // Don't throw - we don't want to fail the subscription if email fails
  }
}

export const config: SubscriberConfig = {
  event: "newsletter.subscribed",
}
