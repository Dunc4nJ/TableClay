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

  const hasReviews = reviews.length > 0
  const hasStats = !!stats

  return (
    <section className={clx("py-12", className)}>
      <div className="content-container">
        {/* Stats Header */}
        {hasStats && <ReviewStats stats={stats} title={title} />}

        {/* Reviews List */}
        {hasReviews && (
          <div className="max-w-3xl mx-auto mt-8">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!hasReviews && hasStats && (
          <div className="text-center py-8">
            <p className="text-ui-fg-muted text-sm">
              Reviews will be displayed here.
            </p>
          </div>
        )}

        {/* Write a Review CTA */}
        <div className="text-center mt-8">
          <a
            href="https://forms.gle/TQVvphoZkY5ti1Hf9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-amber-600 bg-transparent px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-600 transition hover:bg-amber-50"
          >
            Write a Review
          </a>
        </div>
      </div>
    </section>
  )
}

export default ReviewsSection
