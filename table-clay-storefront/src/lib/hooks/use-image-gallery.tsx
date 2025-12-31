import { useState, useCallback, useRef, useEffect, useMemo } from "react"

interface ImageItem {
  id: string
  url: string
}

interface UseImageGalleryOptions {
  images: ImageItem[]
  initialIndex?: number
  enableKeyboard?: boolean
  enableSwipe?: boolean
  onIndexChange?: (index: number) => void
}

interface UseImageGalleryReturn {
  // State
  currentIndex: number
  currentImage: ImageItem | null
  totalImages: number

  // Navigation
  goToIndex: (index: number) => void
  goToNext: () => void
  goToPrevious: () => void

  // Helpers
  isFirst: boolean
  isLast: boolean

  // Event handlers
  containerRef: React.RefObject<HTMLDivElement | null>
  swipeHandlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
  }
}

const SWIPE_THRESHOLD = 50 // Minimum pixels to trigger swipe

/**
 * Custom hook for managing image gallery state with keyboard and swipe navigation
 *
 * @example
 * ```tsx
 * const {
 *   currentIndex,
 *   currentImage,
 *   goToNext,
 *   goToPrevious,
 *   goToIndex,
 *   isFirst,
 *   isLast,
 *   containerRef,
 *   swipeHandlers,
 * } = useImageGallery({
 *   images: productImages,
 *   enableKeyboard: true,
 *   enableSwipe: true,
 * })
 * ```
 */
const useImageGallery = ({
  images,
  initialIndex = 0,
  enableKeyboard = true,
  enableSwipe = true,
  onIndexChange,
}: UseImageGalleryOptions): UseImageGalleryReturn => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  // Handle empty or invalid images array
  const safeImages = useMemo(() => images || [], [images])
  const totalImages = safeImages.length

  // Safely set index within bounds
  const safeSetIndex = useCallback(
    (index: number) => {
      if (totalImages === 0) return

      const bounded = Math.max(0, Math.min(index, totalImages - 1))
      setCurrentIndex(bounded)
      onIndexChange?.(bounded)
    },
    [totalImages, onIndexChange]
  )

  // Navigation functions
  const goToNext = useCallback(() => {
    if (currentIndex < totalImages - 1) {
      safeSetIndex(currentIndex + 1)
    }
  }, [currentIndex, totalImages, safeSetIndex])

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      safeSetIndex(currentIndex - 1)
    }
  }, [currentIndex, safeSetIndex])

  const goToIndex = useCallback(
    (index: number) => {
      safeSetIndex(index)
    },
    [safeSetIndex]
  )

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboard || totalImages <= 1) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if gallery container or its children are focused
      if (!containerRef.current?.contains(document.activeElement)) return

      if (e.key === "ArrowRight") {
        e.preventDefault()
        goToNext()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        goToPrevious()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [enableKeyboard, totalImages, goToNext, goToPrevious])

  // Touch/swipe handlers
  const swipeHandlers = useMemo(() => {
    if (!enableSwipe) {
      return {
        onTouchStart: () => {},
        onTouchEnd: () => {},
      }
    }

    return {
      onTouchStart: (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
      },
      onTouchEnd: (e: React.TouchEvent) => {
        if (touchStartX.current === null) return

        const touchEndX = e.changedTouches[0].clientX
        const diff = touchStartX.current - touchEndX

        if (Math.abs(diff) > SWIPE_THRESHOLD) {
          if (diff > 0) {
            goToNext() // Swipe left = next image
          } else {
            goToPrevious() // Swipe right = previous image
          }
        }

        touchStartX.current = null
      },
    }
  }, [enableSwipe, goToNext, goToPrevious])

  // Computed values
  const currentImage = totalImages > 0 ? safeImages[currentIndex] : null
  const isFirst = currentIndex === 0
  const isLast = currentIndex === totalImages - 1 || totalImages === 0

  // Handle case when images array changes (e.g., variant selection)
  useEffect(() => {
    if (currentIndex >= totalImages && totalImages > 0) {
      setCurrentIndex(0)
    }
  }, [totalImages, currentIndex])

  return {
    currentIndex,
    currentImage,
    totalImages,
    goToIndex,
    goToNext,
    goToPrevious,
    isFirst,
    isLast,
    containerRef,
    swipeHandlers,
  }
}

export default useImageGallery
