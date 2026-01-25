import { MedusaService } from "@medusajs/framework/utils"
import { ProductSales } from "./models"

type ProductSalesRecord = {
  id: string
  product_id: string
  sales_count: number
  last_sold_at?: Date | null
  metadata?: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

type IncrementSalesInput = {
  product_id: string
  quantity: number
}

/**
 * Sales Tracking Module Service
 * Handles product sales count tracking for bestseller functionality
 */
class SalesTrackingModuleService extends MedusaService({
  ProductSales,
}) {
  /**
   * Increment sales count for a product
   * Creates record if doesn't exist, updates if it does
   */
  async incrementSales(input: IncrementSalesInput): Promise<ProductSalesRecord> {
    const { product_id, quantity } = input

    // Validate input to prevent NaN propagation
    if (!product_id || typeof product_id !== "string" || product_id.trim() === "") {
      throw new Error(`[SalesTracking] Invalid product_id: ${JSON.stringify(product_id)}`)
    }
    if (typeof quantity !== "number" || isNaN(quantity) || quantity <= 0) {
      throw new Error(`[SalesTracking] Invalid quantity: ${JSON.stringify(quantity)}`)
    }

    // Try to find existing record
    const existing = await this.listProductSales({
      product_id,
    })

    if (existing.length > 0) {
      // Update existing record
      const record = existing[0]

      // Validate existing sales_count to prevent NaN propagation
      const currentCount = typeof record.sales_count === "number" && !isNaN(record.sales_count)
        ? record.sales_count
        : 0

      const updated = await this.updateProductSales({
        selector: { id: record.id },
        data: {
          sales_count: currentCount + quantity,
          last_sold_at: new Date(),
        },
      })
      return Array.isArray(updated) ? updated[0] : updated
    }

    // Create new record
    const created = await this.createProductSales({
      product_id,
      sales_count: quantity,
      last_sold_at: new Date(),
    })

    return Array.isArray(created) ? created[0] : created
  }

  /**
   * Increment sales for multiple products at once (from an order)
   */
  async incrementSalesBulk(items: IncrementSalesInput[]): Promise<void> {
    for (const item of items) {
      await this.incrementSales(item)
    }
  }

  /**
   * Get sales count for a specific product
   */
  async getSalesCount(productId: string): Promise<number> {
    const records = await this.listProductSales({
      product_id: productId,
    })

    return records.length > 0 ? records[0].sales_count : 0
  }

  /**
   * Get the bestselling product ID
   * Returns null if no sales exist
   */
  async getBestsellerProductId(): Promise<string | null> {
    const records = await this.listProductSales(
      {},
      {
        order: { sales_count: "DESC" },
        take: 1,
      }
    )

    return records.length > 0 ? records[0].product_id : null
  }

  /**
   * Get top selling products
   */
  async getTopSellers(limit: number = 10): Promise<ProductSalesRecord[]> {
    return await this.listProductSales(
      {},
      {
        order: { sales_count: "DESC" },
        take: limit,
      }
    )
  }

  /**
   * Update sales count manually (for admin corrections/promotions)
   */
  async setSalesCount(productId: string, count: number): Promise<ProductSalesRecord> {
    const existing = await this.listProductSales({
      product_id: productId,
    })

    if (existing.length > 0) {
      const updated = await this.updateProductSales({
        selector: { id: existing[0].id },
        data: {
          sales_count: count,
        },
      })
      return Array.isArray(updated) ? updated[0] : updated
    }

    // Create new record with specified count
    const created = await this.createProductSales({
      product_id: productId,
      sales_count: count,
    })

    return Array.isArray(created) ? created[0] : created
  }

  /**
   * Get all product sales records with their counts
   * Useful for admin dashboard
   */
  async getAllSalesStats(): Promise<ProductSalesRecord[]> {
    return await this.listProductSales(
      {},
      {
        order: { sales_count: "DESC" },
      }
    )
  }

  /**
   * Initialize sales tracking for a product (with 0 count)
   * Called when new products are created
   */
  async initializeProduct(productId: string): Promise<ProductSalesRecord> {
    const existing = await this.listProductSales({
      product_id: productId,
    })

    if (existing.length > 0) {
      return existing[0]
    }

    const created = await this.createProductSales({
      product_id: productId,
      sales_count: 0,
    })

    return Array.isArray(created) ? created[0] : created
  }

  /**
   * Delete sales record for a product
   * Called when product is deleted
   */
  async deleteProductSalesRecord(productId: string): Promise<void> {
    const records = await this.listProductSales({
      product_id: productId,
    })

    if (records.length > 0) {
      await this.deleteProductSales([records[0].id])
    }
  }
}

export default SalesTrackingModuleService
