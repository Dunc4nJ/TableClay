"use client"

import { clx } from "@medusajs/ui"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  showEmpty?: boolean
  className?: string
}

/**
 * StarRating - Display-only star rating component
 * Shows filled/empty stars based on rating value
 */
const StarRating = ({
  rating,
  maxRating = 5,
  size = "md",
  showEmpty = true,
  className = "",
}: StarRatingProps) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }

  const stars = []
  for (let i = 1; i <= maxRating; i++) {
    const isFilled = i <= rating
    stars.push(
      <svg
        key={i}
        className={clx(
          sizeClasses[size],
          isFilled ? "text-amber-400" : showEmpty ? "text-gray-200" : "hidden"
        )}
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
          clipRule="evenodd"
        />
      </svg>
    )
  }

  return (
    <div className={clx("flex items-center gap-0.5", className)} role="img" aria-label={`${rating} out of ${maxRating} stars`}>
      {stars}
    </div>
  )
}

export default StarRating
