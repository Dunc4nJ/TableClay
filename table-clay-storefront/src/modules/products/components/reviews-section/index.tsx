import { clx } from "@medusajs/ui"
import { getProductReviews } from "@lib/data/reviews"
import ReviewStats from "./review-stats"
import ReviewCard from "./review-card"

interface ReviewsSectionProps {
  productId: string
  title?: string
  className?: string
}

/**
 * ReviewsSection - Full reviews display component
 * Server component that fetches reviews and displays stats + cards
 */
const ReviewsSection = async ({
  productId,
  title,
  className = "",
}: ReviewsSectionProps) => {
  const { reviews, stats } = await getProductReviews(productId)

  // Don't render if no reviews and no stats
  if (reviews.length === 0 && !stats) {
    return null
  }

  return (
    <section className={clx("py-12", className)}>
      <div className="content-container">
        {/* Stats Header */}
        {stats && <ReviewStats stats={stats} title={title} />}

        {/* Reviews List */}
        {reviews.length > 0 && (
          <div className="max-w-3xl mx-auto mt-8">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        {/* Empty State (has stats but no reviews) */}
        {reviews.length === 0 && stats && (
          <div className="text-center py-8">
            <p className="text-ui-fg-muted text-sm">
              Reviews will be displayed here.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default ReviewsSection
