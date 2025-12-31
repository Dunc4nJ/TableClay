import { MedusaService } from "@medusajs/framework/utils"
import { Subscriber } from "./models"

type SubscriberData = {
  email: string
  first_name?: string
  source?: "popup" | "footer" | "checkout" | "admin"
}

type SubscriberRecord = {
  id: string
  email: string
  first_name?: string | null
  is_active: boolean
  subscribed_at: Date
  unsubscribed_at?: Date | null
  source: string
  discount_code?: string | null
  discount_code_sent: boolean
  discount_code_used: boolean
  discount_code_used_at?: Date | null
  tags: Record<string, unknown>
  metadata?: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

type SubscriberStats = {
  total_subscribers: number
  active_subscribers: number
  unsubscribed: number
  discount_codes_used: number
  conversion_rate: number
  subscribers_by_source: Record<string, number>
  recent_signups: number
}

/**
 * Newsletter Module Service
 * Handles newsletter subscriber management with discount code generation
 */
class NewsletterModuleService extends MedusaService({
  Subscriber,
}) {
  /**
   * Subscribe an email to the newsletter
   * Generates a unique discount code for free shipping
   */
  async subscribe(data: SubscriberData): Promise<SubscriberRecord> {
    const { email, first_name, source = "popup" } = data

    // Check if already subscribed
    const existing = await this.listSubscribers({
      email,
    })

    if (existing.length > 0) {
      const subscriber = existing[0]

      // If previously unsubscribed, reactivate
      if (!subscriber.is_active) {
        const updated = await this.updateSubscribers({
          selector: { id: subscriber.id },
          data: {
            is_active: true,
            unsubscribed_at: null,
            subscribed_at: new Date(),
            source,
          },
        })
        return updated[0]
      }

      // Already active subscriber
      return subscriber
    }

    // Generate unique discount code
    const discountCode = this.generateDiscountCode()

    // Create new subscriber
    const created = await this.createSubscribers({
      email,
      first_name,
      source,
      is_active: true,
      subscribed_at: new Date(),
      discount_code: discountCode,
      discount_code_sent: false,
      discount_code_used: false,
      tags: {},
    })

    return created[0]
  }

  /**
   * Unsubscribe an email from the newsletter
   */
  async unsubscribe(email: string): Promise<SubscriberRecord> {
    const subscribers = await this.listSubscribers({ email })

    if (!subscribers.length) {
      throw new Error(`Subscriber with email ${email} not found`)
    }

    const updated = await this.updateSubscribers({
      selector: { id: subscribers[0].id },
      data: {
        is_active: false,
        unsubscribed_at: new Date(),
      },
    })

    return updated[0]
  }

  /**
   * Mark discount code as sent (after welcome email)
   */
  async markDiscountCodeSent(subscriberId: string): Promise<void> {
    await this.updateSubscribers({
      selector: { id: subscriberId },
      data: {
        discount_code_sent: true,
      },
    })
  }

  /**
   * Mark discount code as used (when applied at checkout)
   */
  async markDiscountCodeUsed(discountCode: string): Promise<void> {
    const subscribers = await this.listSubscribers({
      discount_code: discountCode,
    })

    if (subscribers.length > 0) {
      await this.updateSubscribers({
        selector: { id: subscribers[0].id },
        data: {
          discount_code_used: true,
          discount_code_used_at: new Date(),
        },
      })
    }
  }

  /**
   * Get subscriber by email
   */
  async getByEmail(email: string): Promise<SubscriberRecord | null> {
    const subscribers = await this.listSubscribers({ email })
    return subscribers.length > 0 ? subscribers[0] : null
  }

  /**
   * Get subscriber by discount code
   */
  async getByDiscountCode(code: string): Promise<SubscriberRecord | null> {
    const subscribers = await this.listSubscribers({
      discount_code: code,
    })
    return subscribers.length > 0 ? subscribers[0] : null
  }

  /**
   * Get active subscribers (for export, email campaigns, etc.)
   */
  async getActiveSubscribers(options?: {
    limit?: number
    offset?: number
    source?: string
  }): Promise<SubscriberRecord[]> {
    const { limit = 100, offset = 0, source } = options || {}

    const filters: Record<string, unknown> = { is_active: true }
    if (source) {
      filters.source = source
    }

    return await this.listSubscribers(filters, {
      take: limit,
      skip: offset,
      order: { subscribed_at: "DESC" },
    })
  }

  /**
   * Get subscriber statistics for admin dashboard
   */
  async getStats(): Promise<SubscriberStats> {
    const allSubscribers = await this.listSubscribers({})

    const activeSubscribers = allSubscribers.filter((s) => s.is_active)
    const unsubscribed = allSubscribers.filter((s) => !s.is_active)
    const usedCodes = allSubscribers.filter((s) => s.discount_code_used)

    // Count by source
    const subscribersBySource: Record<string, number> = {}
    for (const sub of activeSubscribers) {
      const source = sub.source || "unknown"
      subscribersBySource[source] = (subscribersBySource[source] || 0) + 1
    }

    // Recent signups (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentSignups = activeSubscribers.filter(
      (s) => new Date(s.subscribed_at) > sevenDaysAgo
    ).length

    // Conversion rate (used codes / sent codes)
    const sentCodes = allSubscribers.filter((s) => s.discount_code_sent).length
    const conversionRate = sentCodes > 0 ? (usedCodes.length / sentCodes) * 100 : 0

    return {
      total_subscribers: allSubscribers.length,
      active_subscribers: activeSubscribers.length,
      unsubscribed: unsubscribed.length,
      discount_codes_used: usedCodes.length,
      conversion_rate: Math.round(conversionRate * 10) / 10,
      subscribers_by_source: subscribersBySource,
      recent_signups: recentSignups,
    }
  }

  /**
   * Export subscribers as CSV-ready data
   */
  async exportSubscribers(options?: {
    activeOnly?: boolean
    source?: string
  }): Promise<Array<Record<string, unknown>>> {
    const { activeOnly = true, source } = options || {}

    const filters: Record<string, unknown> = {}
    if (activeOnly) {
      filters.is_active = true
    }
    if (source) {
      filters.source = source
    }

    const subscribers = await this.listSubscribers(filters, {
      order: { subscribed_at: "DESC" },
    })

    return subscribers.map((s) => ({
      email: s.email,
      first_name: s.first_name || "",
      source: s.source,
      subscribed_at: s.subscribed_at,
      discount_code: s.discount_code,
      discount_code_used: s.discount_code_used ? "Yes" : "No",
      is_active: s.is_active ? "Active" : "Unsubscribed",
    }))
  }

  /**
   * Add tag to subscriber for segmentation
   */
  async addTag(email: string, tag: string): Promise<void> {
    const subscriber = await this.getByEmail(email)
    if (!subscriber) {
      throw new Error(`Subscriber with email ${email} not found`)
    }

    const tags = (subscriber.tags || {}) as Record<string, boolean>
    if (!tags[tag]) {
      tags[tag] = true
      await this.updateSubscribers({
        selector: { id: subscriber.id },
        data: { tags },
      })
    }
  }

  /**
   * Generate a unique discount code
   * Format: FREESHIP-XXXX (e.g., FREESHIP-A7K9)
   */
  private generateDiscountCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed confusing chars (0,O,1,I)
    let code = ""
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `FREESHIP-${code}`
  }
}

export default NewsletterModuleService
