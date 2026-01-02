import { MedusaService } from "@medusajs/framework/utils"
import { Review, ReviewImage, ProductReviewStats, FAQ } from "./models"

// Type definitions for better type safety
type ReviewRecord = {
  id: string
  product_id: string
  customer_name: string
  is_verified_buyer: boolean
  rating: number
  title: string | null
  content: string
  display_date: Date
  helpful_count: number
  is_active: boolean
  sort_order: number
  metadata: Record<string, unknown> | null
  images?: ReviewImageRecord[]
  created_at: Date
  updated_at: Date
}

type ReviewImageRecord = {
  id: string
  review_id: string
  url: string
  alt_text: string | null
  sort_order: number
}

type ProductReviewStatsRecord = {
  id: string
  product_id: string
  average_rating: number
  total_count: number
  rating_5_count: number
  rating_4_count: number
  rating_3_count: number
  rating_2_count: number
  rating_1_count: number
}

type FAQRecord = {
  id: string
  product_id: string | null
  question: string
  answer: string
  is_active: boolean
  sort_order: number
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

type CreateReviewInput = {
  product_id: string
  customer_name: string
  is_verified_buyer?: boolean
  rating: number
  title?: string
  content: string
  display_date: Date
  helpful_count?: number
  is_active?: boolean
  sort_order?: number
  metadata?: Record<string, unknown>
}

type CreateFAQInput = {
  product_id?: string | null
  question: string
  answer: string
  is_active?: boolean
  sort_order?: number
  metadata?: Record<string, unknown>
}

/**
 * Content Module Service
 * Handles admin-curated content: Reviews and FAQs
 */
class ContentModuleService extends MedusaService({
  Review,
  ReviewImage,
  ProductReviewStats,
  Faq: FAQ,  // Use 'Faq' key to generate correct method names (listFaqs not listFAQS)
}) {
  // ===== REVIEWS =====

  /**
   * Get reviews for a product (store API)
   * Returns active reviews sorted by sort_order with images
   */
  async getProductReviews(productId: string): Promise<{
    reviews: ReviewRecord[]
    stats: ProductReviewStatsRecord | null
  }> {
    // Get active reviews with images
    const reviews = await this.listReviews(
      { product_id: productId, is_active: true },
      {
        order: { sort_order: "ASC" },
      }
    )

    // Fetch images for each review
    const reviewsWithImages = await Promise.all(
      reviews.map(async (review) => {
        const images = await this.listReviewImages(
          { review_id: review.id },
          { order: { sort_order: "ASC" } }
        )
        return { ...review, images }
      })
    )

    // Get stats (may not exist)
    let stats: ProductReviewStatsRecord | null = null
    try {
      const statsList = await this.listProductReviewStats({
        product_id: productId,
      })
      stats = statsList.length > 0 ? statsList[0] : null
    } catch {
      // Stats don't exist yet
    }

    return { reviews: reviewsWithImages, stats }
  }

  /**
   * Admin: Create a review with images
   */
  async createReviewWithImages(
    data: CreateReviewInput,
    imageUrls: string[]
  ): Promise<ReviewRecord> {
    const review = await this.createReviews(data)

    // Create images
    for (let i = 0; i < imageUrls.length; i++) {
      await this.createReviewImages({
        review_id: review.id,
        url: imageUrls[i],
        sort_order: i,
      })
    }

    // Return review with images
    const images = await this.listReviewImages(
      { review_id: review.id },
      { order: { sort_order: "ASC" } }
    )

    return { ...review, images }
  }

  /**
   * Admin: Replace all review images
   */
  async replaceReviewImages(
    reviewId: string,
    imageUrls: string[]
  ): Promise<ReviewImageRecord[]> {
    // Delete existing images
    const existing = await this.listReviewImages({ review_id: reviewId })
    for (const img of existing) {
      await this.deleteReviewImages(img.id)
    }

    // Create new images
    for (let i = 0; i < imageUrls.length; i++) {
      await this.createReviewImages({
        review_id: reviewId,
        url: imageUrls[i],
        sort_order: i,
      })
    }

    return this.listReviewImages(
      { review_id: reviewId },
      { order: { sort_order: "ASC" } }
    )
  }

  /**
   * Admin: Upsert product stats
   */
  async upsertProductStats(
    productId: string,
    stats: Partial<Omit<ProductReviewStatsRecord, "id" | "product_id">>
  ): Promise<ProductReviewStatsRecord> {
    const existing = await this.listProductReviewStats({
      product_id: productId,
    })

    if (existing.length > 0) {
      const updated = await this.updateProductReviewStats({
        selector: { id: existing[0].id },
        data: stats,
      })
      return Array.isArray(updated) ? updated[0] : updated
    }

    return this.createProductReviewStats({
      product_id: productId,
      average_rating: stats.average_rating ?? 0,
      total_count: stats.total_count ?? 0,
      rating_5_count: stats.rating_5_count ?? 0,
      rating_4_count: stats.rating_4_count ?? 0,
      rating_3_count: stats.rating_3_count ?? 0,
      rating_2_count: stats.rating_2_count ?? 0,
      rating_1_count: stats.rating_1_count ?? 0,
    })
  }

  /**
   * Admin: List all reviews with optional filters
   */
  async listAllReviews(filters?: {
    product_id?: string
    is_active?: boolean
    rating?: number
  }): Promise<ReviewRecord[]> {
    const reviews = await this.listReviews(filters || {}, {
      order: { sort_order: "ASC" },
    })

    // Fetch images for each review
    const reviewsWithImages = await Promise.all(
      reviews.map(async (review) => {
        const images = await this.listReviewImages(
          { review_id: review.id },
          { order: { sort_order: "ASC" } }
        )
        return { ...review, images }
      })
    )

    return reviewsWithImages
  }

  // ===== FAQ =====

  /**
   * Get FAQs for a product (store API)
   * Returns global FAQs first, then product-specific FAQs
   */
  async getProductFAQs(productId: string): Promise<FAQRecord[]> {
    const [globalFaqs, productFaqs] = await Promise.all([
      this.listFaqs({ product_id: null, is_active: true }, { order: { sort_order: "ASC" } }),
      this.listFaqs({ product_id: productId, is_active: true }, { order: { sort_order: "ASC" } }),
    ])

    // Global FAQs first, then product-specific
    return [...globalFaqs, ...productFaqs]
  }

  /**
   * Get global FAQs only (for pages without a specific product)
   */
  async listGlobalFAQs(): Promise<FAQRecord[]> {
    return this.listFaqs(
      { product_id: null, is_active: true },
      { order: { sort_order: "ASC" } }
    )
  }

  /**
   * Admin: List all FAQs with optional filtering
   */
  async listAllFAQs(filters?: {
    product_id?: string | null
    is_active?: boolean
  }): Promise<FAQRecord[]> {
    return this.listFaqs(filters || {}, { order: { sort_order: "ASC" } })
  }

  /**
   * Admin: Create FAQ
   */
  async createFAQ(data: CreateFAQInput): Promise<FAQRecord> {
    return this.createFaqs(data)
  }

  /**
   * Admin: Get FAQ stats
   */
  async getFAQStats(): Promise<{
    total: number
    global: number
    product_specific: number
    active: number
    inactive: number
  }> {
    const all = await this.listFaqs({})
    const global = all.filter((f) => f.product_id === null)
    const productSpecific = all.filter((f) => f.product_id !== null)
    const active = all.filter((f) => f.is_active)
    const inactive = all.filter((f) => !f.is_active)

    return {
      total: all.length,
      global: global.length,
      product_specific: productSpecific.length,
      active: active.length,
      inactive: inactive.length,
    }
  }
}

export default ContentModuleService
