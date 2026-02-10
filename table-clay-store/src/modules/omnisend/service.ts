import { MedusaError } from "@medusajs/framework/utils"
import type {
  OmnisendContactRequest,
  OmnisendEventContact,
  OmnisendEventOptions,
  OmnisendOrderProperties,
  OmnisendFulfillmentProperties,
  OmnisendCategory,
  OmnisendCartProperties,
  OmnisendApiError,
} from "./types"

const OMNISEND_API_BASE = "https://api.omnisend.com/v5"

type OmnisendModuleOptions = {
  api_key?: string
}

/**
 * OmniSend Module Service
 * Handles OmniSend API v5 communication for contacts and events
 */
class OmnisendModuleService {
  private apiKey: string
  private logger: { info: (msg: string) => void; error: (msg: string, error?: unknown) => void }

  constructor(
    { logger }: { logger?: { info: (msg: string) => void; error: (msg: string, error?: unknown) => void } },
    options: OmnisendModuleOptions
  ) {
    this.logger = logger || {
      info: (msg: string) => console.log(`[OmniSend] ${msg}`),
      error: (msg: string, error?: unknown) => console.error(`[OmniSend] ${msg}`, error),
    }

    if (!options?.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "OmniSend API key is required. Set OMNISEND_API_KEY environment variable."
      )
    }
    this.apiKey = options.api_key
  }

  /**
   * Make authenticated request to OmniSend API
   */
  private async request<T = unknown>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${OMNISEND_API_BASE}${endpoint}`

    const headers: Record<string, string> = {
      "X-API-KEY": this.apiKey,
      "Content-Type": "application/json",
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as OmnisendApiError
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          `OmniSend API error: ${errorMessage}`
        )
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204 || response.headers.get("content-length") === "0") {
        return {} as T
      }

      return (await response.json()) as T
    } catch (error) {
      if (error instanceof MedusaError) {
        throw error
      }

      this.logger.error("OmniSend API request failed", error)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `OmniSend API request failed: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Create or update a contact in OmniSend
   */
  async createOrUpdateContact(data: OmnisendContactRequest): Promise<void> {
    const payload: Record<string, unknown> = {}

    if (data.email) {
      payload.email = data.email
    }
    if (data.phone) {
      payload.phone = data.phone
    }
    if (data.firstName) {
      payload.firstName = data.firstName
    }
    if (data.lastName) {
      payload.lastName = data.lastName
    }
    if (data.identifiers && data.identifiers.length > 0) {
      payload.identifiers = data.identifiers
    }
    if (data.customProperties) {
      payload.customProperties = data.customProperties
    }
    if (data.tags && data.tags.length > 0) {
      payload.tags = data.tags
    }
    if (data.consent) {
      payload.consent = data.consent
    }
    if (data.sendWelcomeEmail !== undefined) {
      payload.sendWelcomeEmail = data.sendWelcomeEmail
    }

    await this.request("POST", "/contacts", payload)
    this.logger.info(`Created/updated OmniSend contact: ${data.email || data.phone}`)
  }

  /**
   * Send a custom event to OmniSend
   */
  async sendEvent(
    eventName: string,
    contact: OmnisendEventContact,
    properties?: Record<string, unknown>,
    options?: OmnisendEventOptions
  ): Promise<void> {
    const payload: Record<string, unknown> = {
      eventName: eventName,
      origin: "api",
      contact,
    }

    if (properties) {
      payload.properties = properties
    }
    if (options?.eventVersion) {
      payload.eventVersion = options.eventVersion
    }
    if (options?.eventID) {
      payload.eventID = options.eventID
    }

    await this.request("POST", "/events", payload)
    this.logger.info(`Sent OmniSend event: ${eventName} for ${contact.email || contact.phone}`)
  }

  /**
   * Send "placed order" event to OmniSend
   */
  async sendOrderPlacedEvent(
    contactEmail: string,
    orderData: OmnisendOrderProperties
  ): Promise<void> {
    const properties: Record<string, unknown> = {
      orderID: orderData.orderID,
      currency: orderData.currency,
      totalPrice: orderData.totalPrice,
    }

    if (orderData.orderNumber) {
      properties.orderNumber = orderData.orderNumber
    }
    if (orderData.subTotalPrice !== undefined) {
      properties.subTotalPrice = orderData.subTotalPrice
    }
    if (orderData.shippingPrice !== undefined) {
      properties.shippingPrice = orderData.shippingPrice
    }
    if (orderData.taxPrice !== undefined) {
      properties.taxPrice = orderData.taxPrice
    }
    if (orderData.discountValue !== undefined) {
      properties.discountValue = orderData.discountValue
    }
    if (orderData.createdAt) {
      properties.createdAt = orderData.createdAt
    }
    if (orderData.paymentStatus) {
      properties.paymentStatus = orderData.paymentStatus
    }
    if (orderData.fulfillmentStatus) {
      properties.fulfillmentStatus = orderData.fulfillmentStatus
    }
    if (orderData.orderURL) {
      properties.orderURL = orderData.orderURL
    }
    if (orderData.lineItems && orderData.lineItems.length > 0) {
      properties.lineItems = orderData.lineItems
    }
    if (orderData.shippingAddress) {
      properties.shippingAddress = orderData.shippingAddress
    }
    if (orderData.billingAddress) {
      properties.billingAddress = orderData.billingAddress
    }

    await this.sendEvent(
      "placed order",
      { email: contactEmail },
      properties,
      { eventVersion: "v2" }
    )
  }

  /**
   * Send "order fulfilled" event to OmniSend
   */
  async sendOrderFulfilledEvent(
    contactEmail: string,
    fulfillmentData: OmnisendFulfillmentProperties
  ): Promise<void> {
    const properties: Record<string, unknown> = {
      orderID: fulfillmentData.orderID,
    }

    if (fulfillmentData.orderNumber) {
      properties.orderNumber = fulfillmentData.orderNumber
    }
    if (fulfillmentData.fulfillmentStatus) {
      properties.fulfillmentStatus = fulfillmentData.fulfillmentStatus
    }
    if (fulfillmentData.trackingNumber) {
      properties.trackingNumber = fulfillmentData.trackingNumber
    }
    if (fulfillmentData.trackingURL) {
      properties.trackingURL = fulfillmentData.trackingURL
    }
    if (fulfillmentData.carrier) {
      properties.carrier = fulfillmentData.carrier
    }
    if (fulfillmentData.fulfilledAt) {
      properties.fulfilledAt = fulfillmentData.fulfilledAt
    }

    await this.sendEvent(
      "order fulfilled",
      { email: contactEmail },
      properties,
      { eventVersion: "v2" }
    )
  }
  /**
   * Send "$cartUpdated" event to OmniSend for abandoned cart recovery
   */
  async sendCartUpdatedEvent(
    contactEmail: string,
    cartData: OmnisendCartProperties
  ): Promise<void> {
    const properties: Record<string, unknown> = {
      cartID: cartData.cartID,
      currency: cartData.currency,
      cartTotal: cartData.value,
      abandonedCheckoutURL: cartData.abandonedCheckoutURL,
    }

    if (cartData.lineItems && cartData.lineItems.length > 0) {
      properties.lineItems = cartData.lineItems
    }

    await this.sendEvent(
      "$cartUpdated",
      { email: contactEmail },
      properties
    )
  }

  /**
   * Create or update a category in OmniSend
   */
  async createOrUpdateCategory(data: OmnisendCategory): Promise<void> {
    await this.request("POST", "/product-categories", {
      categoryID: data.categoryID,
      title: data.title,
    })
    this.logger.info(`Synced OmniSend category: ${data.title} (${data.categoryID})`)
  }

  /**
   * Delete a category from OmniSend
   */
  async deleteCategory(categoryId: string): Promise<void> {
    await this.request("DELETE", `/product-categories/${categoryId}`)
    this.logger.info(`Deleted OmniSend category: ${categoryId}`)
  }

  /**
   * Sync all Medusa product categories to OmniSend
   * Accepts pre-fetched categories to avoid circular dependency on Modules
   */
  async syncAllCategories(
    categories: { id: string; name: string }[]
  ): Promise<{ synced: number; failed: number; errors: string[] }> {
    let synced = 0
    let failed = 0
    const errors: string[] = []

    for (const category of categories) {
      try {
        await this.createOrUpdateCategory({
          categoryID: category.id,
          title: category.name,
        })
        synced++
      } catch (error) {
        failed++
        const msg = `Failed to sync category ${category.name}: ${error instanceof Error ? error.message : "Unknown error"}`
        errors.push(msg)
        this.logger.error(msg)
      }
    }

    this.logger.info(`OmniSend category sync complete: ${synced} synced, ${failed} failed`)
    return { synced, failed, errors }
  }
}

export default OmnisendModuleService
