"use client"

import { Text, clx } from "@medusajs/ui"
import Image from "next/image"
import type { Review } from "@lib/data/review-types"
import { formatReviewDate } from "@lib/data/review-types"
import StarRating from "./star-rating"

interface ReviewCardProps {
  review: Review
  className?: string
}

/**
 * ReviewCard - Individual review display
 * Shows customer name, date, rating, title, content, images, and helpful count
 */
const ReviewCard = ({ review, className = "" }: ReviewCardProps) => {
  return (
    <article
      className={clx(
        "bg-ui-bg-component border-b border-ui-border-base py-6",
        className
      )}
    >
      {/* Header: Name, Date, Verified Badge */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Text className="font-medium text-ui-fg-base">
              {review.customer_name}
            </Text>
            {review.is_verified_buyer && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
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
        <Text className="text-xs text-ui-fg-muted">
          {formatReviewDate(review.display_date)}
        </Text>
      </div>

      {/* Title */}
      {review.title && (
        <Text className="font-semibold text-ui-fg-base mb-2">
          {review.title}
        </Text>
      )}

      {/* Content */}
      <Text className="text-ui-fg-subtle text-sm leading-relaxed mb-4">
        {review.content}
      </Text>

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
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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

export default ReviewCard
