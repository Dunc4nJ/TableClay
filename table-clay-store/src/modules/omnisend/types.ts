/**
 * OmniSend API v5 TypeScript Types
 * Based on https://api-docs.omnisend.com/reference
 */

// Contact types
export type OmnisendIdentifierChannel = "email" | "phone" | "sms"

export type OmnisendIdentifierStatus =
  | "subscribed"
  | "nonSubscribed"
  | "unsubscribed"

export type OmnisendConsentSource =
  | "import"
  | "form"
  | "checkout"
  | "api"
  | "other"

export interface OmnisendIdentifier {
  type: OmnisendIdentifierChannel
  id: string
  channels?: {
    email?: {
      status: OmnisendIdentifierStatus
      statusDate?: string
    }
    sms?: {
      status: OmnisendIdentifierStatus
      statusDate?: string
    }
  }
}

export interface OmnisendConsent {
  source?: OmnisendConsentSource
  createdAt?: string
}

export interface OmnisendContactRequest {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  identifiers?: OmnisendIdentifier[]
  customProperties?: Record<string, unknown>
  tags?: string[]
  consent?: OmnisendConsent
  sendWelcomeEmail?: boolean
}

// Event types
export interface OmnisendEventContact {
  email?: string
  phone?: string
}

export interface OmnisendEventOptions {
  eventVersion?: string
  eventID?: string
}

// Order types
export interface OmnisendOrderLineItem {
  productID: string
  sku?: string
  variantID?: string
  title: string
  quantity: number
  price: number
  discount?: number
  imageURL?: string
  productURL?: string
}

export interface OmnisendAddress {
  firstName?: string
  lastName?: string
  company?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  stateCode?: string
  postalCode?: string
  country?: string
  countryCode?: string
  phone?: string
}

export interface OmnisendOrderProperties {
  orderID: string
  orderNumber?: string
  totalPrice: number
  subTotalPrice?: number
  shippingPrice?: number
  taxPrice?: number
  discountValue?: number
  currency: string
  createdAt?: string
  paymentStatus?: "paid" | "awaitingPayment" | "partiallyPaid" | "refunded" | "partiallyRefunded" | "voided"
  fulfillmentStatus?: "unfulfilled" | "fulfilled" | "partiallyFulfilled" | "delivered" | "restocked"
  orderURL?: string
  lineItems?: OmnisendOrderLineItem[]
  shippingAddress?: OmnisendAddress
  billingAddress?: OmnisendAddress
}

export interface OmnisendFulfillmentProperties {
  orderID: string
  orderNumber?: string
  fulfillmentStatus?: "fulfilled" | "delivered"
  trackingNumber?: string
  trackingURL?: string
  carrier?: string
  fulfilledAt?: string
}

// API Response types
export interface OmnisendApiError {
  error?: string
  message?: string
  statusCode?: number
}
