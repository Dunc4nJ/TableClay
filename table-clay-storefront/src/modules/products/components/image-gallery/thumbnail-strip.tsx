import { useRef, useState, useEffect } from "react"
import Image from "next/image"
import { clx } from "@medusajs/ui"
import ChevronLeft from "@modules/common/icons/chevron-left"
import ChevronRight from "@modules/common/icons/chevron-right"

interface ThumbnailStripProps {
  images: { id: string; url: string }[]
  currentIndex: number
  onSelect: (index: number) => void
}

const THUMBNAIL_SIZE = 80
const THUMBNAIL_GAP = 12
const SCROLL_AMOUNT = 3 // Number of thumbnails to scroll per click

const ThumbnailStrip = ({
  images,
  currentIndex,
  onSelect,
}: ThumbnailStripProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Check scroll position to show/hide arrows
  const updateScrollButtons = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    )
  }

  // Initialize and update scroll state
  useEffect(() => {
    updateScrollButtons()
    const container = scrollContainerRef.current
    container?.addEventListener("scroll", updateScrollButtons)
    window.addEventListener("resize", updateScrollButtons)

    return () => {
      container?.removeEventListener("scroll", updateScrollButtons)
      window.removeEventListener("resize", updateScrollButtons)
    }
  }, [images.length])

  // Scroll to selected thumbnail when it changes (from keyboard/swipe)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const thumbnails = container.children
    const thumbnail = thumbnails[currentIndex] as HTMLElement
    if (thumbnail) {
      thumbnail.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      })
    }
  }, [currentIndex])

  const scrollLeft = () => {
    const container = scrollContainerRef.current
    if (!container) return

    container.scrollBy({
      left: -(THUMBNAIL_SIZE + THUMBNAIL_GAP) * SCROLL_AMOUNT,
      behavior: "smooth",
    })
  }

  const scrollRight = () => {
    const container = scrollContainerRef.current
    if (!container) return

    container.scrollBy({
      left: (THUMBNAIL_SIZE + THUMBNAIL_GAP) * SCROLL_AMOUNT,
      behavior: "smooth",
    })
  }

  // Don't show thumbnails for single image
  if (images.length <= 1) {
    return null
  }

  return (
    <div className="relative flex items-center mt-4">
      {/* Left scroll arrow - Hidden on mobile (touch scroll) */}
      <button
        onClick={scrollLeft}
        className={clx(
          "flex-shrink-0 w-8 h-8 rounded-full",
          "bg-white shadow-md",
          "items-center justify-center",
          "transition-opacity duration-200",
          "mr-2",
          "hidden small:flex", // Hide on mobile
          { "opacity-0 pointer-events-none": !canScrollLeft }
        )}
        aria-label="Scroll thumbnails left"
      >
        <ChevronLeft size="16" />
      </button>

      {/* Thumbnail container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scroll-smooth flex-1"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => onSelect(index)}
            className={clx(
              "flex-shrink-0 relative overflow-hidden rounded-md",
              "w-[60px] h-[60px] small:w-[70px] small:h-[70px] medium:w-20 medium:h-20",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-ui-fg-base",
              {
                "ring-2 ring-ui-fg-base": index === currentIndex,
                "hover:ring-1 hover:ring-ui-fg-subtle opacity-70 hover:opacity-100":
                  index !== currentIndex,
              }
            )}
            aria-label={`View image ${index + 1}`}
            aria-current={index === currentIndex ? "true" : undefined}
          >
            <Image
              src={image.url}
              alt={`Thumbnail ${index + 1}`}
              fill
              className="object-cover"
              sizes="80px"
            />
          </button>
        ))}
      </div>

      {/* Right scroll arrow - Hidden on mobile (touch scroll) */}
      <button
        onClick={scrollRight}
        className={clx(
          "flex-shrink-0 w-8 h-8 rounded-full",
          "bg-white shadow-md",
          "items-center justify-center",
          "transition-opacity duration-200",
          "ml-2",
          "hidden small:flex", // Hide on mobile
          { "opacity-0 pointer-events-none": !canScrollRight }
        )}
        aria-label="Scroll thumbnails right"
      >
        <ChevronRight size="16" />
      </button>
    </div>
  )
}

export default ThumbnailStrip
