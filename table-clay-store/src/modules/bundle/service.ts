import { MedusaService } from "@medusajs/framework/utils"
import { Bundle, BundleItem } from "./models"

// Type definitions
type PricingType = "fixed" | "percentage"
type BadgeType = "bestseller" | "popular" | "new" | "limited" | "sale" | "none"

export type BundleRecord = {
  id: string
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
  product_id: string
  variant_id: string
  quantity: number
  sort_order: number
  product_title?: string | null
  variant_title?: string | null
  created_at: Date
  updated_at: Date
}

export type BundlePricing = {
  original_price: number
  sale_price: number
  savings: number
  savings_percent: number
}

export type BundleWithItems = BundleRecord & {
  items: BundleItemRecord[]
}

type CreateBundleInput = {
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
    product_id: string
    variant_id: string
    quantity?: number
    sort_order?: number
    product_title?: string
    variant_title?: string
  }>
}

type UpdateBundleInput = Partial<Omit<CreateBundleInput, "items">>

type CreateBundleItemInput = {
  bundle_id: string
  product_id: string
  variant_id: string
  quantity?: number
  sort_order?: number
  product_title?: string
  variant_title?: string
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
   * Items can now include product_id and display titles
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
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity ?? 1,
          sort_order: item.sort_order ?? index,
          product_title: item.product_title ?? null,
          variant_title: item.variant_title ?? null,
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
   * List bundles that contain any of the given product IDs
   * Used by store API to find bundles for a product page
   */
  async listBundlesByProductId(productId: string): Promise<BundleWithItems[]> {
    // Find all bundle items that belong to this product
    const bundleItems = await this.listBundleItems({
      product_id: productId,
    })

    if (bundleItems.length === 0) {
      return []
    }

    // Get unique bundle IDs
    const bundleIds = [...new Set(bundleItems.map((item) => item.bundle_id))]

    // Fetch the bundles
    const bundles = await this.listBundles(
      {
        id: bundleIds,
        is_active: true,
      },
      {
        order: { sort_order: "ASC" },
      }
    )

    // Fetch all items for these bundles
    const allItems = await this.listBundleItems(
      { bundle_id: bundleIds },
      { order: { sort_order: "ASC" } }
    )

    // Combine bundles with their items
    return bundles.map((bundle) => ({
      ...bundle,
      items: allItems.filter((item) => item.bundle_id === bundle.id),
    }))
  }

  /**
   * List bundles that contain any of the given variant IDs
   * Used by store API to find bundles for a specific variant
   */
  async listBundlesByVariantIds(variantIds: string[]): Promise<BundleWithItems[]> {
    if (variantIds.length === 0) {
      return []
    }

    // Find all bundle items that contain any of these variants
    const bundleItems = await this.listBundleItems({
      variant_id: variantIds,
    })

    if (bundleItems.length === 0) {
      return []
    }

    // Get unique bundle IDs
    const bundleIds = [...new Set(bundleItems.map((item) => item.bundle_id))]

    // Fetch the bundles
    const bundles = await this.listBundles(
      {
        id: bundleIds,
        is_active: true,
      },
      {
        order: { sort_order: "ASC" },
      }
    )

    // Fetch all items for these bundles
    const allItems = await this.listBundleItems(
      { bundle_id: bundleIds },
      { order: { sort_order: "ASC" } }
    )

    // Combine bundles with their items
    return bundles.map((bundle) => ({
      ...bundle,
      items: allItems.filter((item) => item.bundle_id === bundle.id),
    }))
  }

  /**
   * List all bundles (for admin)
   */
  async listAllBundles(): Promise<BundleWithItems[]> {
    const bundles = await this.listBundles(
      {},
      { order: { sort_order: "ASC" } }
    )

    if (bundles.length === 0) {
      return []
    }

    const bundleIds = bundles.map((b) => b.id)
    const allItems = await this.listBundleItems(
      { bundle_id: bundleIds },
      { order: { sort_order: "ASC" } }
    )

    return bundles.map((bundle) => ({
      ...bundle,
      items: allItems.filter((item) => item.bundle_id === bundle.id),
    }))
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
    const created = await this.createBundleItems({
      bundle_id: data.bundle_id,
      product_id: data.product_id,
      variant_id: data.variant_id,
      quantity: data.quantity ?? 1,
      sort_order: data.sort_order ?? 0,
      product_title: data.product_title ?? null,
      variant_title: data.variant_title ?? null,
    })
    return Array.isArray(created) ? created[0] : created
  }

  /**
   * Update a bundle item
   */
  async updateBundleItem(
    itemId: string,
    data: {
      quantity?: number
      sort_order?: number
      product_title?: string
      variant_title?: string
    }
  ): Promise<BundleItemRecord> {
    const updated = await this.updateBundleItems({
      selector: { id: itemId },
      data,
    })
    return Array.isArray(updated) ? updated[0] : updated
  }

  /**
   * Replace all items in a bundle
   * Deletes existing items and creates new ones
   */
  async replaceBundleItems(
    bundleId: string,
    items: Array<{
      product_id: string
      variant_id: string
      quantity?: number
      sort_order?: number
      product_title?: string
      variant_title?: string
    }>
  ): Promise<BundleItemRecord[]> {
    // Delete existing items
    const existingItems = await this.listBundleItems({ bundle_id: bundleId })
    if (existingItems.length > 0) {
      await this.deleteBundleItems(existingItems.map((i) => i.id))
    }

    // Create new items
    if (items.length === 0) {
      return []
    }

    const created = await this.createBundleItems(
      items.map((item, index) => ({
        bundle_id: bundleId,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity ?? 1,
        sort_order: item.sort_order ?? index,
        product_title: item.product_title ?? null,
        variant_title: item.variant_title ?? null,
      }))
    )

    return Array.isArray(created) ? created : [created]
  }

  /**
   * Remove an item from a bundle
   */
  async removeBundleItem(itemId: string): Promise<void> {
    await this.deleteBundleItems(itemId)
  }

  /**
   * Hard delete a bundle and its items
   */
  async deleteBundle(bundleId: string): Promise<void> {
    // First delete all bundle items
    const items = await this.listBundleItems({ bundle_id: bundleId })
    if (items.length > 0) {
      await this.deleteBundleItems(items.map((i) => i.id))
    }
    // Then delete the bundle itself
    await this.deleteBundles(bundleId)
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
