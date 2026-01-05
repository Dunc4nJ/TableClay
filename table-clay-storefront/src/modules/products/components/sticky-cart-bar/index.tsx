"use client"

import { useState, useEffect, RefObject } from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { Button, clx } from "@medusajs/ui"

interface StickyCartBarProps {
  product: HttpTypes.StoreProduct
  price: string
  originalPrice?: string
  onAddToCart: () => void
  isLoading?: boolean
  disabled?: boolean
  triggerRef: RefObject<HTMLElement | null>
  className?: string
}

/**
 * StickyCartBar - Fixed bottom bar that appears when scrolling
 * Shows product thumbnail, name, price, and Add to Cart button
 */
const StickyCartBar = ({
  product,
  price,
  originalPrice,
  onAddToCart,
  isLoading = false,
  disabled = false,
  triggerRef,
  className = "",
}: StickyCartBarProps) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const triggerElement = triggerRef.current
    if (!triggerElement) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show bar when trigger element is NOT visible (user scrolled past it)
        setIsVisible(!entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: "-100px 0px 0px 0px",
      }
    )

    observer.observe(triggerElement)
    return () => observer.disconnect()
  }, [triggerRef])

  const thumbnail = product.thumbnail || product.images?.[0]?.url

  return (
    <div
      className={clx(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-white border-t border-gray-200 shadow-lg",
        "transform transition-transform duration-300 ease-out",
        isVisible ? "translate-y-0" : "translate-y-full",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Product info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {thumbnail && (
              <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                <Image
                  src={thumbnail}
                  alt={product.title || "Product"}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{product.title}</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{price}</span>
                {originalPrice && originalPrice !== price && (
                  <span className="text-xs text-gray-500 line-through">
                    {originalPrice}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Add to Cart */}
          <Button
            onClick={onAddToCart}
            disabled={disabled || isLoading}
            isLoading={isLoading}
            className="flex-shrink-0 h-12 bg-amber-500 hover:bg-amber-600 text-white px-6 border-0"
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}

export default StickyCartBar
