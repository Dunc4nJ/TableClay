"use client"

import React, { useRef, useEffect, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { notFound } from "next/navigation"
import { Button } from "@medusajs/ui"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductInfo from "@modules/products/templates/product-info"
import ProductActions from "@modules/products/components/product-actions"
import RelatedProducts from "@modules/products/components/related-products"
import TrackViewContent from "@lib/analytics/track-view-content"

// New components
import TrustBadges from "@modules/products/components/trust-badges"
import PaymentIcons from "@modules/products/components/payment-icons"
import BenefitsSection from "@modules/products/components/benefits-section"
import FAQAccordion from "@modules/products/components/faq-accordion"
import ReviewsSection from "@modules/products/components/reviews-section"
import StarRating from "@modules/products/components/reviews-section/star-rating"

// Types
import type { Bundle } from "@lib/data/bundles"
import type { Review, ProductReviewStats } from "@lib/data/reviews"
import { DEFAULT_REVIEW_STATS } from "@lib/data/review-types"
import type { FAQ } from "@lib/data/faqs"
import type { BundlePromoSettings } from "@lib/data/settings"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  bundles?: Bundle[]
  bundleSettings?: BundlePromoSettings
  reviews?: Review[]
  reviewStats?: ProductReviewStats | null
  faqs?: FAQ[]
}

/**
 * ReviewSummaryBadge - Small rating badge for above the fold
 */
const ReviewSummaryBadge = ({
  stats,
  onClick,
}: {
  stats: ProductReviewStats
  onClick?: () => void
}) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 text-sm text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
    >
      <span className="font-semibold text-amber-500">
        {stats.average_rating.toFixed(1)}
      </span>
      <StarRating rating={Math.round(stats.average_rating)} size="sm" />
      <span className="underline">
        {stats.total_count.toLocaleString("en-US")} Reviews
      </span>
    </button>
  )
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
  bundles = [],
  bundleSettings,
  reviews = [],
  reviewStats,
  faqs = [],
}) => {
  const initialReviewCount = Math.min(3, reviews.length)
  const reviewsSectionRef = useRef<HTMLDivElement>(null)
  const addToCartRef = useRef<HTMLDivElement>(null)
  const [visibleReviewCount, setVisibleReviewCount] =
    useState(initialReviewCount)

  const scrollToReviews = () => {
    reviewsSectionRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    setVisibleReviewCount(initialReviewCount)
  }, [initialReviewCount, product?.id])

  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <TrackViewContent product={product} region={region} />
      {/* === ABOVE THE FOLD === */}
      <div className="bg-ui-bg-component">
        <div
          className="content-container py-4 lg:py-8"
          data-testid="product-container"
        >
          <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-12">
            {/* Left Column: Image Gallery */}
            <div className="w-full lg:w-1/2 lg:sticky lg:top-24">
              <ImageGallery images={images} />
            </div>

            {/* Right Column: Product Info & Actions */}
            <div className="w-full lg:w-1/2 flex flex-col gap-y-3 lg:gap-y-6 overflow-hidden">
              {/* Review Summary Badge - Always shown with defaults */}
              <div className="order-3 lg:order-none">
                <ReviewSummaryBadge
                  stats={reviewStats ?? DEFAULT_REVIEW_STATS}
                  onClick={scrollToReviews}
                />
              </div>

              {/* Product Title & Subtitle - Compact on mobile */}
              <div className="order-1 lg:order-none">
                <ProductInfo product={product} />
              </div>

              {/* Product Actions (Bundles/Variants + Add to Cart) */}
              <div ref={addToCartRef} className="order-2 lg:order-none">
                <ProductActions
                  product={product}
                  region={region}
                  bundles={bundles}
                  bundleSettings={bundleSettings}
                  stickyTriggerRef={addToCartRef}
                />
              </div>

              {/* Artisan messaging - Elegant badge */}
              <div className="hidden lg:flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cream-100 border border-cream-300 rounded-full">
                  <span className="text-amber-600">✨</span>
                  <span className="text-sm font-medium text-ui-fg-subtle">
                    Handcrafted in small batches
                  </span>
                </div>
              </div>

              {/* Payment Icons */}
              <div className="hidden lg:block">
                <PaymentIcons size="md" />
              </div>

              {/* Trust Badges */}
              <div className="hidden lg:block">
                <TrustBadges layout="vertical" size="md" />
              </div>

              {/* FAQ Accordion - In right column for quick access */}
              {faqs.length > 0 && (
                <div className="hidden lg:block mt-2">
                  <FAQAccordion faqs={faqs} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === BELOW THE FOLD === */}
      <div className="bg-ui-bg-component lg:hidden">
        <div className="content-container py-6 space-y-6">
          {faqs.length > 0 && <FAQAccordion faqs={faqs} />}
          <PaymentIcons size="md" />
          <TrustBadges layout="vertical" size="md" />
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cream-100 border border-cream-300 rounded-full">
              <span className="text-amber-600">✨</span>
              <span className="text-sm font-medium text-ui-fg-subtle">
                Handcrafted in small batches
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section - Cream background */}
      <section className="bg-cream-100">
        <BenefitsSection className="bg-transparent" />
      </section>

      {/* Related Products - Client component with internal loading state */}
      <div data-testid="related-products-container">
        <RelatedProducts product={product} countryCode={countryCode} region={region} />
      </div>

      {/* Reviews Section - Always shown with defaults */}
      {(() => {
        // Use API stats if available, otherwise use defaults
        const displayStats = reviewStats ?? DEFAULT_REVIEW_STATS
        return (
          <div ref={reviewsSectionRef} className="bg-cream-100">
            <div className="content-container py-12 lg:py-16">
              {/* Stats Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-semibold text-ui-fg-base mb-4">
                  Discover the Table Clay Difference
                </h2>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-3xl font-bold text-amber-500">
                    {displayStats.average_rating.toFixed(1)}
                  </span>
                  <StarRating rating={Math.round(displayStats.average_rating)} size="lg" />
                </div>
                <p className="text-ui-fg-subtle text-sm max-w-xl mx-auto">
                  Join over {displayStats.total_count.toLocaleString("en-US")}+ happy customers
                  who have discovered the joy of handcrafted pottery through this product.
                </p>
              </div>

              {/* Review Cards */}
              {reviews.length > 0 ? (
                <div className="max-w-3xl mx-auto">
                  {reviews.slice(0, visibleReviewCount).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                  {reviews.length > visibleReviewCount && (
                    <div className="flex justify-center mt-8">
                      <Button
                        variant="secondary"
                        className="px-6"
                        type="button"
                        onClick={() =>
                          setVisibleReviewCount((count) =>
                            Math.min(count + 3, reviews.length)
                          )
                        }
                      >
                        Load more reviews
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-sm text-ui-fg-muted">
                  Reviews coming soon!
                </p>
              )}
            </div>
          </div>
        )
      })()}

      {/* Sticky Cart Bar */}
      {/* Sticky cart is rendered inside ProductActions to stay in sync */}
    </>
  )
}

/**
 * ReviewCard - Individual review display (inline version)
 */
import Image from "next/image"

const ReviewCard = ({ review }: { review: Review }) => {
  return (
    <article className="bg-ui-bg-component border-b border-ui-border-base py-6">
      {/* Header: Name, Date, Verified Badge */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-ui-fg-base">
              {review.customer_name}
            </span>
            {review.is_verified_buyer && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified Buyer
              </span>
            )}
          </div>
          <StarRating rating={review.rating} size="sm" className="mt-1" />
        </div>
        <span className="text-xs text-ui-fg-muted">
          {formatReviewDate(review.display_date)}
        </span>
      </div>

      {/* Title */}
      {review.title && (
        <p className="font-semibold text-ui-fg-base mb-2">{review.title}</p>
      )}

      {/* Content */}
      <p className="text-ui-fg-subtle text-sm leading-relaxed mb-4">
        {review.content}
      </p>

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {review.images.map((image) => (
            <div
              key={image.id}
              className="relative w-20 h-20 rounded-md overflow-hidden border border-ui-border-base"
            >
              <Image
                src={image.url}
                alt={image.alt_text || `Review image by ${review.customer_name}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ))}
        </div>
      )}

      {/* Helpful Count */}
      {review.helpful_count > 0 && (
        <div className="flex items-center gap-4 text-xs text-ui-fg-muted">
          <span>Was this helpful?</span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            {review.helpful_count}
          </span>
        </div>
      )}
    </article>
  )
}

function formatReviewDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

export default ProductTemplate
