"use client"

import { Text, clx } from "@medusajs/ui"
import type { ProductReviewStats } from "@lib/data/reviews"
import StarRating from "./star-rating"

interface ReviewStatsProps {
  stats: ProductReviewStats
  title?: string
  subtitle?: string
  className?: string
}

/**
 * ReviewStats - Stats header for reviews section
 * Shows title, large rating with stars, and subtitle with count
 */
const ReviewStats = ({
  stats,
  title = "Discover the Table Clay Difference",
  subtitle,
  className = "",
}: ReviewStatsProps) => {
  const defaultSubtitle = `Join over ${stats.total_count.toLocaleString("en-US")}+ happy creators and families who have discovered the joy of creating together with the Table Clay Pottery Wheel.`

  return (
    <div className={clx("text-center py-8", className)}>
      <Text className="text-2xl font-semibold text-ui-fg-base mb-4">
        {title}
      </Text>

      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-3xl font-bold text-amber-500">
          {stats.average_rating.toFixed(1)}
        </span>
        <StarRating rating={Math.round(stats.average_rating)} size="lg" />
      </div>

      <Text className="text-ui-fg-subtle text-sm max-w-xl mx-auto">
        {subtitle || defaultSubtitle}
      </Text>
    </div>
  )
}

export default ReviewStats
