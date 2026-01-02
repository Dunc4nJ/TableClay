import { MedusaService } from "@medusajs/framework/utils"
import { Bundle, BundleItem } from "./models"

// Type definitions
type PricingType = "fixed" | "percentage"
type BadgeType = "bestseller" | "popular" | "new" | "limited" | "sale" | "none"

export type BundleRecord = {
  id: string
  product_id: string
  name: string
  description?: string | null
  pricing_type: PricingType
  fixed_original_price?: number | null
  fixed_sale_price?: number | null
  discount_percentage?: number | null
  badge: BadgeType
  is_active: boolean
  sort_order: number
  metadata?: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export type BundleItemRecord = {
  id: string
  bundle_id: string
  variant_id: string
  quantity: number
  sort_order: number
  created_at: Date
  updated_at: Date
}

export type BundlePricing = {
  original_price: number
  sale_price: number
  savings: number
  savings_percent: number
}

type CreateBundleInput = {
  product_id: string
  name: string
  description?: string
  pricing_type?: PricingType
  fixed_original_price?: number
  fixed_sale_price?: number
  discount_percentage?: number
  badge?: BadgeType
  is_active?: boolean
  sort_order?: number
  metadata?: Record<string, unknown>
  items?: Array<{
    variant_id: string
    quantity?: number
    sort_order?: number
  }>
}

type UpdateBundleInput = Partial<Omit<CreateBundleInput, "items">>

type CreateBundleItemInput = {
  bundle_id: string
  variant_id: string
  quantity?: number
  sort_order?: number
}

/**
 * Bundle Module Service
 * Handles bundle CRUD operations and price calculations
 */
class BundleModuleService extends MedusaService({
  Bundle,
  BundleItem,
}) {
  /**
   * Create a new bundle with optional items
   */
  async createBundle(data: CreateBundleInput): Promise<BundleRecord> {
    const { items, ...bundleData } = data

    // Create the bundle
    const created = await this.createBundles(bundleData)
    const bundle = Array.isArray(created) ? created[0] : created

    // Create bundle items if provided
    if (items && items.length > 0) {
      await this.createBundleItems(
        items.map((item, index) => ({
          bundle_id: bundle.id,
          variant_id: item.variant_id,
          quantity: item.quantity ?? 1,
          sort_order: item.sort_order ?? index,
        }))
      )
    }

    return bundle
  }

  /**
   * Update an existing bundle
   */
  async updateBundle(
    bundleId: string,
    data: UpdateBundleInput
  ): Promise<BundleRecord> {
    const updated = await this.updateBundles({
      selector: { id: bundleId },
      data,
    })
    return Array.isArray(updated) ? updated[0] : updated
  }

  /**
   * List bundles for a specific product (store API)
   */
  async listBundlesByProduct(productId: string): Promise<BundleRecord[]> {
    return await this.listBundles(
      {
        product_id: productId,
        is_active: true,
      },
      {
        order: { sort_order: "ASC" },
      }
    )
  }

  /**
   * Get bundle with its items
   */
  async getBundleWithItems(
    bundleId: string
  ): Promise<BundleRecord & { items: BundleItemRecord[] }> {
    const bundle = await this.getBundleById(bundleId)
    const items = await this.listBundleItems(
      { bundle_id: bundleId },
      { order: { sort_order: "ASC" } }
    )
    return { ...bundle, items }
  }

  /**
   * Get a single bundle by ID
   */
  async getBundleById(bundleId: string): Promise<BundleRecord> {
    const bundles = await this.listBundles({ id: bundleId })
    if (!bundles.length) {
      throw new Error(`Bundle with id ${bundleId} not found`)
    }
    return bundles[0]
  }

  /**
   * Calculate bundle prices based on pricing_type
   * For 'fixed' pricing: uses the stored prices
   * For 'percentage' pricing: needs component prices passed in
   */
  calculateBundlePricing(
    bundle: BundleRecord,
    componentTotalCents?: number
  ): BundlePricing {
    if (bundle.pricing_type === "fixed") {
      const originalPrice = Number(bundle.fixed_original_price) || 0
      const salePrice = Number(bundle.fixed_sale_price) || 0
      const savings = originalPrice - salePrice
      const savingsPercent =
        originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0

      return {
        original_price: originalPrice,
        sale_price: salePrice,
        savings,
        savings_percent: savingsPercent,
      }
    }

    // Percentage discount pricing
    const originalPrice = componentTotalCents || 0
    const discountPercent = bundle.discount_percentage || 0
    const salePrice = Math.round(originalPrice * (1 - discountPercent / 100))
    const savings = originalPrice - salePrice

    return {
      original_price: originalPrice,
      sale_price: salePrice,
      savings,
      savings_percent: discountPercent,
    }
  }

  /**
   * Add an item to a bundle
   */
  async addBundleItem(data: CreateBundleItemInput): Promise<BundleItemRecord> {
    const created = await this.createBundleItems(data)
    return Array.isArray(created) ? created[0] : created
  }

  /**
   * Update a bundle item
   */
  async updateBundleItem(
    itemId: string,
    data: { quantity?: number; sort_order?: number }
  ): Promise<BundleItemRecord> {
    const updated = await this.updateBundleItems({
      selector: { id: itemId },
      data,
    })
    return Array.isArray(updated) ? updated[0] : updated
  }

  /**
   * Remove an item from a bundle
   */
  async removeBundleItem(itemId: string): Promise<void> {
    await this.deleteBundleItems(itemId)
  }

  /**
   * Soft delete a bundle
   */
  async deleteBundle(bundleId: string): Promise<void> {
    await this.updateBundles({
      selector: { id: bundleId },
      data: { is_active: false },
    })
  }

  /**
   * Get items for a bundle
   */
  async getItemsForBundle(bundleId: string): Promise<BundleItemRecord[]> {
    return await this.listBundleItems(
      { bundle_id: bundleId },
      { order: { sort_order: "ASC" } }
    )
  }

  /**
   * Get badge display text
   */
  getBadgeDisplayText(badge: BadgeType): string | null {
    const badgeLabels: Record<BadgeType, string | null> = {
      bestseller: "Bestseller Bundle",
      popular: "Popular Choice",
      new: "New Bundle",
      limited: "Limited Edition",
      sale: "Sale",
      none: null,
    }
    return badgeLabels[badge]
  }
}

export default BundleModuleService
