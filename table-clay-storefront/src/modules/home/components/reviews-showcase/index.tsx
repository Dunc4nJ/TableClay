"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import StarRating from "@modules/products/components/reviews-section/star-rating"
import { formatReviewDate } from "@lib/data/review-types"
import type { Review } from "@lib/data/review-types"

interface ReviewsShowcaseProps {
  reviews: Review[]
}

export default function ReviewsShowcase({ reviews }: ReviewsShowcaseProps) {
  const [reduceMotion, setReduceMotion] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)
  const trackRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updatePreference = () => setReduceMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener("change", updatePreference)

    return () => {
      mediaQuery.removeEventListener("change", updatePreference)
    }
  }, [])

  const updateScrollState = useCallback(() => {
    const track = trackRef.current

    if (!track) {
      return
    }

    const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth)
    setCanScrollLeft(track.scrollLeft > 4)
    setCanScrollRight(track.scrollLeft < maxScrollLeft - 4)
    setHasOverflow(track.scrollWidth > track.clientWidth + 4)
  }, [])

  useEffect(() => {
    updateScrollState()
    const track = trackRef.current

    if (!track) {
      return
    }

    const handleScroll = () => updateScrollState()
    track.addEventListener("scroll", handleScroll, { passive: true })

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateScrollState())
        : null

    if (resizeObserver) {
      resizeObserver.observe(track)
    }

    window.addEventListener("resize", updateScrollState)

    return () => {
      track.removeEventListener("scroll", handleScroll)
      resizeObserver?.disconnect()
      window.removeEventListener("resize", updateScrollState)
    }
  }, [reviews.length, updateScrollState])

  const scrollByCard = useCallback(
    (direction: "left" | "right") => {
      const track = trackRef.current

      if (!track) {
        return
      }

      const firstCard = track.querySelector<HTMLElement>("[data-review-card]")
      const gap = Number.parseFloat(getComputedStyle(track).gap || "16")
      const step = firstCard ? firstCard.offsetWidth + gap : track.clientWidth * 0.85
      const left = direction === "right" ? step : -step

      track.scrollBy({
        left,
        behavior: reduceMotion ? "auto" : "smooth",
      })
    },
    [reduceMotion]
  )

  if (reviews.length === 0) {
    return null
  }

  return (
    <section className="bg-cream-100 py-12 sm:py-16">
      <div className="content-container relative">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl sm:text-4xl text-ui-fg-base mb-6">
            What Our Customers Say
          </h2>
        </div>

        {hasOverflow ? (
          <>
            <button
              type="button"
              onClick={() => scrollByCard("left")}
              disabled={!canScrollLeft}
              className="hidden md:flex absolute left-1 top-1/2 z-10 h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream-300 bg-cream-50/95 text-ui-fg-base shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Scroll reviews left"
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              onClick={() => scrollByCard("right")}
              disabled={!canScrollRight}
              className="hidden md:flex absolute right-1 top-1/2 z-10 h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream-300 bg-cream-50/95 text-ui-fg-base shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Scroll reviews right"
            >
              <span aria-hidden="true">→</span>
            </button>
          </>
        ) : null}

        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto pb-4 pl-1 pr-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault()
              scrollByCard("left")
            }
            if (event.key === "ArrowRight") {
              event.preventDefault()
              scrollByCard("right")
            }
          }}
          tabIndex={0}
          role="region"
          aria-label="Customer review carousel"
        >
          {reviews.map((review) => {
            const displayDate = formatReviewDate(review.display_date)
            return (
              <article
                key={review.id}
                data-review-card
                className="snap-start shrink-0 w-[86%] sm:w-[48%] lg:w-[32%] xl:w-[24%] rounded-3xl border border-cream-200 bg-cream-50/85 px-5 py-6 text-left shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <StarRating rating={review.rating} size="sm" />
                  {review.is_verified_buyer ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-700">
                      <span aria-hidden="true">✓</span>
                      Verified
                    </span>
                  ) : null}
                </div>

                <p
                  className="mb-4 text-sm leading-relaxed text-ui-fg-base"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {review.content}
                </p>

                <div className="flex items-center justify-between gap-2 text-xs text-ui-fg-subtle">
                  <span className="font-medium text-ui-fg-base">
                    {review.customer_name}
                  </span>
                  {displayDate ? <span>{displayDate}</span> : null}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
