import { Container, clx } from "@medusajs/ui"
import Image from "next/image"
import ChevronLeft from "@modules/common/icons/chevron-left"
import ChevronRight from "@modules/common/icons/chevron-right"

interface MainImageProps {
  image: { id: string; url: string } | null
  onNext: () => void
  onPrevious: () => void
  isFirst: boolean
  isLast: boolean
  totalImages: number
  currentIndex: number
  onTouchStart?: (e: React.TouchEvent) => void
  onTouchEnd?: (e: React.TouchEvent) => void
}

const MainImage = ({
  image,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  totalImages,
  currentIndex,
  onTouchStart,
  onTouchEnd,
}: MainImageProps) => {
  // Empty state
  if (!image?.url) {
    return (
      <Container className="relative aspect-square w-full bg-ui-bg-subtle rounded-lg flex items-center justify-center">
        <span className="text-ui-fg-subtle">No image available</span>
      </Container>
    )
  }

  const showArrows = totalImages > 1

  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-lg bg-ui-bg-subtle"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Image
        src={image.url}
        alt="Product image"
        fill
        priority
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
      />

      {/* Left Arrow - Hidden on mobile, use swipe instead */}
      {showArrows && (
        <button
          onClick={onPrevious}
          disabled={isFirst}
          className={clx(
            "absolute left-3 top-1/2 -translate-y-1/2 z-10",
            "w-10 h-10 rounded-full",
            "bg-white/90 hover:bg-white",
            "flex items-center justify-center",
            "shadow-md transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-ui-fg-base",
            "hidden small:flex", // Hide on mobile
            {
              "opacity-0 pointer-events-none": isFirst,
              "opacity-100": !isFirst,
            }
          )}
          aria-label="Previous image"
        >
          <ChevronLeft size="20" />
        </button>
      )}

      {/* Right Arrow - Hidden on mobile, use swipe instead */}
      {showArrows && (
        <button
          onClick={onNext}
          disabled={isLast}
          className={clx(
            "absolute right-3 top-1/2 -translate-y-1/2 z-10",
            "w-10 h-10 rounded-full",
            "bg-white/90 hover:bg-white",
            "flex items-center justify-center",
            "shadow-md transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-ui-fg-base",
            "hidden small:flex", // Hide on mobile
            {
              "opacity-0 pointer-events-none": isLast,
              "opacity-100": !isLast,
            }
          )}
          aria-label="Next image"
        >
          <ChevronRight size="20" />
        </button>
      )}

      {/* Image Counter */}
      {showArrows && (
        <div className="absolute bottom-3 right-3 z-10 px-2 py-1 bg-black/60 rounded text-white text-xs">
          {currentIndex + 1} / {totalImages}
        </div>
      )}
    </div>
  )
}

export default MainImage
