"use client"

import { Transition } from "@headlessui/react"
import { useCallback, useEffect, useRef, useState } from "react"
import StarRating from "@modules/products/components/reviews-section/star-rating"
import { formatReviewDate } from "@lib/data/review-types"
import type { Review } from "@lib/data/review-types"

const ROTATE_INTERVAL_MS = 4000
const TRANSITION_MS = 300

interface ReviewsShowcaseProps {
  reviews: Review[]
}

export default function ReviewsShowcase({ reviews }: ReviewsShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updatePreference = () => setReduceMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener("change", updatePreference)

    return () => {
      mediaQuery.removeEventListener("change", updatePreference)
    }
  }, [])

  useEffect(() => {
    if (currentIndex >= reviews.length && reviews.length > 0) {
      setCurrentIndex(0)
    }
  }, [currentIndex, reviews.length])

  const advanceReview = useCallback(() => {
    if (reviews.length <= 1) {
      return
    }

    setIsVisible(false)

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }

    transitionTimeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length)
      setIsVisible(true)
    }, TRANSITION_MS)
  }, [reviews.length])

  useEffect(() => {
    if (reduceMotion || isPaused || reviews.length <= 1) {
      return
    }

    const interval = setInterval(advanceReview, ROTATE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [advanceReview, isPaused, reduceMotion, reviews.length])

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  if (reviews.length === 0) {
    return null
  }

  const currentReview = reviews[currentIndex]
  const displayDate = formatReviewDate(currentReview.display_date)
  const enterClass = reduceMotion ? "" : "transition duration-500 ease-out"
  const enterFromClass = reduceMotion ? "" : "opacity-0 translate-y-2"
  const enterToClass = reduceMotion ? "" : "opacity-100 translate-y-0"
  const leaveClass = reduceMotion ? "" : "transition duration-300 ease-in"
  const leaveFromClass = reduceMotion ? "" : "opacity-100 translate-y-0"
  const leaveToClass = reduceMotion ? "" : "opacity-0 -translate-y-2"

  return (
    <section className="bg-cream-100 py-12 sm:py-16">
      <div className="content-container">
        <div className="text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-ui-fg-base mb-6">
            What Our Customers Say
          </h2>

          <div className="mx-auto max-w-2xl">
            <div
              className="rounded-3xl border border-cream-200 bg-cream-50/80 px-6 sm:px-10 py-8 shadow-sm"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
            >
              <Transition
                appear
                show={isVisible}
                enter={enterClass}
                enterFrom={enterFromClass}
                enterTo={enterToClass}
                leave={leaveClass}
                leaveFrom={leaveFromClass}
                leaveTo={leaveToClass}
              >
                <div className="flex flex-col items-center gap-4" aria-live="polite">
                  <span
                    className="text-5xl sm:text-6xl text-cream-300 leading-none"
                    aria-hidden="true"
                  >
                    “
                  </span>

                  <StarRating rating={currentReview.rating} size="md" />

                  <p className="text-lg sm:text-xl text-ui-fg-base leading-relaxed">
                    {currentReview.content}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-ui-fg-subtle">
                    <span className="font-medium text-ui-fg-base">
                      {currentReview.customer_name}
                    </span>

                    {currentReview.is_verified_buyer && (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <span aria-hidden="true">✓</span>
                        Verified Purchase
                      </span>
                    )}

                    {displayDate ? (
                      <span>• {displayDate}</span>
                    ) : null}
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
