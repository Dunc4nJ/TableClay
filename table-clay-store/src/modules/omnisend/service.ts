import { MedusaError } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"
import type {
  OmnisendContactRequest,
  OmnisendProduct,
  OmnisendProductStatus,
  OmnisendEventContact,
  OmnisendEventOptions,
  OmnisendOrderProperties,
  OmnisendFulfillmentProperties,
  OmnisendCategory,
  OmnisendCartProperties,
  OmnisendTemplate,
  OmnisendTemplateListResponse,
  OmnisendApiError,
} from "./types"

const OMNISEND_API_BASE = "https://api.omnisend.com/v5"

type OmnisendModuleOptions = {
  api_key?: string
}

type Logger = {
  info: (msg: string) => void
  error: (msg: string, error?: unknown) => void
}

type QueryService = {
  graph: (args: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
  }) => Promise<{ data: Array<Record<string, unknown>> }>
}

type MedusaCustomerRecord = {
  id: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
}

type ProductPriceRecord = {
  amount?: number | null
  currency_code?: string | null
}

type ProductVariantRecord = {
  id: string
  title?: string | null
  sku?: string | null
  inventory_quantity?: number | null
  manage_inventory?: boolean | null
  allow_backorder?: boolean | null
  prices?: ProductPriceRecord[]
}

type ProductCategoryRecord = {
  id: string
}

type ProductRecord = {
  id: string
  title?: string | null
  handle?: string | null
  description?: string | null
  thumbnail?: string | null
  status?: string | null
  variants?: ProductVariantRecord[]
  categories?: ProductCategoryRecord[]
}

export type SyncProductsResult = {
  total_products: number
  synced_count: number
  failed_count: number
  errors: Array<{
    product_id: string
    error: string
  }>
}

export type SyncContactsResult = {
  total_customers: number
  eligible_customers: number
  synced_count: number
  failed_count: number
  skipped_no_email: number
  errors: Array<{
    customer_id: string
    email: string | null
    error: string
  }>
}

/**
 * OmniSend Module Service
 * Handles OmniSend API v5 communication for contacts and events
 */
class OmnisendModuleService {
  private apiKey: string
  private logger: Logger

  constructor(
    {
      logger,
    }: {
      logger?: Logger
    },
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
   * Create or update a product in OmniSend
   */
  async createOrUpdateProduct(data: OmnisendProduct): Promise<void> {
    await this.request("POST", "/products", data)
    this.logger.info(`Created/updated OmniSend product: ${data.productID}`)
  }

  /**
   * Delete a product from OmniSend
   */
  async deleteProduct(productId: string): Promise<void> {
    await this.request("DELETE", `/products/${productId}`)
    this.logger.info(`Deleted OmniSend product: ${productId}`)
  }

  /**
   * Sync all published products from Medusa to OmniSend.
   * Individual product failures are captured without aborting the full batch.
   */
  async syncAllProducts(
    productService: IProductModuleService,
    options?: {
      batchSize?: number
      delayMs?: number
      storefrontBaseUrl?: string
    }
  ): Promise<SyncProductsResult> {
    const batchSize = Math.max(1, options?.batchSize ?? 50)
    const delayMs = Math.max(0, options?.delayMs ?? 200)
    const storefrontBaseUrl = options?.storefrontBaseUrl || "https://tableclay.com"

    const result: SyncProductsResult = {
      total_products: 0,
      synced_count: 0,
      failed_count: 0,
      errors: [],
    }

    let skip = 0

    while (true) {
      const products = (await productService.listProducts(
        { status: "published" },
        {
          relations: ["variants", "variants.prices", "categories"],
          select: [
            "id",
            "title",
            "handle",
            "description",
            "thumbnail",
            "status",
            "variants.id",
            "variants.title",
            "variants.sku",
            "variants.inventory_quantity",
            "variants.manage_inventory",
            "variants.allow_backorder",
            "variants.prices.amount",
            "variants.prices.currency_code",
            "categories.id",
          ],
          take: batchSize,
          skip,
          order: { created_at: "ASC" },
        }
      )) as ProductRecord[]

      if (products.length === 0) {
        break
      }

      result.total_products += products.length

      for (const product of products) {
        try {
          const productTitle = product.title?.trim() || `Product ${product.id}`
          const productHandle = product.handle || product.id
          const productUrl = `${storefrontBaseUrl}/us/products/${productHandle}`
          const categoryIDs = (product.categories || []).map((category) => category.id)
          const variants = product.variants || []

          const defaultCurrency =
            variants
              .flatMap((variant) => variant.prices || [])
              .find((price) => typeof price.currency_code === "string")
              ?.currency_code
              ?.toUpperCase() || "USD"

          const mapVariantStatus = (variant: ProductVariantRecord): OmnisendProductStatus => {
            if (variant.manage_inventory === false) {
              return "inStock"
            }
            if (variant.allow_backorder) {
              return "inStock"
            }
            if ((variant.inventory_quantity || 0) > 0) {
              return "inStock"
            }
            return "outOfStock"
          }

          const omnisendVariants = variants.map((variant) => {
            const variantPrice =
              (variant.prices || []).find((price) => typeof price.amount === "number")

            return {
              variantID: variant.id,
              title: variant.title?.trim() || variant.sku || variant.id,
              sku: variant.sku || undefined,
              status: mapVariantStatus(variant),
              price:
                typeof variantPrice?.amount === "number"
                  ? variantPrice.amount / 100
                  : 0,
              imageUrl: product.thumbnail || undefined,
              productUrl,
            }
          })

          await this.createOrUpdateProduct({
            productID: product.id,
            title: productTitle,
            status: product.status === "published" ? "inStock" : "notAvailable",
            currency: defaultCurrency,
            productUrl,
            imageUrl: product.thumbnail || undefined,
            description: product.description || undefined,
            categoryIDs,
            variants: omnisendVariants,
          })

          result.synced_count += 1
        } catch (error) {
          result.failed_count += 1
          result.errors.push({
            product_id: product.id,
            error: error instanceof Error ? error.message : "Unknown sync error",
          })
          this.logger.error(`Failed OmniSend product sync for ${product.id}`, error)
        }
      }

      skip += products.length
      if (products.length < batchSize) {
        break
      }

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    this.logger.info(
      `OmniSend product sync complete: ${result.synced_count} synced, ${result.failed_count} failed`
    )

    return result
  }

  /**
   * Batch sync all Medusa customers to OmniSend contacts.
   * Uses pagination and inter-batch delay to reduce API throttling risk.
   */
  async syncAllContacts(
    query: QueryService,
    options?: {
      batchSize?: number
      delayMs?: number
      tags?: string[]
    }
  ): Promise<SyncContactsResult> {
    const batchSize = Math.max(1, options?.batchSize ?? 100)
    const delayMs = Math.max(0, options?.delayMs ?? 250)
    const baseTags = options?.tags && options.tags.length > 0
      ? options.tags
      : ["medusa-customer"]

    const result: SyncContactsResult = {
      total_customers: 0,
      eligible_customers: 0,
      synced_count: 0,
      failed_count: 0,
      skipped_no_email: 0,
      errors: [],
    }

    const { data } = await query.graph({
      entity: "customer",
      fields: ["id", "email", "first_name", "last_name"],
    })

    const customers = data as MedusaCustomerRecord[]
    result.total_customers = customers.length

    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize)

      for (const customer of batch) {
        if (!customer.email) {
          result.skipped_no_email += 1
          continue
        }

        result.eligible_customers += 1

        try {
          await this.createOrUpdateContact({
            email: customer.email,
            firstName: customer.first_name || undefined,
            lastName: customer.last_name || undefined,
            tags: baseTags,
            customProperties: {
              medusa_customer_id: customer.id,
            },
          })
          result.synced_count += 1
        } catch (error) {
          result.failed_count += 1
          result.errors.push({
            customer_id: customer.id,
            email: customer.email,
            error: error instanceof Error ? error.message : "Unknown sync error",
          })
          this.logger.error(
            `Failed to sync customer ${customer.id} (${customer.email})`,
            error
          )
        }
      }

      if (delayMs > 0 && i + batchSize < customers.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    this.logger.info(
      `OmniSend contact sync complete: ${result.synced_count} synced, ${result.failed_count} failed, ${result.skipped_no_email} skipped`
    )

    return result
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

  /**
   * List all email templates from OmniSend
   */
  async listTemplates(): Promise<OmnisendTemplate[]> {
    const response = await this.request<OmnisendTemplateListResponse>(
      "GET",
      "/templates"
    )
    return response.templates || []
  }

  /**
   * Get a specific email template from OmniSend
   */
  async getTemplate(templateId: string): Promise<OmnisendTemplate> {
    return this.request<OmnisendTemplate>("GET", `/templates/${templateId}`)
  }
}

export default OmnisendModuleService
