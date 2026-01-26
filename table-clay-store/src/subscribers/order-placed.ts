import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { OMNISEND_MODULE } from "../modules/omnisend"
import type OmnisendModuleService from "../modules/omnisend/service"
import type { OmnisendOrderLineItem, OmnisendAddress } from "../modules/omnisend/types"

type OrderItem = {
  id: string
  title: string
  quantity: number
  unit_price: number
  total: number
  thumbnail?: string
  variant_id?: string
  product_id?: string
  product?: {
    handle?: string
  }
}

type ShippingAddress = {
  first_name?: string
  last_name?: string
  company?: string
  address_1?: string
  address_2?: string
  city?: string
  province?: string
  postal_code?: string
  country_code?: string
  phone?: string
}

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
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
      "items.product.handle",
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

  // Use environment variable for base URL, fallback to production URL
  const storefrontBaseUrl = process.env.STOREFRONT_BASE_URL || "https://tableclay.com"

  // Order confirmation URL
  const orderUrl = `${storefrontBaseUrl}/us/order/${order.id}/confirmed`

  // Map line items to OmniSend format
  const lineItems: OmnisendOrderLineItem[] = items.map((item) => ({
    productID: item.product_id || item.id,
    variantID: item.variant_id,
    title: item.title,
    quantity: item.quantity,
    price: item.unit_price / 100, // Convert from cents
    discount: 0,
    imageURL: item.thumbnail,
    productURL: item.product?.handle
      ? `${storefrontBaseUrl}/us/products/${item.product.handle}`
      : undefined,
  }))

  // Map shipping address to OmniSend format
  const omnisendAddress: OmnisendAddress | undefined = shippingAddress
    ? {
        firstName: shippingAddress.first_name,
        lastName: shippingAddress.last_name,
        company: shippingAddress.company,
        address1: shippingAddress.address_1,
        address2: shippingAddress.address_2,
        city: shippingAddress.city,
        state: shippingAddress.province,
        postalCode: shippingAddress.postal_code,
        countryCode: shippingAddress.country_code?.toUpperCase(),
        phone: shippingAddress.phone,
      }
    : undefined

  try {
    // Send OmniSend "placed order" event
    const omnisendService: OmnisendModuleService = container.resolve(OMNISEND_MODULE)

    await omnisendService.sendOrderPlacedEvent(order.email, {
      orderID: order.id,
      orderNumber: String(order.display_id),
      totalPrice: (order.total || 0) / 100,
      subTotalPrice: (order.subtotal || 0) / 100,
      shippingPrice: (order.shipping_total || 0) / 100,
      taxPrice: (order.tax_total || 0) / 100,
      discountValue: (order.discount_total || 0) / 100,
      currency: currencyCode,
      createdAt: new Date(order.created_at).toISOString(),
      paymentStatus: "paid",
      fulfillmentStatus: "unfulfilled",
      orderURL: orderUrl,
      lineItems,
      shippingAddress: omnisendAddress,
    })

    console.log(`OmniSend order placed event sent for order #${order.display_id} (${order.email})`)
  } catch (error) {
    // Log error but do NOT re-throw - OmniSend failure should not block order placement
    console.error(`Failed to send OmniSend order placed event for order #${order.display_id}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
